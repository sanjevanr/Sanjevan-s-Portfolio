import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import AboutScrapbook from './AboutScrapbook'
import AboutHeadshot from './AboutHeadshot'
import CareerTimeline from './CareerTimeline'
import { mobileHomeQuery, tabletHomeQuery, useMediaQuery } from './HomeAudio'
import RetroWindow from './RetroWindow'
import SpotifyPlayer from './SpotifyPlayer'

const desktopCanvasWidth = 1100
const tabletCanvasWidth = 760
const desktopCanvasHeight = 720
const tabletCanvasHeight = 740

export default function AboutPage() {
  const isPhone = useMediaQuery(mobileHomeQuery)
  const isTablet = useMediaQuery(tabletHomeQuery)
  const stageRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [sharedPlayerScale, setSharedPlayerScale] = useState(0.8)
  const [expandedCareerId, setExpandedCareerId] = useState<string | null>(null)
  const canvasWidth = isTablet ? tabletCanvasWidth : desktopCanvasWidth
  const canvasHeight = isTablet ? tabletCanvasHeight : desktopCanvasHeight

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
    if (!stage || isPhone) return

    const updateScale = () => {
      const { width, height } = stage.getBoundingClientRect()
      const nextScale = Math.min(1, (width - 24) / canvasWidth, (height - 24) / canvasHeight)
      setScale(Number.isFinite(nextScale) ? Math.max(0.35, nextScale) : 1)
    }

    updateScale()
    const observer = new ResizeObserver(updateScale)
    observer.observe(stage)
    return () => observer.disconnect()
  }, [canvasWidth, isPhone])

  const composition = (
    <div
      className={`about-collage${isTablet ? ' about-collage--tablet' : ''}`}
      style={{
        width: canvasWidth,
        height: canvasHeight,
        transform: `translate(-50%, -50%) scale(${scale})`,
        '--about-player-scale-adjustment': sharedPlayerScale / scale,
      } as CSSProperties}
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
