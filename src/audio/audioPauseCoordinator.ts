export type AutomaticPauseReason = 'document-hidden' | 'portfolio-reader'

/** Coordinates independent temporary pause causes without changing user playback preferences. */
export class AudioPauseCoordinator {
  private readonly reasons = new Set<AutomaticPauseReason>()
  private resumeOnRelease = false

  get isPaused() {
    return this.reasons.size > 0
  }

  acquire(reason: AutomaticPauseReason, wasPlaying: boolean) {
    if (this.reasons.has(reason)) return false
    const firstReason = this.reasons.size === 0
    if (firstReason) this.resumeOnRelease = wasPlaying
    this.reasons.add(reason)
    return firstReason
  }

  release(reason: AutomaticPauseReason) {
    if (!this.reasons.delete(reason) || this.reasons.size > 0) return false
    const shouldResume = this.resumeOnRelease
    this.resumeOnRelease = false
    return shouldResume
  }

  requestResumeOnRelease() {
    if (this.isPaused) this.resumeOnRelease = true
  }

  cancelResumeOnRelease() {
    this.resumeOnRelease = false
  }
}
