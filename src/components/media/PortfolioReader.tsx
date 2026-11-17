import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type TouchEvent } from 'react'
import { createPortal } from 'react-dom'
import * as pdfjs from 'pdfjs-dist'
import type { PDFPageProxy } from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import type { PhotoPortfolio } from '../../data/mediaLibrary'

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

type ZoomMode = 'page' | 'width'

function PdfPage({
  page,
  availableWidth,
  availableHeight,
  zoom,
  zoomMode,
  pageIndex,
  onRenderError,
}: {
  page: PDFPageProxy
  availableWidth: number
  availableHeight: number
  zoom: number
  zoomMode: ZoomMode
  pageIndex: number
  onRenderError: (error: Error) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [frame, setFrame] = useState(0)
  const baseViewport = page.getViewport({ scale: 1 })
  const fitScale = zoomMode === 'width'
    ? Math.min(availableWidth / baseViewport.width, 2)
    : Math.min(availableWidth / baseViewport.width, availableHeight / baseViewport.height)
  const scale = Math.max(.1, fitScale * zoom)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d', { alpha: false })
    if (!canvas || !context) return

    const viewport = page.getViewport({ scale })
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
    const buffer = document.createElement('canvas')
    buffer.width = Math.ceil(viewport.width * pixelRatio)
    buffer.height = Math.ceil(viewport.height * pixelRatio)
    const renderTask = page.render({
      canvas: buffer,
      viewport,
      transform: pixelRatio === 1 ? undefined : [pixelRatio, 0, 0, pixelRatio, 0, 0],
      background: '#fff',
    })

    let cancelled = false
    void renderTask.promise.then(() => {
      if (cancelled) return
      canvas.width = buffer.width
      canvas.height = buffer.height
      canvas.style.width = `${viewport.width}px`
      canvas.style.height = `${viewport.height}px`
      const visibleContext = canvas.getContext('2d', { alpha: false })
      visibleContext?.drawImage(buffer, 0, 0)
      setFrame((value) => value + 1)
    }).catch((error: unknown) => {
      if (error instanceof Error && error.name === 'RenderingCancelledException') return
      onRenderError(error instanceof Error ? error : new Error('This page could not be rendered.'))
    }).finally(() => {
      buffer.width = 0
      buffer.height = 0
    })
    return () => { cancelled = true; renderTask.cancel() }
  }, [onRenderError, page, scale])

  return (
    <div className={`ibooks-page${pageIndex === 0 ? ' ibooks-page--left' : ' ibooks-page--right'}`}>
      <canvas ref={canvasRef} role="img" aria-label={`Page ${page.pageNumber}`} />
      {frame > 0 && <span key={frame} className="ibooks-page__frame-arrival" aria-hidden="true" />}
    </div>
  )
}

