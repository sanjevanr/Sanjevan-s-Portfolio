import type { ActualPlayback } from './audioState'

export interface MediaLike {
  src: string
  readonly currentSrc: string
  readonly paused: boolean
  readonly ended: boolean
  readonly readyState: number
  readonly error: { code: number } | null
  play(): Promise<void>
  pause(): void
  load(): void
  addEventListener(type: string, listener: () => void): void
  removeEventListener(type: string, listener: () => void): void
}

export type TransportReport = { operationId: number; status: ActualPlayback }
export type TransportLogger = (message: string, details?: unknown) => void

function errorName(error: unknown) {
  if (error && typeof error === 'object' && 'name' in error) return String((error as { name: unknown }).name)
  return 'PlaybackError'
}

export class AudioTransport {
  private operationId = 0
  private assignedSrc: string | null = null
  private playPending = false
  private wantsPlay = false
  private destroyed = false
  private readonly media: MediaLike
  private readonly onReport: (report: TransportReport) => void
  private readonly log?: TransportLogger
  private readonly listeners: Array<[string, () => void]>

  constructor(media: MediaLike, onReport: (report: TransportReport) => void, log?: TransportLogger) {
    this.media = media
    this.onReport = onReport
    this.log = log
    this.listeners = [
      ['playing', () => {
        if (this.media.paused) return
        if (!this.wantsPlay) {
          this.media.pause()
          return
        }
        this.playPending = false
        this.report(this.operationId, 'playing')
      }],
      ['pause', () => {
        if (this.playPending) return
        this.report(this.operationId, 'paused')
      }],
      ['ended', () => {
        this.playPending = false
        this.report(this.operationId, 'paused')
      }],
      ['error', () => {
        if (!this.media.error) return
        this.playPending = false
        this.log?.('[audio] media error', { code: this.media.error.code })
        this.report(this.operationId, 'error')
      }],
    ]
    for (const [type, listener] of this.listeners) media.addEventListener(type, listener)
  }

  destroy() {
    this.destroyed = true
    for (const [type, listener] of this.listeners) this.media.removeEventListener(type, listener)
  }

  activate(src: string | null, shouldPlay: boolean, operationId: number) {
    this.operationId = operationId
    this.wantsPlay = src !== null && shouldPlay
    if (src === null || !shouldPlay) {
      this.playPending = false
      if (!this.media.paused) this.media.pause()
      if (src !== null) this.assign(src)
      this.report(operationId, 'paused')
      return
    }
    const switching = this.assign(src)
    if (!switching && !this.media.paused && !this.media.ended) {
      this.report(operationId, 'playing')
      return
    }
    this.attemptPlay(operationId)
  }

  playFromGesture(operationId: number) {
    this.operationId = operationId
    this.wantsPlay = true
    this.attemptPlay(operationId)
  }

  pause(operationId: number) {
    this.operationId = operationId
    this.wantsPlay = false
    this.playPending = false
    this.media.pause()
    this.report(operationId, 'paused')
  }

  private assign(src: string) {
    if (this.assignedSrc === src) return false
    if (!this.media.paused) this.media.pause()
    this.assignedSrc = src
    this.media.src = src
    this.media.load()
    return true
  }

  private attemptPlay(operationId: number) {
    this.playPending = true
    this.report(operationId, 'loading')
    this.log?.('[audio] play attempt', {
      src: this.assignedSrc,
      paused: this.media.paused,
      readyState: this.media.readyState,
      currentSrc: this.media.currentSrc,
    })
    let attempt: Promise<void>
    try {
      attempt = this.media.play()
    } catch (error) {
      this.handleFailure(operationId, error)
      return
    }
    attempt.then(
      () => {
        if (!this.wantsPlay && !this.media.paused) this.media.pause()
        if (operationId !== this.operationId) return
        this.playPending = false
        this.report(operationId, this.media.paused ? 'paused' : 'playing')
      },
      (error: unknown) => this.handleFailure(operationId, error),
    )
  }

  private handleFailure(operationId: number, error: unknown) {
    if (operationId !== this.operationId) return
    const name = errorName(error)
    if (name === 'AbortError') return
    this.playPending = false
    if (name === 'NotAllowedError') {
      this.log?.('[audio] autoplay rejected', error)
      this.report(operationId, 'blocked')
      return
    }
    this.log?.('[audio] playback failed', error)
    this.report(operationId, 'error')
  }

  private report(operationId: number, status: ActualPlayback) {
    if (this.destroyed) return
    this.onReport({ operationId, status })
  }
}
