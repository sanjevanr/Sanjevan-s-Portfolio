import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import MorphingBackground from './components/background/MorphingBackground'
import EyeOfHorusPanel from './components/EyeOfHorusPanel'
import HorizontalWorkspace from './components/HorizontalWorkspace'
import { IntroPanel } from './components/IntroPanel'
import PhotoPanel from './components/PhotoPanel'
import RetroWindow from './components/RetroWindow'
import { HomeAudioProvider, mobileHomeQuery } from './components/HomeAudio'
import SocialBrowser from './components/SocialBrowser'
import SpotifyPlayer from './components/SpotifyPlayer'
import ThemeToggle from './components/ThemeToggle'
import YouTubePreview from './components/YouTubePreview'

type Theme = 'light' | 'dark'

function readStoredTheme(): Theme | null {
  try {
    const storedTheme = window.localStorage.getItem('sanjevan-theme')
    return storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : null
  } catch {
    return null
  }
}

function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const storedTheme = readStoredTheme()
    if (storedTheme) return storedTheme
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  const hasManualPreference = useRef(readStoredTheme() !== null)

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const updateFromSystem = (event: MediaQueryListEvent) => {
      if (!hasManualPreference.current) setTheme(event.matches ? 'dark' : 'light')
    }
    mediaQuery.addEventListener('change', updateFromSystem)
    return () => mediaQuery.removeEventListener('change', updateFromSystem)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((currentTheme) => {
      const nextTheme = currentTheme === 'dark' ? 'light' : 'dark'
      hasManualPreference.current = true
      try {
        window.localStorage.setItem('sanjevan-theme', nextTheme)
      } catch {
        // Continue with the in-memory selection when storage is unavailable.
      }
      return nextTheme
    })
  }, [])

  return { theme, toggleTheme }
}

const navigation = [
  ['home', '/'],
  ['projects', '/projects'],
  ['photography', '/photography'],
  ['about', '/about'],
  ['contact', '/contact'],
] as const

const BASE_DESKTOP_SCALE = 0.8
const DESKTOP_CANVAS_WIDTH = 1460

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    const update = () => setMatches(mediaQuery.matches)
    update()
    mediaQuery.addEventListener('change', update)
    return () => mediaQuery.removeEventListener('change', update)
  }, [query])

  return matches
}

function Navigation() {
  return (
    <nav className="site-nav" aria-label="Main navigation">
      {navigation.map(([label, to]) => (
        <NavLink key={to} to={to} end={to === '/'}>
          {label}
        </NavLink>
      ))}
    </nav>
  )
}

function SiteHeader() {
  return (
    <header className="site-header">
      <h1 className="wordmark">sanjevan rajasegar</h1>
      <Navigation />
    </header>
  )
}

function CollagePanels() {
  return (
    <>
      <EyeOfHorusPanel />
      <PhotoPanel />
      <RetroWindow title="About me" accessibleLabel="About me window" className="retro-window--intro">
        <IntroPanel />
      </RetroWindow>
      <RetroWindow title="Video" accessibleLabel="YouTube video preview" canMaximise={false} maximiseIndicatorOnly className="retro-window--youtube">
        <YouTubePreview />
      </RetroWindow>
      <RetroWindow title="Now playing" accessibleLabel="Spotify player" canMaximise={false} maximiseIndicatorOnly className="retro-window--spotify">
        <SpotifyPlayer />
      </RetroWindow>
      <SocialBrowser />
    </>
  )
}