export default function PortfolioReader({ portfolio, onClose }: { portfolio: PhotoPortfolio; onClose: () => void }) {
  const readerRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const swipeStartRef = useRef<number | null>(null)
  const [documentProxy, setDocumentProxy] = useState<pdfjs.PDFDocumentProxy | null>(null)
  const [documentError, setDocumentError] = useState('')
  const [pageError, setPageError] = useState('')
  const [pageCount, setPageCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageHistory, setPageHistory] = useState([1])
  const [pageInput, setPageInput] = useState('1')
  const [pageSet, setPageSet] = useState<{ start: number; pages: PDFPageProxy[] } | null>(null)
  const [pageLoading, setPageLoading] = useState(true)
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 })
  const [isNarrow, setIsNarrow] = useState(() => window.matchMedia('(max-width: 820px)').matches)
  const [zoom, setZoom] = useState(1)
  const [zoomMode, setZoomMode] = useState<ZoomMode>('page')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const panRef = useRef<{ pointerId: number; x: number; y: number; left: number; top: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const oldOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    readerRef.current?.focus()
    closeButtonRef.current?.focus()
    return () => {
      document.body.style.overflow = oldOverflow
      returnFocusRef.current?.focus()
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const loadingTask = pdfjs.getDocument({
      url: portfolio.pdfUrl,
      rangeChunkSize: 256 * 1024,
      disableAutoFetch: true,
      disableStream: true,
    })
    setDocumentProxy(null)
    setDocumentError('')
    setPageError('')
    setPageCount(0)
    setCurrentPage(1)
    setPageHistory([1])
    setPageLoading(true)
    loadingTask.promise.then((loaded) => {
      if (cancelled) {
        return
      }
      setDocumentProxy(loaded)
      setPageCount(loaded.numPages)
    }).catch((error: unknown) => {
      if (!cancelled) setDocumentError(error instanceof Error ? error.message : 'The portfolio could not be opened.')
    })
    return () => {
      cancelled = true
      void loadingTask.destroy()
    }
  }, [portfolio.pdfUrl])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const measure = () => setStageSize({ width: stage.clientWidth, height: stage.clientHeight })
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(stage)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const query = window.matchMedia('(max-width: 820px)')
    const update = () => setIsNarrow(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const syncFullscreen = () => setIsFullscreen(document.fullscreenElement === readerRef.current)
    document.addEventListener('fullscreenchange', syncFullscreen)
    return () => document.removeEventListener('fullscreenchange', syncFullscreen)
  }, [])

  useEffect(() => {
    if (!documentProxy) return
    let cancelled = false
    setPageLoading(true)
    setPageError('')
    const end = currentPage === 1 ? currentPage : Math.min(pageCount, currentPage + 1)
    const pageNumbers = Array.from({ length: end - currentPage + 1 }, (_, index) => currentPage + index)
    Promise.all(pageNumbers.map((number) => documentProxy.getPage(number))).then((pages) => {
      if (!cancelled) { setPageSet({ start: currentPage, pages }); setPageLoading(false) }
    }).catch((error: unknown) => {
      if (!cancelled) {
        setPageLoading(false)
        setPageError(error instanceof Error ? error.message : 'The requested page could not be loaded.')
      }
    })
    return () => { cancelled = true }
  }, [currentPage, documentProxy, pageCount])

  useEffect(() => setPageInput(String(currentPage)), [currentPage])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    stage.scrollLeft = 0
    stage.scrollTop = 0
  }, [currentPage])

  useEffect(() => {
    if (zoom > 1.01) return
    const stage = stageRef.current
    if (!stage) return
    stage.scrollLeft = 0
    stage.scrollTop = 0
  }, [zoom, zoomMode])

  const spreadPages = pageSet?.pages
  const spread = Boolean(!isNarrow && spreadPages && spreadPages.length > 1 &&
    spreadPages[0].getViewport({ scale: 1 }).height >= spreadPages[0].getViewport({ scale: 1 }).width)
  const visiblePages = pageSet ? (spread ? pageSet.pages : pageSet.pages.slice(0, 1)) : []
  const visibleCount = visiblePages.length || 1
  const displayedStart = pageSet?.start ?? currentPage
  const pageEnd = Math.min(pageCount, displayedStart + visibleCount - 1)
  const slotWidth = Math.max(160, (stageSize.width - (spread ? 76 : 52)) / (spread ? 2 : 1))
  const slotHeight = Math.max(180, stageSize.height - 54)

  const goToPrevious = useCallback(() => {
    if (pageHistory.length <= 1) return
    const previous = pageHistory[pageHistory.length - 2]
    setPageHistory((history) => history.slice(0, -1))
    setCurrentPage(previous)
  }, [pageHistory])

  const goToNext = useCallback(() => {
    const next = currentPage + visibleCount
    if (next > pageCount) return
    setPageHistory((history) => [...history, next])
    setCurrentPage(next)
  }, [currentPage, pageCount, visibleCount])

  const goToPage = (requested: number) => {
    if (!Number.isFinite(requested) || pageCount === 0) return
    const bounded = Math.max(1, Math.min(pageCount, Math.floor(requested)))
    const start = bounded === 1 ? 1 : bounded % 2 === 1 ? bounded - 1 : bounded
    setPageHistory([start])
    setCurrentPage(start)
  }

  const handleRenderError = useCallback((error: Error) => setPageError(error.message), [])

  const adjustZoom = (amount: number) => {
    setZoomMode('page')
    setZoom((value) => Math.min(2.5, Math.max(.6, Math.round((value + amount) * 100) / 100)))
  }

  const handleClose = () => {
    if (document.fullscreenElement) void document.exitFullscreen()
    onClose()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement
    if (target.matches('input, textarea, select, [contenteditable="true"]')) {
      if (event.key === 'Escape') handleClose()
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      handleClose()
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      goToPrevious()
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      goToNext()
    } else if (event.key === '+' || event.key === '=') {
      event.preventDefault()
      adjustZoom(.1)
    } else if (event.key === '-' || event.key === '_') {
      event.preventDefault()
      adjustZoom(-.1)
    }
  }

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    swipeStartRef.current = event.touches[0]?.clientX ?? null
  }
  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const start = swipeStartRef.current
    const end = event.changedTouches[0]?.clientX
    swipeStartRef.current = null
    if (start === null || end === undefined || zoom > 1.01) return
    if (start - end > 52) goToNext()
    else if (end - start > 52) goToPrevious()
  }

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || zoom <= 1.01 || event.button !== 0) return
    const stage = stageRef.current
    if (!stage) return
    panRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, left: stage.scrollLeft, top: stage.scrollTop }
    event.currentTarget.setPointerCapture(event.pointerId)
    setIsDragging(true)
    event.preventDefault()
  }
  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const pan = panRef.current
    const stage = stageRef.current
    if (!pan || !stage || pan.pointerId !== event.pointerId) return
    stage.scrollLeft = pan.left - (event.clientX - pan.x)
    stage.scrollTop = pan.top - (event.clientY - pan.y)
  }
  const handlePointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    if (panRef.current?.pointerId !== event.pointerId) return
    panRef.current = null
    setIsDragging(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }

  const handleFullscreen = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen()
      return
    }
    if (readerRef.current?.requestFullscreen) {
      try {
        await readerRef.current.requestFullscreen()
        return
      } catch {
        // The reader already fills the viewport, so keep using that fallback.
      }
    }
    setIsFullscreen((value) => !value)
  }

  return createPortal((
    <div
      ref={readerRef}
      className={`ibooks-reader${isFullscreen ? ' ibooks-reader--fullscreen' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={`Reading ${portfolio.name}`}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      onClick={(event) => { if (event.target === event.currentTarget) handleClose() }}
    >
      <header className="ibooks-toolbar">
        <div className="ibooks-toolbar__titlebar"><h1 className="ibooks-toolbar__title" title={portfolio.name}>{portfolio.name}</h1></div>
        <div className="ibooks-toolbar__controls" aria-label="Reader controls">
          <button ref={closeButtonRef} className="ibooks-control ibooks-control--back" type="button" onClick={handleClose} aria-label="Back to Finder">‹ <span>Finder</span></button>
          <div className="ibooks-toolbar__group ibooks-toolbar__group--pages">
            <button className="ibooks-control" type="button" onClick={goToPrevious} disabled={pageHistory.length <= 1} aria-label="Previous page">‹</button>
            <label className="ibooks-page-count">
              <input aria-label="Go to page" type="number" min={1} max={pageCount || 1} value={pageInput} onChange={(event) => setPageInput(event.currentTarget.value)} onBlur={() => goToPage(Number(pageInput))} onKeyDown={(event) => { if (event.key === 'Enter') { goToPage(Number(pageInput)); event.currentTarget.blur() } }} />
              <span>{pageCount ? ` / ${pageCount}` : ' / —'}</span>
            </label>
            <button className="ibooks-control" type="button" onClick={goToNext} disabled={currentPage + visibleCount > pageCount} aria-label="Next page">›</button>
          </div>
          <span className="ibooks-toolbar__divider" aria-hidden="true" />
          <div className="ibooks-toolbar__group ibooks-toolbar__group--zoom">
            <button className="ibooks-control" type="button" onClick={() => adjustZoom(-.1)} aria-label="Zoom out" title="Zoom out" disabled={zoom <= .6}>−</button>
            <button className="ibooks-control" type="button" onClick={() => adjustZoom(.1)} aria-label="Zoom in" title="Zoom in" disabled={zoom >= 2.5}>+</button>
            <button className="ibooks-control ibooks-control--text ibooks-control--reset" type="button" onClick={() => { setZoomMode('page'); setZoom(1) }} aria-label="Reset zoom" title="Reset zoom"><span aria-hidden="true">↻</span><span className="ibooks-control__label">Reset</span></button>
          </div>
          <div className="ibooks-toolbar__group ibooks-toolbar__group--fit">
            <button className="ibooks-control ibooks-control--text ibooks-control--fit" type="button" onClick={() => { setZoomMode('page'); setZoom(1) }}>Fit page</button>
            <button className="ibooks-control ibooks-control--text ibooks-control--fit" type="button" onClick={() => { setZoomMode('width'); setZoom(1) }}>Fit width</button>
          </div>
          <div className="ibooks-toolbar__group ibooks-toolbar__group--actions">
            <button className="ibooks-control ibooks-control--text ibooks-control--fullscreen" type="button" onClick={() => void handleFullscreen()} aria-pressed={isFullscreen}>{isFullscreen ? 'Exit full screen' : 'Full screen'}</button>
            <details className="ibooks-toolbar__more">
              <summary className="ibooks-control" aria-label="More reader controls" title="More reader controls">•••</summary>
              <div className="ibooks-toolbar__menu">
                <button className="ibooks-control ibooks-control--text" type="button" onClick={() => { void handleFullscreen(); const details = document.querySelector<HTMLDetailsElement>('.ibooks-toolbar__more'); if (details) details.open = false }}>{isFullscreen ? 'Exit full screen' : 'Full screen'}</button>
                <a className="ibooks-control ibooks-control--text ibooks-control--menu-download" href={portfolio.pdfUrl} download={portfolio.downloadFilename} aria-label="Download PDF">Download PDF</a>
              </div>
            </details>
            <a className="ibooks-control ibooks-control--download" href={portfolio.pdfUrl} download={portfolio.downloadFilename} aria-label="Download PDF" title="Download PDF"><span className="ibooks-control__download-label">Download PDF</span><span className="ibooks-control__download-icon" aria-hidden="true">↓</span></a>
          </div>
        </div>
      </header>

      <div ref={stageRef} className={`ibooks-stage${zoom > 1.01 ? ' ibooks-stage--zoomed' : ''}${isDragging ? ' ibooks-stage--dragging' : ''}`} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerEnd} onPointerCancel={handlePointerEnd}>
        {documentError ? (
          <div className="ibooks-message ibooks-message--error" role="alert"><strong>Unable to open this portfolio</strong><span>{documentError}</span><a href={portfolio.pdfUrl} download={portfolio.downloadFilename}>Download the original PDF</a></div>
        ) : pageError ? (
          <div className="ibooks-message ibooks-message--error" role="alert"><strong>This page could not be opened</strong><span>{pageError}</span><button className="ibooks-control" type="button" onClick={() => { setPageError(''); setPageSet(null) }}>Try again</button></div>
        ) : visiblePages.length ? (
          <div className={`ibooks-page-area${spread ? ' ibooks-pages--spread' : ''}`}>
            {visiblePages.map((page, index) => (
              <PdfPage key={index} page={page} pageIndex={index} availableWidth={slotWidth} availableHeight={slotHeight} zoom={zoom} zoomMode={zoomMode} onRenderError={handleRenderError} />
            ))}
          </div>
        ) : (
          <div className="ibooks-stage__blank" aria-hidden="true" />
        )}
        <span className="sr-only" role="status" aria-live="polite">{pageLoading ? `Loading page ${currentPage}` : ''}</span>
      </div>
      <footer className="ibooks-reader__footer">
        <span>{visiblePages.length ? `Page ${displayedStart}${pageEnd > displayedStart ? `–${pageEnd}` : ''} of ${pageCount}` : 'Loading pages'}</span>
      </footer>
    </div>
  ), document.body)
}
