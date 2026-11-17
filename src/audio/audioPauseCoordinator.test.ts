import { describe, expect, it } from 'vitest'
import { AudioPauseCoordinator } from './audioPauseCoordinator'

describe('AudioPauseCoordinator', () => {
  it('resumes only after the final automatic pause reason clears', () => {
    const pauses = new AudioPauseCoordinator()
    expect(pauses.acquire('portfolio-reader', true)).toBe(true)
    expect(pauses.acquire('document-hidden', false)).toBe(false)
    expect(pauses.release('portfolio-reader')).toBe(false)
    expect(pauses.isPaused).toBe(true)
    expect(pauses.release('document-hidden')).toBe(true)
    expect(pauses.isPaused).toBe(false)
  })

  it('does not resume when playback was already paused before suspension', () => {
    const pauses = new AudioPauseCoordinator()
    pauses.acquire('document-hidden', false)
    expect(pauses.release('document-hidden')).toBe(false)
  })

  it('manual pause cancels an automatic resume request', () => {
    const pauses = new AudioPauseCoordinator()
    pauses.acquire('portfolio-reader', true)
    pauses.cancelResumeOnRelease()
    expect(pauses.release('portfolio-reader')).toBe(false)
  })

  it('a deliberate Play request while suspended resumes after all reasons clear', () => {
    const pauses = new AudioPauseCoordinator()
    pauses.acquire('portfolio-reader', false)
    pauses.requestResumeOnRelease()
    expect(pauses.release('portfolio-reader')).toBe(true)
  })

  it('ignores duplicate acquisition and release calls', () => {
    const pauses = new AudioPauseCoordinator()
    expect(pauses.acquire('document-hidden', true)).toBe(true)
    expect(pauses.acquire('document-hidden', false)).toBe(false)
    expect(pauses.release('document-hidden')).toBe(true)
    expect(pauses.release('document-hidden')).toBe(false)
  })
})
