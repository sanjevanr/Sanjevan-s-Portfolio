import { describe, expect, it, vi } from 'vitest'
import { installAutoplayFallback } from './autoplayFallback'

class FakeTarget {
  listeners = new Map<string, EventListener>()
  addEventListener(type: string, listener: EventListenerOrEventListenerObject) {
    this.listeners.set(type, typeof listener === 'function' ? listener : listener.handleEvent.bind(listener))
  }
  removeEventListener(type: string) { this.listeners.delete(type) }
  send(type: string, isTrusted: boolean) {
    this.listeners.get(type)?.({ isTrusted } as Event)
  }
}

describe('first-interaction autoplay fallback', () => {
  it('retries synchronously on the first trusted gesture and removes listeners', () => {
    const target = new FakeTarget()
    const retry = vi.fn()
    const remove = installAutoplayFallback(target as unknown as Document, () => true, retry)

    target.send('pointerdown', false)
    expect(retry).not.toHaveBeenCalled()
    target.send('keydown', true)
    expect(retry).toHaveBeenCalledTimes(1)
    expect(target.listeners.size).toBe(0)
    target.send('click', true)
    expect(retry).toHaveBeenCalledTimes(1)
    remove()
  })

  it('keeps waiting when playback is paused or automatically suspended', () => {
    const target = new FakeTarget()
    const retry = vi.fn()
    let eligible = false
    installAutoplayFallback(target as unknown as Document, () => eligible, retry)
    target.send('click', true)
    expect(retry).not.toHaveBeenCalled()
    expect(target.listeners.size).toBeGreaterThan(0)
    eligible = true
    target.send('click', true)
    expect(retry).toHaveBeenCalledTimes(1)
  })
})
