import { lazy, Suspense, useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { createPortal } from 'react-dom'
import { photoPortfolios, videoUploads, type PhotoPortfolio, type FinderVideo } from '../../data/mediaLibrary'
import { mobileHomeQuery, tabletHomeQuery, useHomeAudio, useMediaQuery } from '../HomeAudio'
import RetroWindow from '../RetroWindow'
import SpotifyPlayer from '../SpotifyPlayer'

type Place = 'media' | 'type' | 'photo' | 'video' | 'portfolios' | 'capsules' | `video-item:${string}`
type Entry =
  | { kind: 'folder'; id: 'type' | 'photo' | 'video' | 'portfolios' | 'capsules'; name: string }
  | { kind: 'portfolio'; item: PhotoPortfolio }
  | { kind: 'video'; item: FinderVideo }

const placeName: Record<'media' | 'type' | 'photo' | 'video' | 'portfolios' | 'capsules', string> = {
  media: 'Media', type: 'Type', photo: 'Photo', video: 'Video', portfolios: 'Portfolios', capsules: 'Capsules',
}
const placeParent: Partial<Record<Place, Place>> = { type: 'media', photo: 'type', video: 'type', portfolios: 'photo', capsules: 'photo' }

const loadPortfolioReader = () => import('./PortfolioReader')
const PortfolioReader = lazy(loadPortfolioReader)

function PortfolioReaderLoadingShell({ portfolio, onClose }: { portfolio: PhotoPortfolio; onClose: () => void }) {
  return createPortal((
    <div className="ibooks-reader ibooks-reader--loading" role="dialog" aria-modal="true" aria-label={`Reading ${portfolio.name}`}>
      <header className="ibooks-toolbar">
        <div className="ibooks-toolbar__titlebar"><h1 className="ibooks-toolbar__title" title={portfolio.name}>{portfolio.name}</h1></div>
        <div className="ibooks-toolbar__controls" aria-hidden="true">
          <button className="ibooks-control ibooks-control--back" type="button" onClick={onClose} aria-label="Back to Finder">‹ <span>Finder</span></button>
        </div>
      </header>
      <div className="ibooks-stage"><span className="sr-only" role="status">Opening {portfolio.name}</span></div>
      <footer className="ibooks-reader__footer" />
    </div>
  ), document.body)
}

function placeTitle(place: Place) {
  if (place.startsWith('video-item:')) return videoUploads.find((item) => item.id === place.slice(11))?.title ?? 'Video Preview'
  return placeName[place as keyof typeof placeName]
}

function pathFor(place: Place): Place[] {
  if (place.startsWith('video-item:')) return ['media', 'type', 'video', place]
  if (place === 'media') return ['media']
  if (place === 'type') return ['media', 'type']
  if (place === 'portfolios' || place === 'capsules') return ['media', 'type', 'photo', place]
  if (place === 'photo' || place === 'video') return ['media', 'type', place]
  return ['media', 'type', place]
}

function FinderIcon({ type, file = false }: { type: 'computer' | 'folder' | 'photo' | 'video' | 'drive' | 'youtube'; file?: boolean }) {
  if (type === 'folder') return <span className="finder-icon finder-icon--folder" aria-hidden="true"><i /></span>
  if (type === 'computer') return <span className="finder-icon finder-icon--computer" aria-hidden="true"><i /></span>
  if (type === 'photo') return <span className="finder-icon finder-icon--photo" aria-hidden="true">▧</span>
  if (type === 'video') return file
    ? <span className="finder-icon finder-icon--video-file" aria-hidden="true"><i /><b>▶</b></span>
    : <span className="finder-icon finder-icon--video" aria-hidden="true">▶</span>
  if (type === 'drive') return <span className="finder-link-icon" aria-hidden="true">↗</span>
  return <span className="finder-link-icon finder-link-icon--youtube" aria-hidden="true">▶</span>
}

function MediaFinder({ onVideoPreviewChange, onPortfolioOpen, preferWideThumbnail }: { onVideoPreviewChange: (isPreview: boolean) => void; onPortfolioOpen: (portfolio: PhotoPortfolio) => void; preferWideThumbnail: boolean }) {
  const [place, setPlace] = useState<Place>('type')
  const [history, setHistory] = useState<Place[]>(['type'])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [missingPreview, setMissingPreview] = useState(false)
  const [thumbnailFallback, setThumbnailFallback] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])
  const touchOpensRef = useRef(false)

  useEffect(() => {
    onVideoPreviewChange(place.startsWith('video-item:'))
  }, [onVideoPreviewChange, place])

  useEffect(() => {
    if (place === 'portfolios') void loadPortfolioReader().catch(() => undefined)
  }, [place])

  const goTo = (target: Place, record = true) => {
    setPlace(target)
    setSelected(null)
    setMissingPreview(false)
    setThumbnailFallback(false)
    if (record) {
      const nextHistory = history.slice(0, historyIndex + 1)
      if (nextHistory[nextHistory.length - 1] !== target) nextHistory.push(target)
      setHistory(nextHistory)
      setHistoryIndex(nextHistory.length - 1)
    }
  }
  const moveHistory = (nextIndex: number) => {
    const target = history[nextIndex]
    if (!target) return
    setHistoryIndex(nextIndex)
    goTo(target, false)
  }
  const entries = useMemo<Entry[]>(() => {
    if (place === 'media') return [{ kind: 'folder', id: 'type', name: 'Type' }]
    if (place === 'type') return [
      { kind: 'folder', id: 'photo', name: 'Photo' },
      { kind: 'folder', id: 'video', name: 'Video' },
    ]
    if (place === 'photo') return [
      { kind: 'folder', id: 'portfolios', name: 'Portfolios' },
      { kind: 'folder', id: 'capsules', name: 'Capsules' },
    ]
    if (place === 'portfolios') return photoPortfolios.map((item) => ({ kind: 'portfolio', item }))
    if (place === 'video') return videoUploads.map((item) => ({ kind: 'video', item }))
    return []
  }, [place])
  const totalItems = place.startsWith('video-item:') ? 1 : entries.length
  const goUp = () => {
    const parent = place.startsWith('video-item:') ? 'video' : placeParent[place]
    if (parent) goTo(parent)
  }
  const openEntry = (entry: Entry) => {
    if (entry.kind === 'folder') goTo(entry.id)
    else if (entry.kind === 'portfolio') {
      setSelected(entry.item.id)
      onPortfolioOpen(entry.item)
    }
    else goTo(`video-item:${entry.item.id}`)
  }
  const currentItem = place.startsWith('video-item:') ? videoUploads.find((item) => item.id === place.slice(11)) : undefined

  const handleCanvasKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Backspace' || event.key === 'ArrowLeft') {
      if (event.target === canvasRef.current) goUp()
      return
    }
    const currentIndex = entries.findIndex((entry) => (entry.kind === 'folder' ? entry.id : entry.item.id) === selected)
    let nextIndex = currentIndex
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = Math.min(entries.length - 1, Math.max(0, currentIndex + 1))
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = Math.max(0, currentIndex < 0 ? 0 : currentIndex - 1)
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = entries.length - 1
    else if (event.key === 'Enter' && selected) {
      const item = entries.find((entry) => (entry.kind === 'folder' ? entry.id : entry.item.id) === selected)
      if (item) openEntry(item)
      return
    } else return
    if (entries.length === 0 || nextIndex < 0) return
    event.preventDefault()
    const next = entries[nextIndex]
    const nextId = next.kind === 'folder' ? next.id : next.item.id
    setSelected(nextId)
    optionRefs.current[nextIndex]?.focus()
  }
  const handleItemPointerDown = (event: PointerEvent<HTMLElement>) => {
    touchOpensRef.current = event.pointerType === 'touch'
  }

  return (
    <div className={`finder-window${place.startsWith('video-item:') ? ' finder-window--video-preview' : ''}`}>
      <div className="finder-toolbar" aria-label="Finder toolbar">
        <div className="finder-history-controls">
          <button type="button" aria-label="Back" title="Back" disabled={historyIndex <= 0} onClick={() => moveHistory(historyIndex - 1)}>‹</button>
          <button type="button" aria-label="Forward" title="Forward" disabled={historyIndex >= history.length - 1} onClick={() => moveHistory(historyIndex + 1)}>›</button>
        </div>
        <nav className="finder-breadcrumbs" aria-label="Current folder path">
          {pathFor(place).map((part, index, path) => (
            <span className={`finder-breadcrumb${index === path.length - 1 ? ' is-current' : ''}`} key={`${part}-${index}`}>
              {index > 0 && <span aria-hidden="true">›</span>}
              <button type="button" aria-current={index === path.length - 1 ? 'location' : undefined} onClick={() => goTo(part)}>{placeTitle(part)}</button>
            </span>
          ))}
        </nav>
      </div>

      <div className="finder-layout">
        <aside className="finder-sidebar" aria-label="Finder shortcuts">
          <h3>Favourites</h3>
          <button className={place === 'type' ? 'is-current' : ''} type="button" onClick={() => goTo('type')}><FinderIcon type="computer" />Type</button>
          <button className={place === 'photo' ? 'is-current' : ''} type="button" onClick={() => goTo('photo')}><FinderIcon type="photo" />Photo</button>
          <button className={place === 'video' ? 'is-current' : ''} type="button" onClick={() => goTo('video')}><FinderIcon type="video" />Video</button>
        </aside>

        <div ref={canvasRef} className={`finder-canvas${place.startsWith('video-item:') ? ' finder-canvas--video-preview' : ''}`} tabIndex={0} aria-label={`${placeTitle(place)} contents`} onKeyDown={handleCanvasKeyDown}>
        {currentItem ? (
              <div className="finder-video-preview">
                <section className="finder-video-copy" aria-label="Video description and production details">
                  <h2 className="finder-video-title">{currentItem.title}</h2>
                  {currentItem.description && <p className="finder-video-description">{currentItem.description}</p>}
                  {(currentItem.camera || currentItem.editing || currentItem.colourGrading || currentItem.editingAndColourGrading || currentItem.song) && <hr className="finder-video-separator" />}
                  <dl className="finder-video-details">
                    {currentItem.camera && <div><dt>Camera</dt><dd>{currentItem.camera}</dd></div>}
                    {currentItem.editing && <div><dt>Editing</dt><dd>{currentItem.editing}</dd></div>}
                    {currentItem.colourGrading && <div><dt>Colour grading</dt><dd>{currentItem.colourGrading}</dd></div>}
                    {currentItem.editingAndColourGrading && <div><dt>Editing &amp; colour grading</dt><dd>{currentItem.editingAndColourGrading}</dd></div>}
                    {currentItem.song && <div><dt>Song</dt><dd>{currentItem.song}</dd></div>}
                  </dl>
                </section>
                <a className={`finder-video-thumbnail${currentItem.id === 'biovortex' ? ' finder-video-thumbnail--biovortex' : ''}`} href={currentItem.youtubeUrl} target="_blank" rel="noopener noreferrer" aria-label={`Watch ${currentItem.title} on YouTube (opens in a new tab)`}>
                  {!missingPreview ? <img src={currentItem.id === 'biovortex' && preferWideThumbnail && !thumbnailFallback ? 'https://i.ytimg.com/vi/cJjj_YPVw1I/maxresdefault.jpg' : currentItem.thumbnail} alt={`${currentItem.title} YouTube thumbnail`} onError={() => {
                    if (currentItem.id === 'biovortex' && preferWideThumbnail && !thumbnailFallback) setThumbnailFallback(true)
                    else setMissingPreview(true)
                  }} /> : <div className="finder-video-fallback"><FinderIcon type="video" file /><span>Video preview unavailable</span></div>}
                  {!missingPreview && <span className="finder-video-play" aria-hidden="true"><svg viewBox="0 0 68 48" focusable="false"><path d="M66.52 7.1a8 8 0 0 0-5.64-5.66C55.9 0 34 0 34 0S12.1 0 7.12 1.44A8 8 0 0 0 1.48 7.1C0 12.1 0 24 0 24s0 11.9 1.48 16.9a8 8 0 0 0 5.64 5.66C12.1 48 34 48 34 48s21.9 0 26.88-1.44a8 8 0 0 0 5.64-5.66C68 35.9 68 24 68 24s0-11.9-1.48-16.9Z" fill="currentColor" /><path d="m27 34.5 18-10.5-18-10.5v21Z" fill="#fff" /></svg></span>}
                  {currentItem.duration && <span className="finder-video-duration">{currentItem.duration}</span>}
                </a>
              </div>
          ) : entries.length ? (
            <div className="finder-items" role="listbox" aria-label="Files and folders">
              {entries.map((entry) => {
                const id = entry.kind === 'folder' ? entry.id : entry.item.id
                const name = entry.kind === 'folder' ? entry.name : entry.kind === 'portfolio' ? entry.item.name : entry.item.title
                const icon = entry.kind === 'folder' ? 'folder' : entry.kind === 'portfolio' ? 'photo' : 'video'
                return (
                  <button
                    ref={(node) => { optionRefs.current[entries.indexOf(entry)] = node }}
                    key={id}
                    className={`finder-item${entry.kind === 'portfolio' ? ' finder-item--portfolio' : ''}${selected === id ? ' is-selected' : ''}`}
                    type="button"
                    role="option"
                    aria-selected={selected === id}
                    tabIndex={selected === id || (selected === null && entries.indexOf(entry) === 0) ? 0 : -1}
                    onFocus={() => setSelected(id)}
                    onPointerDown={handleItemPointerDown}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        openEntry(entry)
                      }
                    }}
                    onDoubleClick={() => openEntry(entry)}
                    onClick={() => {
                      if (touchOpensRef.current) openEntry(entry)
                      else setSelected(id)
                      touchOpensRef.current = false
                    }}
                  >
                    {entry.kind === 'portfolio' ? (
                      <span className="finder-book" aria-hidden="true">
                        <img src={entry.item.coverUrl} alt="" loading="lazy" />
                        <i className="finder-book__spine" />
                        <i className="finder-book__pages" />
                      </span>
                    ) : <FinderIcon type={icon} file={entry.kind === 'video'} />}
                    <span className="finder-item-name">{name}</span>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className={`finder-empty${place === 'capsules' ? ' finder-empty--capsules' : ''}`}>
              <FinderIcon type={place === 'capsules' || place === 'photo' ? 'photo' : 'video'} />
              <strong>{place === 'capsules' ? 'This folder is empty' : place === 'portfolios' ? 'No portfolios available' : 'No video uploads yet'}</strong>
              {place === 'capsules' && <span>Future photo collections will appear here.</span>}
            </div>
          )}
        </div>
      </div>

      <footer className="finder-status"><span>{totalItems} {totalItems === 1 ? 'item' : 'items'}</span><span>{placeTitle(place)}</span></footer>
    </div>
  )
}