function HomePage() {
  const isMobile = useMediaQuery(mobileHomeQuery)
  const isTablet = useMediaQuery('(min-width: 761px) and (max-width: 1199px), (min-width: 600px) and (max-width: 760px) and (min-height: 1000px), (min-width: 1200px) and (max-width: 1230px) and (min-height: 800px), (min-width: 1231px) and (max-width: 1440px) and (min-height: 901px)')
  const pageRef = useRef<HTMLElement>(null)
  const desktopCanvasRef = useRef<HTMLDivElement>(null)
  const desktopCollageRef = useRef<HTMLDivElement>(null)
  const [desktopRegion, setDesktopRegion] = useState({ width: 0, height: 0 })
  const [desktopLayout, setDesktopLayout] = useState({ scale: BASE_DESKTOP_SCALE, offsetX: 180, offsetY: 0, boundsWidth: DESKTOP_CANVAS_WIDTH, boundsHeight: 620 })

  useLayoutEffect(() => {
    const page = pageRef.current
    if (!page || isMobile || isTablet) return

    const updateRegion = () => {
      const style = window.getComputedStyle(page)
      const workspace = page.querySelector<HTMLElement>('.horizontal-workspace')
      const workspaceStyle = workspace ? window.getComputedStyle(workspace) : null
      const horizontalPadding = Number.parseFloat(style.paddingLeft) + Number.parseFloat(style.paddingRight)
      const verticalPadding = Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom)
      const workspaceHorizontalPadding = workspaceStyle
        ? Number.parseFloat(workspaceStyle.paddingLeft) + Number.parseFloat(workspaceStyle.paddingRight)
        : 0
      const workspaceVerticalPadding = workspaceStyle
        ? Number.parseFloat(workspaceStyle.paddingTop) + Number.parseFloat(workspaceStyle.paddingBottom)
        : 0
      const availableWidth = page.clientWidth - horizontalPadding - workspaceHorizontalPadding
      const availableHeight = page.clientHeight - verticalPadding - workspaceVerticalPadding
      if (availableWidth <= 0 || availableHeight <= 0) return
      setDesktopRegion((current) => Math.abs(current.width - availableWidth) < 1 && Math.abs(current.height - availableHeight) < 1
        ? current
        : { width: availableWidth, height: availableHeight })
    }

    updateRegion()
    const observer = new ResizeObserver(updateRegion)
    observer.observe(page)
    const workspace = page.querySelector('.horizontal-workspace')
    if (workspace) observer.observe(workspace)
    return () => observer.disconnect()
  }, [isMobile, isTablet])

  useLayoutEffect(() => {
    const collage = desktopCollageRef.current
    if (!collage || isMobile || isTablet || desktopRegion.width <= 0 || desktopRegion.height <= 0) return

    const measureBounds = () => {
      const canvas = desktopCanvasRef.current
      const currentScale = desktopLayout.scale || BASE_DESKTOP_SCALE
      const collageRect = collage.getBoundingClientRect()
      let minX = Number.POSITIVE_INFINITY
      let minY = Number.POSITIVE_INFINITY
      let maxX = Number.NEGATIVE_INFINITY
      let maxY = Number.NEGATIVE_INFINITY

      for (const child of Array.from(collage.children)) {
        if (!(child instanceof HTMLElement) || child.tagName === 'DIALOG') continue
        const rect = child.getBoundingClientRect()
        if (rect.width <= 0 || rect.height <= 0 || getComputedStyle(child).visibility === 'hidden') continue
        minX = Math.min(minX, (rect.left - collageRect.left) / currentScale)
        minY = Math.min(minY, (rect.top - collageRect.top) / currentScale)
        maxX = Math.max(maxX, (rect.right - collageRect.left) / currentScale)
        maxY = Math.max(maxY, (rect.bottom - collageRect.top) / currentScale)
      }
      if (!Number.isFinite(minX) || !Number.isFinite(minY)) return

      const boundsWidth = Math.max(1, maxX - minX)
      const boundsHeight = Math.max(1, maxY - minY)
      const scale = Math.min(BASE_DESKTOP_SCALE, desktopRegion.width / boundsWidth, desktopRegion.height / boundsHeight)
      const offsetX = -minX
      const offsetY = -minY + (desktopRegion.height / scale - boundsHeight) / 2
      setDesktopLayout((current) => {
        if (Math.abs(current.scale - scale) < 0.002 && Math.abs(current.offsetX - offsetX) < 0.5 && Math.abs(current.offsetY - offsetY) < 0.5 && Math.abs(current.boundsWidth - boundsWidth) < 1 && Math.abs(current.boundsHeight - boundsHeight) < 1) return current
        return { scale, offsetX, offsetY, boundsWidth, boundsHeight }
      })
      if (canvas) canvas.style.height = `${desktopRegion.height / BASE_DESKTOP_SCALE}px`
    }

    measureBounds()
    const resizeObserver = new ResizeObserver(measureBounds)
    resizeObserver.observe(collage)
    for (const child of Array.from(collage.children)) {
      if (child instanceof HTMLElement && child.tagName !== 'DIALOG') resizeObserver.observe(child)
    }
    const mutationObserver = new MutationObserver(measureBounds)
    mutationObserver.observe(collage, { childList: true })
    return () => {
      resizeObserver.disconnect()
      mutationObserver.disconnect()
    }
  }, [desktopRegion, desktopLayout.scale, isMobile, isTablet])

  return (
    <main ref={pageRef} className="page-shell page-shell--home">
      {isMobile ? (
        <div className="mobile-home-content">
          <PhotoPanel />
          <RetroWindow title="About me" accessibleLabel="About me window" className="retro-window--intro">
            <IntroPanel />
          </RetroWindow>
        </div>
      ) : (
        <HorizontalWorkspace label="Homepage panels. Scroll horizontally to browse.">
          {isTablet ? (
            <div className="collage-scale-stage--tablet">
              <div className="moodboard-collage moodboard-collage--tablet">
                <CollagePanels />
              </div>
            </div>
          ) : (
            <div
              className="collage-scale-stage--desktop"
              style={{ width: desktopLayout.boundsWidth * desktopLayout.scale, height: desktopRegion.height }}
            >
              <div
                ref={desktopCanvasRef}
                className="collage-scale-canvas--desktop"
                style={{ width: DESKTOP_CANVAS_WIDTH, height: desktopRegion.height / BASE_DESKTOP_SCALE, transform: `scale(${desktopLayout.scale})` }}
              >
                <div
                  ref={desktopCollageRef}
                  className="moodboard-collage moodboard-collage--desktop"
                  style={{ left: desktopLayout.offsetX, top: desktopLayout.offsetY }}
                >
                  <CollagePanels />
                </div>
              </div>
            </div>
          )}
        </HorizontalWorkspace>
      )}
    </main>
  )
}

