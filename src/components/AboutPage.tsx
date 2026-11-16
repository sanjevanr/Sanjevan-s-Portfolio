import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import AboutScrapbook from './AboutScrapbook'
import AboutHeadshot from './AboutHeadshot'
import CareerTimeline from './CareerTimeline'
import { mobileHomeQuery, tabletHomeQuery, useMediaQuery } from './HomeAudio'
import RetroWindow from './RetroWindow'
import SpotifyPlayer from './SpotifyPlayer'

const desktopCanvasWidth = 1100
const desktopCanvasHeight = 720
const aboutPhoneQuery = `${mobileHomeQuery}, (max-width: 900px) and (max-height: 500px)`

export default function AboutPage() {
  const isPhone = useMediaQuery(aboutPhoneQuery)
  const isTablet = useMediaQuery(tabletHomeQuery)
  const stageRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [tabletOffset, setTabletOffset] = useState({ x: 0, y: 0 })
  const [sharedPlayerScale, setSharedPlayerScale] = useState(0.8)
  const [expandedCareerId, setExpandedCareerId] = useState<string | null>(null)
  const canvasWidth = desktopCanvasWidth
  const canvasHeight = desktopCanvasHeight

  useLayoutEffect(() => {
    const root = document.documentElement
    const updateSharedScale = () => {
      const value = Number.parseFloat(getComputedStyle(root).getPropertyValue('--home-collage-scale'))
      if (Number.isFinite(value) && value > 0) setSharedPlayerScale(value)
    }

    updateSharedScale()
    const observer = new MutationObserver(updateSharedScale)
    observer.observe(root, { attributes: true, attributeFilter: ['style'] })
    return () => observer.disconnect()
  }, [])

  useLayoutEffect(() => {
    const stage = stageRef.current
    if (!stage || isPhone || isTablet) return

    const updateScale = () => {
      const { width, height } = stage.getBoundingClientRect()
      const nextScale = Math.min(1, (width - 24) / canvasWidth, (height - 24) / canvasHeight)
      setScale(Number.isFinite(nextScale) ? Math.max(0.35, nextScale) : 1)
    }

    updateScale()
    const observer = new ResizeObserver(updateScale)
    observer.observe(stage)
    return () => observer.disconnect()
  }, [canvasWidth, isPhone, isTablet])

  useLayoutEffect(() => {
    const stage = stageRef.current
    const collage = stage?.querySelector<HTMLElement>('.about-collage')
    if (!stage || !collage || isPhone || !isTablet) return

    const getBoundsElements = () => Array.from(collage.children).flatMap((child) => {
      if (!(child instanceof HTMLElement) || child.tagName === 'DIALOG') return []
      if (child.classList.contains('about-scrapbook')) {
        return Array.from(child.querySelectorAll<HTMLElement>('.about-scrapbook__note'))
      }
      return [child]
    })

    const updateScale = () => {
      const stageWidth = stage.clientWidth
      const stageHeight = stage.clientHeight
      const collageRect = collage.getBoundingClientRect()
      const scaleFactor = collageRect.width / (collage.offsetWidth || canvasWidth)
      if (stageWidth <= 0 || stageHeight <= 0 || scaleFactor <= 0) return

      let minX = Number.POSITIVE_INFINITY
      let minY = Number.POSITIVE_INFINITY
      let maxX = Number.NEGATIVE_INFINITY
      let maxY = Number.NEGATIVE_INFINITY

      for (const element of getBoundsElements()) {
        const rect = element.getBoundingClientRect()
        if (rect.width <= 0 || rect.height <= 0 || getComputedStyle(element).visibility === 'hidden') continue
        minX = Math.min(minX, (rect.left - collageRect.left) / scaleFactor)
        minY = Math.min(minY, (rect.top - collageRect.top) / scaleFactor)
        maxX = Math.max(maxX, (rect.right - collageRect.left) / scaleFactor)
        maxY = Math.max(maxY, (rect.bottom - collageRect.top) / scaleFactor)
      }
      if (!Number.isFinite(minX) || !Number.isFinite(minY)) return

      const boundsWidth = Math.max(1, maxX - minX)
      const boundsHeight = Math.max(1, maxY - minY)
      const nextScale = Math.max(0.01, Math.min(1, (stageWidth - 24) / boundsWidth, (stageHeight - 24) / boundsHeight))
      const nextOffset = {
        x: (stageWidth - boundsWidth * nextScale) / 2 - minX * nextScale,
        y: (stageHeight - boundsHeight * nextScale) / 2 - minY * nextScale,
      }

      setScale((current) => Math.abs(current - nextScale) < 0.002 ? current : nextScale)
      setTabletOffset((current) => (
        Math.abs(current.x - nextOffset.x) < 0.5 && Math.abs(current.y - nextOffset.y) < 0.5
          ? current
          : nextOffset
      ))
    }

    updateScale()
    const observer = new ResizeObserver(updateScale)
    observer.observe(stage)
    observer.observe(collage)
    for (const element of getBoundsElements()) observer.observe(element)
    return () => observer.disconnect()
  }, [canvasWidth, isPhone, isTablet])

  const collageStyle = {
    width: canvasWidth,
    height: canvasHeight,
    ...(isTablet ? {
      top: 0,
      left: 0,
      transform: `translate(${tabletOffset.x}px, ${tabletOffset.y}px) scale(${scale})`,
      transformOrigin: 'top left',
    } : {
      transform: `translate(-50%, -50%) scale(${scale})`,
    }),
    '--about-player-scale-adjustment': isTablet ? 1 : sharedPlayerScale / scale,
  } as CSSProperties & { '--about-player-scale-adjustment': number }

  const composition = (
    <div
      className="about-collage"
      style={collageStyle}
    >
      <RetroWindow
        title="Now playing"
        accessibleLabel="About page music player"
        canMaximise={false}
        className="retro-window--spotify about-player-window"
      >
        <SpotifyPlayer />
      </RetroWindow>

      <AboutHeadshot />
      <RetroWindow
        title="Career.exe"
        accessibleLabel="Career timeline"
        singleContentMount
        expandedCloseWithRedButton
        className="about-career-window"
      >
        <CareerTimeline expandedId={expandedCareerId} onExpandedChange={setExpandedCareerId} />
      </RetroWindow>
      <AboutScrapbook />
    </div>
  )

  return (
    <main className={`page-shell page-shell--about${isPhone ? ' page-shell--about-phone' : ''}`}>
      {isPhone ? (
        <div className="about-mobile-content">
          <AboutHeadshot />
          <RetroWindow
            title="Career.exe"
            accessibleLabel="Career timeline"
            singleContentMount
            expandedCloseWithRedButton
            className="about-career-window"
          >
            <CareerTimeline expandedId={expandedCareerId} onExpandedChange={setExpandedCareerId} />
          </RetroWindow>
        </div>
      ) : (
        <div ref={stageRef} className="about-stage">
          {composition}
        </div>
      )}
    </main>
  )
}
