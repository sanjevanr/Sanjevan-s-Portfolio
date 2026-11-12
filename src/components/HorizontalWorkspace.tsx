import { useLayoutEffect, useRef, type KeyboardEvent, type ReactNode, type WheelEvent } from 'react'

type HorizontalWorkspaceProps = {
  children: ReactNode
  label: string
}

export default function HorizontalWorkspace({ children, label }: HorizontalWorkspaceProps) {
  const workspaceRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (workspaceRef.current) workspaceRef.current.scrollLeft = 0
  }, [])

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const workspace = workspaceRef.current
    if (!workspace) return
    const behavior = reduceMotion ? 'instant' : 'smooth'
    if (event.key === 'Home') workspace.scrollTo({ left: 0, behavior })
    else if (event.key === 'End') workspace.scrollTo({ left: workspace.scrollWidth, behavior })
    else workspace.scrollBy({ left: event.key === 'ArrowRight' ? 100 : -100, behavior })
  }

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (!event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return
    if (event.target instanceof Element && event.target.closest('.retro-window__body')) return
    event.preventDefault()
    event.currentTarget.scrollLeft += event.deltaY
  }

  return (
    <div
      ref={workspaceRef}
      className="horizontal-workspace"
      role="region"
      aria-label={label}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onWheel={handleWheel}
    >
      {children}
    </div>
  )
}
