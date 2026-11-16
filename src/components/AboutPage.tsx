import { useLayoutEffect, useRef, useState } from 'react'
import { mobileHomeQuery, tabletHomeQuery, useMediaQuery } from './HomeAudio'
import RetroWindow from './RetroWindow'
import PhotoPanel from './PhotoPanel'
import SpotifyPlayer from './SpotifyPlayer'

const canvasWidth = 1100
const canvasHeight = 840

export default function AboutPage() {
  const isPhone = useMediaQuery(mobileHomeQuery)
  const isTablet = useMediaQuery(tabletHomeQuery)
  const stageRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

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
  }, [isPhone])

  return (
    <main className={`page-shell page-shell--about${isPhone ? ' page-shell--about-phone' : ''}`}>
      {isPhone ? (
        <PhotoPanel
          src="/about-headshot.jpg"
          alt="Portrait of Sanjevan Rajasegar"
          className="photo-frame--about-headshot"
        />
      ) : (
        <div ref={stageRef} className="about-stage">
          <div
            className={`about-collage${isTablet ? ' about-collage--tablet' : ''}`}
            style={{ transform: `translate(-50%, -50%) scale(${scale})` }}
          >
            <PhotoPanel
              src="/about-headshot.jpg"
              alt="Portrait of Sanjevan Rajasegar"
              className="photo-frame--about-headshot"
            />

            <RetroWindow
              title="Now playing"
              accessibleLabel="About page music player"
              canMaximise={false}
              className="retro-window--spotify about-player-window"
            >
              <SpotifyPlayer />
            </RetroWindow>
          </div>
        </div>
      )}
    </main>
  )
}
