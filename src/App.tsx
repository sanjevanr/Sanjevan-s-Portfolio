import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import MorphingBackground from './components/background/MorphingBackground'
import EyeOfHorusPanel from './components/EyeOfHorusPanel'
import HorizontalWorkspace from './components/HorizontalWorkspace'
import { IntroPanel } from './components/IntroPanel'
import PhotoPanel from './components/PhotoPanel'
import RetroWindow from './components/RetroWindow'
import { HomeAudioProvider, mobileHomeQuery, tabletHomeQuery, useMediaQuery } from './components/HomeAudio'
import EnterSiteButton from './components/EnterSiteButton'
import SocialBrowser from './components/SocialBrowser'
import SpotifyPlayer from './components/SpotifyPlayer'
import ThemeToggle from './components/ThemeToggle'
import ProjectsPage from './components/projects/ProjectsPage'
import ResumeShortcut from './components/projects/ResumeShortcut'
import YouTubePreview from './components/YouTubePreview'
import ContactPage from './components/ContactPage'
import AboutPage from './components/AboutPage'

type Theme = 'light' | 'dark'
type ThemePreference = 'system' | 'light' | 'dark'

const themeStorageKey = 'sanjevan-theme'

function readThemePreference(): ThemePreference {
  try {
    const storedTheme = window.localStorage.getItem(themeStorageKey)
    return storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : 'system'
  } catch {
    return 'system'
  }
}

function useTheme() {
  const [preference, setPreference] = useState<ThemePreference>(readThemePreference)
  const [systemIsDark, setSystemIsDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)
  const theme: Theme = preference === 'system' ? (systemIsDark ? 'dark' : 'light') : preference

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const updateFromSystem = () => setSystemIsDark(mediaQuery.matches)
    mediaQuery.addEventListener('change', updateFromSystem)
    return () => mediaQuery.removeEventListener('change', updateFromSystem)
  }, [])

  const toggleTheme = useCallback(() => {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark'
    setPreference(nextTheme)
    try {
      window.localStorage.setItem(themeStorageKey, nextTheme)
    } catch {
      // Continue with the in-memory selection when storage is unavailable.
    }
  }, [theme])

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
const MIN_READABLE_COLLAGE_SCALE = 0.55
const DESKTOP_CANVAS_WIDTH = 1460
const TABLET_CANVAS_WIDTH = 1100

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

function SiteHeader({ theme, onToggleTheme }: { theme: Theme; onToggleTheme: () => void }) {
  return (
    <header className="site-header">
      <div className="site-header__brand">
        <h1 className="wordmark">sanjevan rajasegar</h1>
        <div className="site-utilities" role="group" aria-label="Site utilities">
          <EnterSiteButton />
          <ResumeShortcut />
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </div>
      <Navigation />
    </header>
  )
}

function CollagePanels({ showMusic }: { showMusic: boolean }) {
  return (
    <>
      <EyeOfHorusPanel />
      <PhotoPanel />
      <RetroWindow title="About me" accessibleLabel="About me window" className="retro-window--intro">
        <IntroPanel />
      </RetroWindow>
      <RetroWindow title="Video" accessibleLabel="YouTube video preview" canMaximise={false} className="retro-window--youtube">
        <YouTubePreview />
      </RetroWindow>
      {showMusic && (
        <RetroWindow title="Now playing" accessibleLabel="Spotify player" canMaximise={false} className="retro-window--spotify">
          <SpotifyPlayer />
        </RetroWindow>
      )}
      <SocialBrowser />
    </>
  )
}

