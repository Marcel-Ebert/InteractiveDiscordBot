import _ from "lodash"
import { setTimeout } from "timers"
import { Subject, PartialObserver, Subscription } from "rxjs"
import { trackError } from "../shared/util/trackError"
import ObservableQueue from "./ObservableQueue"
import StreamManager from "./StreamManager"

class MusicPlayer {
  queue: ObservableQueue<Track>
  private currentDisconnectionTimeout: NodeJS.Timeout
  private streamManager: StreamManager
  private subject: Subject<MusicPlayerSubjectMessage>
  private startPending = false

  constructor(streamManager: StreamManager) {
    this.streamManager = streamManager
    this.queue = new ObservableQueue<Track>()
    this.subject = new Subject<MusicPlayerSubjectMessage>()

    this.queue.subscribe((currentTrack, remainingTracks) => {
      if (currentTrack && !this.startPending && !this.streamManager.playing && !this.paused) {
        this.startStreaming(currentTrack)
      }
      this.subject.next({ messageType: "status", message: "currentSong", data: currentTrack })
      this.subject.next({ messageType: "status", message: "currentQueue", data: remainingTracks })
    })
  }

  get paused() {
    return this.streamManager.paused
  }

  get playing() {
    return this.streamManager.playing
  }

  get queuedTracks() {
    return this.queue.getRemaining()
  }

  get currentTrack() {
    return this.queue.getCurrent()
  }

  get volume() {
    return this.streamManager.getVolume()
  }

  setVolume(newVol: number) {
    try {
      this.streamManager.setVolume(newVol)
    } catch (error) {
      this.subject.next({ messageType: "error", message: error })
    }
  }

  enqueue(track: Track) {
    this.queue.addElement(track)
  }

  enqueueAll(tracks: Track[]) {
    this.queue.addAll(tracks)
  }

  clear() {
    this.queue.clear()
  }

  pauseStream() {
    try {
      this.streamManager.pause()
      this.subject.next({ messageType: "status", message: "paused" })
    } catch (error) {
      this.subject.next({ messageType: "error", message: error })
    }
  }

  resumeStream() {
    if (this.streamManager.paused) {
      try {
        this.streamManager.resume()
        this.subject.next({ messageType: "status", message: "resumed" })
      } catch (error) {
        this.subject.next({ messageType: "error", message: error })
      }
    } else if (this.queuedTracks.length > 0) {
      this.startStreaming(this.currentTrack)
    }
  }

  stopStream() {
    this.subject.next({ messageType: "info", message: `Stopping stream.` })
    this.streamManager.stop()
    this.streamManager.disconnect()
  }

  shuffle() {
    this.queue.shuffle()
  }

  skipForward(amount: number = 1) {
    this.streamManager.skip()
    this.queue.moveForward(amount)
  }

  skipPrevious(amount: number = 1) {
    this.streamManager.skip()
    this.queue.moveBack(amount)
  }

  private disconnectIfReasonable() {
    if (this.queue && this.queue.size() === 0) {
      this.subject.next({ messageType: "info", message: `That's it for now... Later bitches! :metal:` })
      this.streamManager.disconnect()
    }
  }

  private async startStreaming(track: Track) {
    try {
      this.startPending = true
      const dispatcher = await this.streamManager.playTrack(track)
      dispatcher
        .once("start", () => {
          this.startPending = false
          this.subject.next({ messageType: "status", message: "playing" })
          this.subject.next({
            messageType: "info",
            message: `:raised_hands: Let me see your hands while I play *${track.title}* :raised_hands:`
          })
        })
        .once("end", reason => {
          this.subject.next({ messageType: "info", message: `Played: *${track.title}*` })

          if (this.queue.size() === 0) {
            if (!this.currentDisconnectionTimeout) {
              this.currentDisconnectionTimeout = setTimeout(this.disconnectIfReasonable, 1000 * 60 * 15)
            }
            this.currentDisconnectionTimeout.refresh()
          }

          if (reason !== "forceStop" && reason !== "skip") {
            if (this.queue.size() > 0) {
              this.queue.moveForward()
            }
          }
        })
        .on("error", e => {
          trackError(e, "MusicPlayer.startStreaming on-dispatcher-error")
          this.subject.next({ messageType: "error", message: e.message })
        })
    } catch (error) {
      this.startPending = false
      const errorMessage = `Could not start stream for track '${track.title}': ${error}`
      trackError(errorMessage, "MusicPlayer.startStreaming try-catch-error")
      this.subject.next({ messageType: "error", message: errorMessage })
    }
  }

  subscribe(observer: PartialObserver<MusicPlayerSubjectMessage>): Subscription {
    return this.subject.subscribe(observer)
  }
}

export default MusicPlayer
