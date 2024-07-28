import {
  ApplicationCommandDataResolvable,
  ChatInputCommandInteraction,
  Client,
  Collection,
  Events,
  Interaction,
  REST,
  Routes,
  Snowflake,
} from "discord.js"
import { readdirSync } from "fs"
import { join } from "path"
import { Command } from "../interfaces/Command"
import { checkPermissions, PermissionResult } from "../utils/checkPermissions"
import { MissingPermissionsException } from "../utils/MissingPermissionsException"
import { MusicQueue } from "./MusicQueue"
import config from "../utils/config"

export class Bot {
  public readonly prefix = "/"
  public commands = new Collection<string, Command>()
  public slashCommands = new Array<ApplicationCommandDataResolvable>()
  public slashCommandsMap = new Collection<string, Command>()
  public cooldowns = new Collection<string, Collection<Snowflake, number>>()
  public queues = new Collection<Snowflake, MusicQueue>()

  public constructor(public readonly client: Client) {
    this.client.login(config.BOT_TOKEN)

    this.client.on("ready", () => {
      console.log(`${this.client.user!.username} ready!`)

      this.registerSlashCommands()
    })

    this.client.on("warn", (info) => console.log(info))
    this.client.on("error", console.error)

    this.onInteractionCreate()
  }

  private async registerSlashCommands() {
    const rest = new REST({ version: "9" }).setToken(config.BOT_TOKEN)

    const commandFiles = readdirSync(join(__dirname, "..", "commands")).filter((file) => !file.endsWith(".map"))

    for (const file of commandFiles) {
      const command = await import(join(__dirname, "..", "commands", `${file}`))

      this.slashCommands.push(command.default.data)
      this.slashCommandsMap.set(command.default.data.name, command.default)
    }

    await rest.put(Routes.applicationCommands(this.client.user!.id), { body: this.slashCommands })
  }

  private async onInteractionCreate() {
    this.client.on(Events.InteractionCreate, async (interaction: Interaction): Promise<any> => {
      if (!interaction.isChatInputCommand()) return

      const command = this.slashCommandsMap.get(interaction.commandName)

      if (!command) return

      if (!this.cooldowns.has(interaction.commandName)) {
        this.cooldowns.set(interaction.commandName, new Collection())
      }

      const now = Date.now()
      const timestamps = this.cooldowns.get(interaction.commandName)!
      const cooldownAmount = (command.cooldown || 1) * 1000

      const timestamp = timestamps.get(interaction.user.id)

      if (timestamp) {
        const expirationTime = timestamp + cooldownAmount

        if (now < expirationTime) {
          const timeLeft = (expirationTime - now) / 1000
          return interaction.reply({
            content: `Please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${
              command.data.name
            }\` command.`,
            ephemeral: true,
          })
        }
      }

      timestamps.set(interaction.user.id, now)
      setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount)

      try {
        const permissionsCheck: PermissionResult = await checkPermissions(command, interaction)

        if (permissionsCheck.result) {
          command.execute(interaction as ChatInputCommandInteraction)
        } else {
          throw new MissingPermissionsException(permissionsCheck.missing)
        }
      } catch (error: any) {
        console.error(error)

        if (error.message.includes("permissions")) {
          interaction.reply({ content: error.toString(), ephemeral: true }).catch(console.error)
        } else {
          interaction.reply({ content: "Command errored", ephemeral: true }).catch(console.error)
        }
      }
    })
  }
}