function HomePage() {
  const isMobile = useMediaQuery(mobileHomeQuery)
  const isTablet = useMediaQuery(tabletHomeQuery)
  const { pathname } = useLocation()
  const pageRef = useRef<HTMLElement>(null)
  const desktopCanvasRef = useRef<HTMLDivElement>(null)
  const desktopCollageRef = useRef<HTMLDivElement>(null)
  const tabletCanvasRef = useRef<HTMLDivElement>(null)
  const tabletCollageRef = useRef<HTMLDivElement>(null)
  const [desktopRegion, setDesktopRegion] = useState({ width: 0, height: 0 })
  const [tabletRegion, setTabletRegion] = useState({ width: 0, height: 0 })
  const [desktopLayout, setDesktopLayout] = useState({ scale: BASE_DESKTOP_SCALE, offsetX: 180, offsetY: 0, boundsWidth: DESKTOP_CANVAS_WIDTH, boundsHeight: 620, scrollX: false, scrollY: false })
  const [tabletLayout, setTabletLayout] = useState({ scale: 1, offsetX: 0, offsetY: 0, boundsWidth: TABLET_CANVAS_WIDTH, boundsHeight: 840, scrollX: false, scrollY: false })

  useEffect(() => {
    const updateMusicScale = () => {
      let scale = 1
      const homeIsVisible = Boolean(pageRef.current?.getClientRects().length)
      if (isMobile) {
        scale = 1
      } else if (isTablet) {
        scale = homeIsVisible && tabletRegion.width > 0
          ? tabletLayout.scale
          : Math.min(1, (window.innerWidth - 80) / 1100, (window.innerHeight - 220) / 840)
      } else {
        scale = homeIsVisible && desktopRegion.width > 0
          ? desktopLayout.scale
          : Math.min(BASE_DESKTOP_SCALE, (window.innerWidth - 100) / 1457, (window.innerHeight - 220) / 718)
      }
      document.documentElement.style.setProperty('--home-collage-scale', String(Math.max(0.45, scale)))
    }

    updateMusicScale()
    window.addEventListener('resize', updateMusicScale)
    return () => window.removeEventListener('resize', updateMusicScale)
  }, [desktopLayout.scale, desktopRegion.width, isMobile, isTablet, tabletLayout.scale, tabletRegion.width])

  useLayoutEffect(() => {
    const page = pageRef.current
    if (!page || isMobile || !isTablet) return

    const updateTabletRegion = () => {
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
      const width = page.clientWidth - horizontalPadding - workspaceHorizontalPadding
      const height = page.clientHeight - verticalPadding - workspaceVerticalPadding
      if (width <= 0 || height <= 0) return
      setTabletRegion((current) => Math.abs(current.width - width) < 1 && Math.abs(current.height - height) < 1
        ? current
        : { width, height })
    }

    updateTabletRegion()
    const observer = new ResizeObserver(updateTabletRegion)
    observer.observe(page)
    const workspace = page.querySelector('.horizontal-workspace')
    if (workspace) observer.observe(workspace)
    return () => observer.disconnect()
  }, [isMobile, isTablet])

  useLayoutEffect(() => {
    const collage = tabletCollageRef.current
    if (!collage || isMobile || !isTablet || tabletRegion.width <= 0 || tabletRegion.height <= 0) return

    const measureBounds = () => {
      const canvas = tabletCanvasRef.current
      const currentScale = tabletLayout.scale || 1
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
      const widthScale = tabletRegion.width / boundsWidth
      const heightScale = tabletRegion.height / boundsHeight
      const fitScale = Math.min(1, widthScale, heightScale)
      const scale = fitScale
      const scrollX = false
      const scrollY = false
      const offsetX = -minX + (tabletRegion.width / scale - boundsWidth) / 2
      const offsetY = -minY + (tabletRegion.height / scale - boundsHeight) / 2
      setTabletLayout((current) => {
        if (Math.abs(current.scale - scale) < 0.002 && Math.abs(current.offsetX - offsetX) < 0.5 && Math.abs(current.offsetY - offsetY) < 0.5 && Math.abs(current.boundsWidth - boundsWidth) < 1 && Math.abs(current.boundsHeight - boundsHeight) < 1 && current.scrollX === scrollX && current.scrollY === scrollY) return current
        return { scale, offsetX, offsetY, boundsWidth, boundsHeight, scrollX, scrollY }
      })
      if (canvas) canvas.style.height = `${scrollY ? boundsHeight : tabletRegion.height / scale}px`
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
  }, [tabletRegion, tabletLayout.scale, isMobile, isTablet])

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
      const widthScale = desktopRegion.width / boundsWidth
      const heightScale = desktopRegion.height / boundsHeight
      const fitScale = Math.min(BASE_DESKTOP_SCALE, widthScale, heightScale)
      const scale = Math.max(MIN_READABLE_COLLAGE_SCALE, fitScale)
      const scrollX = widthScale < MIN_READABLE_COLLAGE_SCALE
      const scrollY = heightScale < MIN_READABLE_COLLAGE_SCALE
      const offsetX = -minX + (scrollX ? 0 : (desktopRegion.width / scale - boundsWidth) / 2)
      const offsetY = -minY + (scrollY ? 0 : (desktopRegion.height / scale - boundsHeight) / 2)
      setDesktopLayout((current) => {
        if (Math.abs(current.scale - scale) < 0.002 && Math.abs(current.offsetX - offsetX) < 0.5 && Math.abs(current.offsetY - offsetY) < 0.5 && Math.abs(current.boundsWidth - boundsWidth) < 1 && Math.abs(current.boundsHeight - boundsHeight) < 1 && current.scrollX === scrollX && current.scrollY === scrollY) return current
        return { scale, offsetX, offsetY, boundsWidth, boundsHeight, scrollX, scrollY }
      })
      if (canvas) canvas.style.height = `${scrollY ? boundsHeight : desktopRegion.height / BASE_DESKTOP_SCALE}px`
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
            <div
              className="collage-scale-stage--tablet"
              style={{ width: tabletLayout.scrollX ? tabletLayout.boundsWidth * tabletLayout.scale : tabletRegion.width, height: tabletLayout.scrollY ? tabletLayout.boundsHeight * tabletLayout.scale : tabletRegion.height }}
            >
              <div
                ref={tabletCanvasRef}
                className="collage-scale-canvas--tablet"
                style={{ width: TABLET_CANVAS_WIDTH, height: tabletLayout.scrollY ? tabletLayout.boundsHeight : tabletRegion.height / tabletLayout.scale, transform: `scale(${tabletLayout.scale})` }}
              >
                <div
                  ref={tabletCollageRef}
                  className="moodboard-collage moodboard-collage--tablet"
                  style={{ left: tabletLayout.offsetX, top: tabletLayout.offsetY }}
                >
                  <CollagePanels showMusic={pathname === '/'} />
                </div>
              </div>
            </div>
          ) : (
            <div
              className="collage-scale-stage--desktop"
              style={{ width: desktopLayout.scrollX ? desktopLayout.boundsWidth * desktopLayout.scale : desktopRegion.width, height: desktopLayout.scrollY ? desktopLayout.boundsHeight * desktopLayout.scale : desktopRegion.height }}
            >
              <div
                ref={desktopCanvasRef}
                className="collage-scale-canvas--desktop"
                style={{ width: DESKTOP_CANVAS_WIDTH, height: desktopLayout.scrollY ? desktopLayout.boundsHeight : desktopRegion.height / BASE_DESKTOP_SCALE, transform: `scale(${desktopLayout.scale})` }}
              >
                <div
                  ref={desktopCollageRef}
                  className="moodboard-collage moodboard-collage--desktop"
                  style={{ left: desktopLayout.offsetX, top: desktopLayout.offsetY }}
                >
                  <CollagePanels showMusic={pathname === '/'} />
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
    const nav = site?.querySelector<HTMLElement>('.site-nav')
    const footer = site?.querySelector<HTMLElement>('.site-footer')
    if (!site || !header || !wordmark || !nav || !footer) return

    const updateRegionHeights = () => {
      site.style.setProperty('--site-header-height', `${header.getBoundingClientRect().height}px`)
      site.style.setProperty('--site-wordmark-height', `${wordmark.getBoundingClientRect().height}px`)
      site.style.setProperty('--site-nav-height', `${nav.getBoundingClientRect().height}px`)
      site.style.setProperty('--site-footer-height', `${footer.getBoundingClientRect().height}px`)
    }
    updateRegionHeights()

    const observer = new ResizeObserver(updateRegionHeights)
    observer.observe(header)
    observer.observe(wordmark)
    observer.observe(nav)
    observer.observe(footer)
    return () => {
      observer.disconnect()
      site.style.removeProperty('--site-header-height')
      site.style.removeProperty('--site-wordmark-height')
      site.style.removeProperty('--site-nav-height')
      site.style.removeProperty('--site-footer-height')
    }
  }, [])

  return (
    <HomeAudioProvider>
    <div className={`site${pathname === '/' ? ' site--home' : ''}${pathname === '/projects' ? ' site--projects' : ''}${pathname === '/contact' ? ' site--contact' : ''}${pathname === '/about' ? ' site--about' : ''}`} ref={siteRef}>
      <MorphingBackground />
      <SiteHeader theme={theme} onToggleTheme={toggleTheme} />
      <div className="site-content">
      <div className={`home-route${pathname === '/' ? '' : ' home-route--inactive'}`} aria-hidden={pathname !== '/' ? true : undefined} inert={pathname !== '/' ? true : undefined}>
        <HomePage />
      </div>
      <Routes>
        <Route path="/" element={null} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/photography" element={<ComingSoonPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="*" element={<ComingSoonPage />} />
      </Routes>
      </div>
      <SiteFooter />
    </div>
    </HomeAudioProvider>
  )
}

export default App
