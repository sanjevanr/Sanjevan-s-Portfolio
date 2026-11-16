import { useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { photoPortfolios, videoUploads, type FinderPhotoPortfolio, type FinderVideo } from '../../data/mediaLibrary'
import { mobileHomeQuery, tabletHomeQuery, useMediaQuery } from '../HomeAudio'
import RetroWindow from '../RetroWindow'
import SpotifyPlayer from '../SpotifyPlayer'

type Place = 'media' | 'type' | 'photo' | 'video' | `portfolio:${string}` | `video-item:${string}`
type Entry =
  | { kind: 'folder'; id: 'type' | 'photo' | 'video'; name: string }
  | { kind: 'portfolio'; item: FinderPhotoPortfolio }
  | { kind: 'video'; item: FinderVideo }

const placeName: Record<'media' | 'type' | 'photo' | 'video', string> = {
  media: 'Media', type: 'Type', photo: 'Photo', video: 'Video',
}
const placeParent: Partial<Record<Place, Place>> = { type: 'media', photo: 'type', video: 'type' }

function placeTitle(place: Place) {
  if (place.startsWith('portfolio:')) return photoPortfolios.find((item) => item.id === place.slice(10))?.name ?? 'Photo Preview'
  if (place.startsWith('video-item:')) return videoUploads.find((item) => item.id === place.slice(11))?.title ?? 'Video Preview'
  return placeName[place as keyof typeof placeName]
}

function pathFor(place: Place): Place[] {
  if (place.startsWith('portfolio:')) return ['media', 'type', 'photo', place]
  if (place.startsWith('video-item:')) return ['media', 'type', 'video', place]
  if (place === 'media') return ['media']
  if (place === 'type') return ['media', 'type']
  return ['media', 'type', place]
}

function FinderIcon({ type }: { type: 'computer' | 'folder' | 'photo' | 'video' | 'drive' | 'youtube' }) {
  if (type === 'folder') return <span className="finder-icon finder-icon--folder" aria-hidden="true"><i /></span>
  if (type === 'computer') return <span className="finder-icon finder-icon--computer" aria-hidden="true"><i /></span>
  if (type === 'photo') return <span className="finder-icon finder-icon--photo" aria-hidden="true">▧</span>
  if (type === 'video') return <span className="finder-icon finder-icon--video" aria-hidden="true">▶</span>
  if (type === 'drive') return <span className="finder-link-icon" aria-hidden="true">↗</span>
  return <span className="finder-link-icon finder-link-icon--youtube" aria-hidden="true">▶</span>
}

function MediaFinder() {
  const [place, setPlace] = useState<Place>('type')
  const [history, setHistory] = useState<Place[]>(['type'])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [missingPreview, setMissingPreview] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])
  const touchOpensRef = useRef(false)

  const goTo = (target: Place, record = true) => {
    setPlace(target)
    setSelected(null)
    setMissingPreview(false)
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
    if (place === 'photo') return photoPortfolios.map((item) => ({ kind: 'portfolio', item }))
    if (place === 'video') return videoUploads.map((item) => ({ kind: 'video', item }))
    return []
  }, [place])
  const totalItems = entries.length
  const goUp = () => {
    const parent = placeParent[place]
    if (parent) goTo(parent)
  }
  const openEntry = (entry: Entry) => {
    if (entry.kind === 'folder') goTo(entry.id)
    else if (entry.kind === 'portfolio') goTo(`portfolio:${entry.item.id}`)
    else goTo(`video-item:${entry.item.id}`)
  }
  const currentItem = place.startsWith('portfolio:')
    ? photoPortfolios.find((item) => item.id === place.slice(10))
    : place.startsWith('video-item:')
      ? videoUploads.find((item) => item.id === place.slice(11))
      : undefined

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
  const handleItemPointerDown = (event: PointerEvent<HTMLElement>, entry: Entry) => {
    touchOpensRef.current = event.pointerType === 'touch'
    if (touchOpensRef.current) openEntry(entry)
  }

  return (
    <div className="finder-window">
      <div className="finder-toolbar" aria-label="Finder toolbar">
        <div className="finder-history-controls">
          <button type="button" aria-label="Back" title="Back" disabled={historyIndex <= 0} onClick={() => moveHistory(historyIndex - 1)}>‹</button>
          <button type="button" aria-label="Forward" title="Forward" disabled={historyIndex >= history.length - 1} onClick={() => moveHistory(historyIndex + 1)}>›</button>
        </div>
        <nav className="finder-breadcrumbs" aria-label="Current folder path">
          {pathFor(place).map((part, index, path) => (
            <span className="finder-breadcrumb" key={`${part}-${index}`}>
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

        <div ref={canvasRef} className="finder-canvas" tabIndex={0} aria-label={`${placeTitle(place)} contents`} onKeyDown={handleCanvasKeyDown}>
          {currentItem ? (
            <div className="finder-preview">
              {'preview' in currentItem ? (
                <>
                  {!missingPreview ? <img src={currentItem.preview} alt={`${currentItem.name} portfolio preview`} onError={() => setMissingPreview(true)} /> : <div className="finder-preview-placeholder"><FinderIcon type="photo" /><span>Preview unavailable</span></div>}
                  <a href={currentItem.googleDriveUrl} target="_blank" rel="noopener noreferrer"><FinderIcon type="drive" />Open in Google Drive</a>
                </>
              ) : (
                <>
                  {!missingPreview ? <img src={currentItem.thumbnail} alt={`${currentItem.title} video thumbnail`} onError={() => setMissingPreview(true)} /> : <div className="finder-preview-placeholder"><FinderIcon type="video" /><span>Preview unavailable</span></div>}
                  <a href={currentItem.youtubeUrl} target="_blank" rel="noopener noreferrer"><FinderIcon type="youtube" />Open on YouTube</a>
                </>
              )}
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
                    className={`finder-item${selected === id ? ' is-selected' : ''}`}
                    type="button"
                    role="option"
                    aria-selected={selected === id}
                    tabIndex={selected === id || (selected === null && entries.indexOf(entry) === 0) ? 0 : -1}
                    onFocus={() => setSelected(id)}
                    onPointerDown={(event) => handleItemPointerDown(event, entry)}
                    onClick={(event) => {
                      if (event.detail > 1 && !touchOpensRef.current) openEntry(entry)
                      else setSelected(id)
                    }}
                  >
                    <FinderIcon type={icon} />
                    <span className="finder-item-name">{name}</span>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="finder-empty"><FinderIcon type={place === 'photo' ? 'photo' : 'video'} /><strong>No {place === 'photo' ? 'photo portfolios' : 'video uploads'} yet</strong></div>
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
  return (
    <main className={`page-shell page-shell--media${isPhone ? ' page-shell--media-phone' : ''}`}>
      <div className="media-stage">
        <div className={`media-collage${isTablet ? ' media-collage--tablet' : ''}`}>
          <RetroWindow title="Finder" accessibleLabel="Media Finder" showTitle className="media-finder-window" expandedCloseAndRestore>
            <MediaFinder />
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
    </main>
  )
}
