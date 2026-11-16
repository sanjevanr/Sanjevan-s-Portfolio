import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent, type RefObject } from 'react'

const MIN_THUMB = 24
const ARROW_STEP = 40

type RetroScrollbarProps = {
  targetRef: RefObject<HTMLDivElement | null>
  targetId: string
  contentKey: string
  className?: string
  persistent?: boolean
}

type ScrollState = {
  size: number
  travel: number
  range: number
  scrollTop: number
  trackHeight: number
  canScroll: boolean
}

/** Classic scrollbar controls that mirror a native, touch and wheel-scrollable viewport. */
export default function RetroScrollbar({ targetRef, targetId, contentKey, className = '', persistent = false }: RetroScrollbarProps) {
  const instanceId = useId()
  const trackRef = useRef<HTMLDivElement>(null)
  const thumbRef = useRef<HTMLDivElement>(null)
  const geometry = useRef({ travel: 0, range: 0 })
  const repeatRef = useRef<number | null>(null)
  const [scrollState, setScrollState] = useState<ScrollState>({
    size: 0,
    travel: 0,
    range: 0,
    scrollTop: 0,
    trackHeight: 0,
    canScroll: false,
  })

  const update = useCallback(() => {
    const target = targetRef.current
    const track = trackRef.current
    if (!target || !track) return

    const range = Math.max(0, target.scrollHeight - target.clientHeight)
    const trackHeight = track.clientHeight
    const canScroll = range > 1 && trackHeight > 0
    const size = canScroll
      ? Math.min(trackHeight, Math.max(MIN_THUMB, trackHeight * target.clientHeight / target.scrollHeight))
      : trackHeight
    const travel = Math.max(0, trackHeight - size)
    const scrollTop = Math.min(range, Math.max(0, target.scrollTop))
    geometry.current = { travel, range }
    setScrollState({ size, travel, range, scrollTop, trackHeight, canScroll })
  }, [targetRef])

  useEffect(() => {
    const target = targetRef.current
    if (!target) return
    let frame = 0
    const schedule = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(update)
    }
    update()
    target.addEventListener('scroll', schedule, { passive: true })
    const observer = new ResizeObserver(schedule)
    observer.observe(target)
    if (trackRef.current) observer.observe(trackRef.current)
    if (target.firstElementChild) observer.observe(target.firstElementChild)
    return () => {
      cancelAnimationFrame(frame)
      target.removeEventListener('scroll', schedule)
      observer.disconnect()
    }
  }, [contentKey, targetRef, update])

  const stopRepeat = useCallback(() => {
    if (repeatRef.current !== null) window.clearInterval(repeatRef.current)
    repeatRef.current = null
  }, [])

  useEffect(() => stopRepeat, [stopRepeat])

  const scrollBy = (top: number) => targetRef.current?.scrollBy({ top })
  const startRepeat = (step: () => void) => (event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0 || !scrollState.canScroll) return
    event.preventDefault()
    step()
    stopRepeat()
    const startedAt = Date.now()
    repeatRef.current = window.setInterval(() => {
      if (Date.now() - startedAt > 320) step()
    }, 60)
  }

  const onTrackDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || !scrollState.canScroll) return
    const page = (targetRef.current?.clientHeight ?? 0) * 0.9
    const pointerY = event.clientY
    startRepeat(() => {
      const thumbBox = thumbRef.current?.getBoundingClientRect()
      if (!thumbBox) return
      if (pointerY < thumbBox.top) scrollBy(-page)
      else if (pointerY > thumbBox.bottom) scrollBy(page)
    })(event)
  }

  const onThumbDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const target = targetRef.current
    if (!target || event.button !== 0 || !scrollState.canScroll) return
    event.preventDefault()
    const thumb = event.currentTarget
    thumb.setPointerCapture(event.pointerId)
    const startY = event.clientY
    const startTop = target.scrollTop
    const { travel, range } = geometry.current
    const move = (moveEvent: PointerEvent) => {
      if (travel > 0) target.scrollTop = startTop + (moveEvent.clientY - startY) * range / travel
    }
    const end = () => {
      thumb.removeEventListener('pointermove', move)
      thumb.removeEventListener('pointerup', end)
      thumb.removeEventListener('pointercancel', end)
      thumb.classList.remove('retro-scrollbar__thumb--active')
    }
    thumb.classList.add('retro-scrollbar__thumb--active')
    thumb.addEventListener('pointermove', move)
    thumb.addEventListener('pointerup', end)
    thumb.addEventListener('pointercancel', end)
  }

  const onThumbKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const target = targetRef.current
    if (!target || !scrollState.canScroll) return
    const page = target.clientHeight * 0.9
    const steps: Record<string, () => void> = {
      ArrowUp: () => scrollBy(-ARROW_STEP),
      ArrowDown: () => scrollBy(ARROW_STEP),
      PageUp: () => scrollBy(-page),
      PageDown: () => scrollBy(page),
      Home: () => { target.scrollTop = 0 },
      End: () => { target.scrollTop = target.scrollHeight },
    }
    const step = steps[event.key]
    if (!step) return
    event.preventDefault()
    step()
  }

  const repeatEvents = { onPointerUp: stopRepeat, onPointerLeave: stopRepeat, onPointerCancel: stopRepeat, onBlur: stopRepeat }
  const thumbPosition = scrollState.range > 0
    ? scrollState.travel * scrollState.scrollTop / scrollState.range
    : 0

  return (
    <div className={`retro-scrollbar ${className}`.trim()}>
      <button
        className="retro-scrollbar__arrow retro-scrollbar__arrow--up"
        type="button"
        aria-label="Scroll up"
        aria-controls={targetId}
        disabled={persistent && !scrollState.canScroll}
        onPointerDown={startRepeat(() => scrollBy(-ARROW_STEP))}
        onClick={(event) => { if (event.detail === 0) scrollBy(-ARROW_STEP) }}
        {...repeatEvents}
      />
      <div ref={trackRef} className="retro-scrollbar__track" onPointerDown={onTrackDown} {...repeatEvents}>
        <div
          ref={thumbRef}
          className={`retro-scrollbar__thumb${persistent && !scrollState.canScroll ? ' retro-scrollbar__thumb--disabled' : ''}`}
          role="scrollbar"
          aria-label="Vertical scroll position"
          aria-controls={targetId}
          aria-orientation="vertical"
          aria-valuemin={0}
          aria-valuemax={scrollState.range}
          aria-valuenow={scrollState.scrollTop}
          aria-disabled={!scrollState.canScroll}
          id={`${instanceId}-thumb`}
          tabIndex={scrollState.canScroll ? 0 : -1}
          onKeyDown={onThumbKeyDown}
          onPointerDown={onThumbDown}
          hidden={!persistent && !scrollState.canScroll}
          style={{
            height: scrollState.trackHeight ? `${scrollState.size}px` : '100%',
            transform: `translateY(${thumbPosition}px)`,
          }}
        />
      </div>
      <button
        className="retro-scrollbar__arrow retro-scrollbar__arrow--down"
        type="button"
        aria-label="Scroll down"
        aria-controls={targetId}
        disabled={!scrollState.canScroll}
        onPointerDown={startRepeat(() => scrollBy(ARROW_STEP))}
        onClick={(event) => { if (event.detail === 0) scrollBy(ARROW_STEP) }}
        {...repeatEvents}
      />
    </div>
  )
}
