import { trackError } from "../../shared/util/trackError"
import { MusicCommand } from "./MusicCommand"

class ResumeCommand extends MusicCommand {
  constructor() {
    super("resume", {
      aliases: ["resume"],
      channelRestriction: "guild"
    })
  }

  async execute() {
    try {
      this.musicPlayer.resumeStream()
    } catch (error) {
      trackError(error)
      this.sendMessageToChannel(`Something went wrong... ${error}`)
    }
  }
}

export default ResumeCommand