function ComingSoonPage() {
  return (
    <main className="page-shell page-shell--coming-soon">
      <p className="coming-soon">Coming soon</p>
    </main>
  )
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <p>© Sanjevan Rajasegar 2026</p>
      <p>
        Website Developed by Sanjevan Rajasegar, Inspired by{' '}
        <a href="https://www.instagram.com/bicflame" target="_blank" rel="noopener noreferrer">bicflame</a>
      </p>
    </footer>
  )
}

function App() {
  const { pathname } = useLocation()
  const { theme, toggleTheme } = useTheme()
  const siteRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const site = siteRef.current
    const header = site?.querySelector<HTMLElement>('.site-header')
    const wordmark = site?.querySelector<HTMLElement>('.site-header .wordmark')
    const footer = site?.querySelector<HTMLElement>('.site-footer')
    if (!site || !header || !wordmark || !footer) return

    const updateRegionHeights = () => {
      site.style.setProperty('--site-header-height', `${header.getBoundingClientRect().height}px`)
      site.style.setProperty('--site-wordmark-height', `${wordmark.getBoundingClientRect().height}px`)
      site.style.setProperty('--site-footer-height', `${footer.getBoundingClientRect().height}px`)
    }
    updateRegionHeights()

    const observer = new ResizeObserver(updateRegionHeights)
    observer.observe(header)
    observer.observe(wordmark)
    observer.observe(footer)
    return () => {
      observer.disconnect()
      site.style.removeProperty('--site-header-height')
      site.style.removeProperty('--site-wordmark-height')
      site.style.removeProperty('--site-footer-height')
    }
  }, [])

  return (
    <HomeAudioProvider>
    <div className={`site${pathname === '/' ? ' site--home' : ''}`} ref={siteRef}>
      <MorphingBackground />
      <ThemeToggle theme={theme} onToggle={toggleTheme} />
      <SiteHeader />
      <div className="site-content">
      <div className={`home-route${pathname === '/' ? '' : ' home-route--inactive'}`} aria-hidden={pathname !== '/'}>
        <HomePage />
      </div>
      <Routes>
        <Route path="/" element={null} />
        <Route path="/projects" element={<ComingSoonPage />} />
        <Route path="/photography" element={<ComingSoonPage />} />
        <Route path="/about" element={<ComingSoonPage />} />
        <Route path="/contact" element={<ComingSoonPage />} />
        <Route path="*" element={<ComingSoonPage />} />
      </Routes>
      </div>
      <SiteFooter />
    </div>
    </HomeAudioProvider>
  )
}

export default App
