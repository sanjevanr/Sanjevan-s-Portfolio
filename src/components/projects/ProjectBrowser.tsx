import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { projectMediaPlaceholder, titleFromFilename, type PortfolioProject, type ProjectMedia } from '../../data/projects'

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
          {project.githubUrl && (
            <a className="project-github-link" href={project.githubUrl} target="_blank" rel="noopener noreferrer" aria-label="View on GitHub (opens in a new tab)">
              {compact ? 'GITHUB' : 'VIEW ON GITHUB'} <span aria-hidden="true">↗</span>
            </a>
          )}
          {project.links?.map((link) => (
            <a className="project-github-link project-github-link--secondary" key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" aria-label={`${compact ? link.shortLabel : link.label} (opens in a new tab)`}>
              {compact ? link.shortLabel : link.label} <span aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
      </OverviewSection>
    </article>
  )
}

const mediaLabel = (item: ProjectMedia) => item.title ?? (item.type === 'youtube' ? 'YouTube video' : titleFromFilename(item.src))
const youTubeThumbnails = (videoId: string) => [
  `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
  `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
]

function YouTubeThumbnail({ videoId }: { videoId: string }) {
  const [attempt, setAttempt] = useState(0)
  const sources = youTubeThumbnails(videoId)
  return (
    <img
      src={sources[attempt]}
      alt=""
      draggable={false}
      onError={() => { if (attempt < sources.length - 1) setAttempt(attempt + 1) }}
    />
  )
}

/** Thumbnail until the user presses play, then the embedded player. */
function YouTubeSlide({ item, playing, onPlay }: { item: Extract<ProjectMedia, { type: 'youtube' }>; playing: boolean; onPlay: () => void }) {
  return (
    <div className="project-media__youtube">
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${item.videoId}?autoplay=1&rel=0&playsinline=1`}
          title={item.title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <button type="button" className="project-media__youtube-poster" onClick={onPlay} aria-label={`Play ${item.title}`}>
          <YouTubeThumbnail videoId={item.videoId} />
          <span className="project-media__youtube-play" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

function ExpandButton({ buttonRef, onClick }: { buttonRef?: RefObject<HTMLButtonElement | null>; onClick: () => void }) {
  return (
    <button ref={buttonRef} type="button" className="project-media__expand" onClick={onClick} title="Maximise media" aria-label="Maximise media">
      <span className="project-media__expand-icon" aria-hidden="true" />
    </button>
  )
}

function arrowKeyStep(event: KeyboardEvent<HTMLElement>) {
  if (event.key === 'ArrowLeft') return -1
  if (event.key === 'ArrowRight') return 1
  return 0
}

/* Rendered into document.body only while open, so it is centred on the
   viewport whatever transforms Projects.exe has, and unmounting it stops
   any playing video. */
function MediaViewer({
  items,
  index,
  onSelect,
  onClose,
}: {
  items: ProjectMedia[]
  index: number
  onSelect: (index: number) => void
  onClose: () => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [playingKey, setPlayingKey] = useState<string | null>(null)
  const item = items[index]
  const label = mediaLabel(item)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (!dialog.open) dialog.showModal()
    const root = document.documentElement
    const previousOverflow = root.style.overflow
    root.style.overflow = 'hidden'
    return () => {
      root.style.overflow = previousOverflow
      if (dialog.open) dialog.close()
    }
  }, [])

  const select = (next: number) => {
    setPlayingKey(null)
    onSelect(next)
  }

  return createPortal(
    <dialog
      ref={dialogRef}
      className="media-viewer"
      aria-label={`Expanded media: ${label}`}
      onCancel={(event) => { event.preventDefault(); event.stopPropagation(); onClose() }}
      onClose={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation()
        if (event.target === event.currentTarget) onClose()
      }}
      onKeyDown={(event) => {
        event.stopPropagation()
        if (event.key === 'Escape') {
          event.preventDefault()
          onClose()
          return
        }
        const step = arrowKeyStep(event)
        if (step === 0 || items.length < 2) return
        event.preventDefault()
        select(index + step)
      }}
    >
      <div className="media-viewer__window">
        <header className="media-viewer__titlebar">
          <span>{label}</span>
          <button className="media-viewer__close" type="button" onClick={onClose} aria-label="Close expanded media" title="Close">×</button>
        </header>
        <div className={`media-viewer__content${items.length === 1 ? ' media-viewer__content--solo' : ''}`}>
          {items.length > 1 && <button type="button" className="media-viewer__arrow" onClick={() => select(index - 1)} aria-label="Previous media">‹</button>}
          <figure className="media-viewer__figure">
            <div className={`media-viewer__media media-viewer__media--${item.type}`}>
              {item.type === 'image' && <img key={item.src} src={item.src} alt={item.alt ?? label} draggable={false} />}
              {item.type === 'video' && <video key={item.src} src={item.src} controls playsInline preload="metadata" aria-label={item.alt ?? label} />}
              {item.type === 'youtube' && <YouTubeSlide key={item.videoId} item={item} playing={playingKey === item.videoId} onPlay={() => setPlayingKey(item.videoId)} />}
            </div>
            <figcaption>
              <strong>{label}</strong>
              {item.description && <span>{item.description}</span>}
            </figcaption>
          </figure>
          {items.length > 1 && <button type="button" className="media-viewer__arrow" onClick={() => select(index + 1)} aria-label="Next media">›</button>}
        </div>
      </div>
    </dialog>,
    document.body,
  )
}

function MediaThumbnail({ item }: { item: ProjectMedia }) {
  if (item.type === 'youtube') return <YouTubeThumbnail videoId={item.videoId} />
  if (item.type === 'video') return <video src={item.src} muted playsInline preload="metadata" tabIndex={-1} aria-hidden="true" />
  return <img src={item.src} alt="" draggable={false} />
}

function Media({
  project,
  selectedIndex,
  onSelectedIndexChange,
}: {
  project: PortfolioProject
  selectedIndex: number
  onSelectedIndexChange: (index: number) => void
}) {
  const media = project.media
  const [viewerOpen, setViewerOpen] = useState(false)
  const [playingKey, setPlayingKey] = useState<string | null>(null)
  const expandButtonRef = useRef<HTMLButtonElement>(null)
  const inlineVideoRef = useRef<HTMLVideoElement>(null)
  const thumbnailRefs = useRef<Array<HTMLButtonElement | null>>([])
  const touchStartX = useRef<number | null>(null)
  const index = Math.max(0, Math.min(selectedIndex, media.length - 1))
  const current = media[index]

  useEffect(() => {
    setViewerOpen(false)
    setPlayingKey(null)
  }, [project.id])

  useEffect(() => {
    thumbnailRefs.current[index]?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }, [index])

  if (media.length === 0) return <p className="project-browser__placeholder">{project.id === 'unilinq' ? 'MEDIA COMING SOON' : projectMediaPlaceholder}</p>

  const select = (next: number) => {
    setPlayingKey(null)
    onSelectedIndexChange((next + media.length) % media.length)
  }
  const openViewer = () => {
    setPlayingKey(null)
    inlineVideoRef.current?.pause()
    setViewerOpen(true)
  }
  const closeViewer = () => {
    setViewerOpen(false)
    requestAnimationFrame(() => expandButtonRef.current?.focus())
  }
  const label = mediaLabel(current)

  return (
    <>
      <section
        className="project-media"
        aria-label={`${project.title} media carousel`}
        tabIndex={0}
        onKeyDown={(event) => {
          const step = arrowKeyStep(event)
          if (step === 0 || media.length < 2) return
          event.preventDefault()
          select(index + step)
        }}
        onPointerDown={(event) => { if (event.pointerType === 'touch') touchStartX.current = event.clientX }}
        onPointerUp={(event) => {
          if (event.pointerType !== 'touch' || touchStartX.current === null) return
          const delta = event.clientX - touchStartX.current
          touchStartX.current = null
          if (Math.abs(delta) > 40 && media.length > 1) select(index + (delta < 0 ? 1 : -1))
        }}
        onPointerCancel={() => { touchStartX.current = null }}
      >
        <div className="project-media__stage">
          <div className={`project-media__current project-media__current--${current.type}${current.type === 'image' ? '' : ' project-media__current--player'}`}>
            {current.type === 'image' && <img key={current.src} src={current.src} alt={current.alt ?? label} draggable={false} onClick={openViewer} />}
            {current.type === 'video' && <video key={current.src} ref={inlineVideoRef} src={current.src} controls playsInline preload="metadata" aria-label={current.alt ?? label} />}
            {current.type === 'youtube' && <YouTubeSlide key={current.videoId} item={current} playing={playingKey === current.videoId} onPlay={() => setPlayingKey(current.videoId)} />}
            <ExpandButton buttonRef={expandButtonRef} onClick={openViewer} />
          </div>
        </div>
        <div className="project-media__meta">
          <h3>{label}</h3>
          <div className="project-media__controls">
            {media.length > 1 && <button type="button" className="project-media__arrow" onClick={() => select(index - 1)} aria-label="Previous media">‹</button>}
            <span aria-live="polite">{String(index + 1).padStart(2, '0')} / {String(media.length).padStart(2, '0')}</span>
            {media.length > 1 && <button type="button" className="project-media__arrow" onClick={() => select(index + 1)} aria-label="Next media">›</button>}
          </div>
        </div>
        {media.length > 1 && (
          <div className="project-media__filmstrip" role="group" aria-label="Choose media">
            {media.map((item, itemIndex) => (
              <button
                key={item.type === 'youtube' ? item.videoId : item.src}
                ref={(node) => { thumbnailRefs.current[itemIndex] = node }}
                type="button"
                className="project-media__thumbnail"
                aria-label={`Show ${mediaLabel(item)}`}
                aria-pressed={itemIndex === index}
                onClick={() => select(itemIndex)}
              >
                <MediaThumbnail item={item} />
              </button>
            ))}
          </div>
        )}
      </section>

      {viewerOpen && <MediaViewer items={media} index={index} onSelect={select} onClose={closeViewer} />}
    </>
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
  const [mediaSelections, setMediaSelections] = useState<Record<string, number>>({})

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
      <header className="project-browser__chrome">
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
        <div ref={scrollerRef} className={`project-browser__scroller${activeTab === 'media' ? ' project-browser__scroller--media' : ''}`}>
          <div
            key={activeTab}
            id={`${baseId}-panel`}
            className={`project-browser__panel project-browser__panel--${activeTab}${hasSwitched ? ' project-browser__panel--swap' : ''}`}
            role="tabpanel"
            aria-labelledby={`${baseId}-tab-${activeTab}`}
            tabIndex={0}
          >
            {activeTab === 'overview' ? <Overview project={project} compact={compact} /> : (
              <Media
                project={project}
                selectedIndex={mediaSelections[project.id] ?? 0}
                onSelectedIndexChange={(index) => setMediaSelections((current) => ({ ...current, [project.id]: index }))}
              />
            )}
          </div>
        </div>
        <RetroScrollbar targetRef={scrollerRef} contentKey={`${project.id}-${activeTab}-${compact}`} />
      </div>
    </section>
  )
}
