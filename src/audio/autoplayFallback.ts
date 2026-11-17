type RetryTarget = Pick<Document, 'addEventListener' | 'removeEventListener'>

const interactionEvents = ['pointerdown', 'touchstart', 'keydown', 'click'] as const

/** Retry blocked autoplay synchronously during the first trusted user gesture. */
export function installAutoplayFallback(
  target: RetryTarget,
  canRetry: (event: Event) => boolean,
  retry: () => void,
) {
  let active = true
  const remove = () => {
    if (!active) return
    active = false
    for (const type of interactionEvents) target.removeEventListener(type, onInteraction, true)
  }
  const onInteraction = (event: Event) => {
    if (!active || !event.isTrusted || !canRetry(event)) return
    remove()
    retry()
  }
  for (const type of interactionEvents) target.addEventListener(type, onInteraction, { capture: true, passive: true })
  return remove
}