export default function MediaPage() {
  const isPhone = useMediaQuery(mobileHomeQuery)
  const isTablet = useMediaQuery(tabletHomeQuery)
  const { setAutomaticPause } = useHomeAudio()
  const [isVideoPreview, setIsVideoPreview] = useState(false)
  const [activePortfolio, setActivePortfolio] = useState<PhotoPortfolio | null>(null)
  const isPortfolioOpen = activePortfolio !== null
  useEffect(() => {
    if (!isPortfolioOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [isPortfolioOpen])
  useEffect(() => {
    setAutomaticPause('portfolio-reader', isPortfolioOpen)
    return () => setAutomaticPause('portfolio-reader', false)
  }, [isPortfolioOpen, setAutomaticPause])
  return (
    <main className={`page-shell page-shell--media${isPhone ? ' page-shell--media-phone' : ''}`}>
      <div className="media-stage">
        <div className={`media-collage${isTablet ? ' media-collage--tablet' : ''}`}>
          <RetroWindow title="Finder" accessibleLabel="Media Finder" showTitle className={`media-finder-window${isVideoPreview ? ' media-finder-window--video-preview' : ''}`} expandedCloseAndRestore>
            <MediaFinder onVideoPreviewChange={setIsVideoPreview} onPortfolioOpen={setActivePortfolio} preferWideThumbnail={isTablet} />
          </RetroWindow>
          {!isPhone && (
            <div className="media-dock">
              <RetroWindow title="Now playing" accessibleLabel="Media page music player" canMaximise={false} className="retro-window--spotify media-player-window">
                <SpotifyPlayer />
              </RetroWindow>
            </div>
          )}
        </div>
      </div>
      {activePortfolio && (
        <Suspense fallback={<PortfolioReaderLoadingShell portfolio={activePortfolio} onClose={() => setActivePortfolio(null)} />}>
          <PortfolioReader key={activePortfolio.pdfUrl} portfolio={activePortfolio} onClose={() => setActivePortfolio(null)} />
        </Suspense>
      )}
    </main>
  )
}
