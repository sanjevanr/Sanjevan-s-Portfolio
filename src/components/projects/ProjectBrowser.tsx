import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode, type RefObject } from 'react'
import { projectMediaPlaceholder, type PortfolioProject } from '../../data/projects'

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'media', label: 'Media' },
] as const

export type ProjectBrowserTab = (typeof tabs)[number]['id']

function OverviewSection({ id, title, variant, children }: { id: string; title: string; variant?: 'band' | 'highlight'; children: ReactNode }) {
  const modifier = variant === 'band'
    ? ' project-overview__section--band'
    : variant === 'highlight' ? ' project-overview__section--band project-overview__section--highlight' : ''
  return (
    <section className={`project-overview__section${modifier}`} aria-labelledby={id}>
      <h3 id={id} className="project-overview__section-title">{title}</h3>
      {children}
    </section>
  )
}

function OverviewList({ items }: { items: string[] }) {
  return (
    <ul className="project-overview__list">
      {items.map((item) => <li key={item}>{item}</li>)}
    </ul>
  )
}

function Overview({ project, compact }: { project: PortfolioProject; compact: boolean }) {
  const baseId = useId()
  return (
    <article className="project-overview">
      <header className="project-overview__header">
        <h2>{project.title}</h2>
        <p className="project-overview__meta">{project.technologies.join(' / ')}</p>
      </header>
      <OverviewSection id={`${baseId}-about`} title="About the project">
        <p className="project-overview__summary">{project.summary}</p>
      </OverviewSection>
      <OverviewSection id={`${baseId}-features`} title="Key Features & Implementation" variant="band">
        <OverviewList items={project.highlights} />
      </OverviewSection>
      <OverviewSection id={`${baseId}-skills`} title="Skills Learned">
        <OverviewList items={project.skillsLearned} />
      </OverviewSection>
      {project.achievements && (
        <OverviewSection id={`${baseId}-achievements`} title="Achievements" variant="highlight">
          <OverviewList items={project.achievements} />
        </OverviewSection>
      )}
      <OverviewSection id={`${baseId}-links`} title="Links">
        <div className="project-browser__links">
          <a className="project-github-link" href={project.githubUrl} target="_blank" rel="noopener noreferrer" aria-label="View on GitHub (opens in a new tab)">
            {compact ? 'GITHUB' : 'VIEW ON GITHUB'} <span aria-hidden="true">↗</span>
          </a>
          {project.links?.map((link) => (
            <a className="project-github-link project-github-link--secondary" key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" aria-label={`${link.label} (opens in a new tab)`}>
              {compact ? link.shortLabel : link.label} <span aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
      </OverviewSection>
    </article>
  )
}

function Media({ project }: { project: PortfolioProject }) {
  if (project.media.length === 0) return <p className="project-browser__placeholder">{projectMediaPlaceholder}</p>
  return (
    <div className="project-browser__media">
      {project.media.map((item) => (
        item.type === 'video' ? (
          <video key={item.src} src={item.src} controls />
        ) : (
          <img key={item.src} src={item.src} alt={item.alt ?? ''} />
        )
      ))}
    </div>
  )
}

const MIN_THUMB = 24
const ARROW_STEP = 40

/* Drawn scrollbar over native scrolling. macOS and iOS overlay scrollbars
   hide native thumbs, so the native bar is hidden and this one mirrors it. */
function RetroScrollbar({ targetRef, contentKey }: { targetRef: RefObject<HTMLDivElement | null>; contentKey: string }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const thumbRef = useRef<HTMLDivElement>(null)
  const geometry = useRef({ size: 0, travel: 0, range: 0 })
  const repeatRef = useRef<number | null>(null)

  const update = useCallback(() => {
    const target = targetRef.current
    const track = trackRef.current
    const thumb = thumbRef.current
    if (!target || !track || !thumb) return
    const range = target.scrollHeight - target.clientHeight
    const trackHeight = track.clientHeight
    if (range <= 1 || trackHeight <= 0) {
      geometry.current = { size: 0, travel: 0, range: 0 }
      thumb.hidden = true
      return
    }
    const size = Math.min(trackHeight, Math.max(MIN_THUMB, trackHeight * target.clientHeight / target.scrollHeight))
    const travel = trackHeight - size
    geometry.current = { size, travel, range }
    thumb.hidden = false
    thumb.style.height = `${size}px`
    thumb.style.transform = `translateY(${travel * Math.min(1, target.scrollTop / range)}px)`
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
    for (const child of Array.from(target.children)) observer.observe(child)
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

  const startRepeat = (step: () => void) => (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    event.preventDefault()
    step()
    stopRepeat()
    const startedAt = Date.now()
    repeatRef.current = window.setInterval(() => {
      if (Date.now() - startedAt > 320) step()
    }, 60)
  }

  const onTrackDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return
    const thumb = thumbRef.current
    const target = targetRef.current
    if (!thumb || !target || thumb.hidden) return
    const page = target.clientHeight * 0.9
    startRepeat(() => {
      const box = thumb.getBoundingClientRect()
      if (event.clientY < box.top) scrollBy(-page)
      else if (event.clientY > box.bottom) scrollBy(page)
    })(event)
  }

  const onThumbDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const target = targetRef.current
    if (!target || event.button !== 0) return
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

  const repeatEvents = { onPointerUp: stopRepeat, onPointerLeave: stopRepeat, onPointerCancel: stopRepeat }

  return (
    <div className="retro-scrollbar" aria-hidden="true">
      <div className="retro-scrollbar__arrow retro-scrollbar__arrow--up" onPointerDown={startRepeat(() => scrollBy(-ARROW_STEP))} {...repeatEvents} />
      <div ref={trackRef} className="retro-scrollbar__track" onPointerDown={onTrackDown} {...repeatEvents}>
        <div ref={thumbRef} className="retro-scrollbar__thumb" onPointerDown={onThumbDown} hidden />
      </div>
      <div className="retro-scrollbar__arrow retro-scrollbar__arrow--down" onPointerDown={startRepeat(() => scrollBy(ARROW_STEP))} {...repeatEvents} />
    </div>
  )
}

type ProjectBrowserProps = {
  project: PortfolioProject
  activeTab: ProjectBrowserTab
  onTabChange: (tab: ProjectBrowserTab) => void
  compact: boolean
}

export default function ProjectBrowser({ project, activeTab, onTabChange, compact }: ProjectBrowserProps) {
  const baseId = useId()
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [hasSwitched, setHasSwitched] = useState(false)

  const selectTab = (id: ProjectBrowserTab, focusIndex?: number) => {
    if (id !== activeTab) {
      setHasSwitched(true)
      onTabChange(id)
    }
    if (focusIndex !== undefined) tabRefs.current[focusIndex]?.focus()
  }

  const onTabsKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = tabs.findIndex((item) => item.id === activeTab)
    if (index < 0) return
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault()
      const direction = event.key === 'ArrowRight' ? 1 : -1
      const nextIndex = (index + direction + tabs.length) % tabs.length
      selectTab(tabs[nextIndex].id, nextIndex)
      return
    }
    if (event.key === 'Home') {
      event.preventDefault()
      selectTab(tabs[0].id, 0)
      return
    }
    if (event.key === 'End') {
      event.preventDefault()
      selectTab(tabs[tabs.length - 1].id, tabs.length - 1)
    }
  }

  return (
    <section className="project-browser" aria-label="Project browser">
      <header className="retro-window__titlebar project-browser__chrome">
        <div className="project-browser__tabs" role="tablist" aria-label="Project sections" onKeyDown={onTabsKeyDown}>
          {tabs.map((item, index) => {
            const selected = item.id === activeTab
            return (
              <button
                key={item.id}
                ref={(node) => { tabRefs.current[index] = node }}
                id={`${baseId}-tab-${item.id}`}
                className="project-browser__tab"
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`${baseId}-panel`}
                tabIndex={selected ? 0 : -1}
                onClick={() => selectTab(item.id)}
              >
                {item.label}
              </button>
            )
          })}
        </div>
      </header>
      <div className="retro-window__body project-browser__viewport">
        <div ref={scrollerRef} className="project-browser__scroller">
          <div
            key={activeTab}
            id={`${baseId}-panel`}
            className={`project-browser__panel project-browser__panel--${activeTab}${hasSwitched ? ' project-browser__panel--swap' : ''}`}
            role="tabpanel"
            aria-labelledby={`${baseId}-tab-${activeTab}`}
            tabIndex={0}
          >
            {activeTab === 'overview' ? <Overview project={project} compact={compact} /> : <Media project={project} />}
          </div>
        </div>
        <RetroScrollbar targetRef={scrollerRef} contentKey={`${project.id}-${activeTab}-${compact}`} />
      </div>
    </section>
  )
}
