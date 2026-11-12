import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import MorphingBackground from './components/background/MorphingBackground'
import HorizontalWorkspace from './components/HorizontalWorkspace'
import { IntroPanel } from './components/IntroPanel'
import PhotoPanel from './components/PhotoPanel'
import RetroWindow from './components/RetroWindow'
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

function HomePage() {
  return (
    <main className="page-shell page-shell--home">
      <HorizontalWorkspace label="Homepage panels. Scroll horizontally to browse.">
        <div className="moodboard-collage">
          <PhotoPanel />
          <RetroWindow title="About me" accessibleLabel="About me window" className="retro-window--intro">
            <IntroPanel />
          </RetroWindow>
          <RetroWindow title="Now playing" accessibleLabel="Spotify player" canMaximise={false} maximiseIndicatorOnly className="retro-window--spotify">
            <SpotifyPlayer />
          </RetroWindow>
          <RetroWindow title="Video" accessibleLabel="YouTube video preview" canMaximise={false} maximiseIndicatorOnly className="retro-window--youtube">
            <YouTubePreview />
          </RetroWindow>
        </div>
      </HorizontalWorkspace>
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
    <div className={`site${pathname === '/' ? ' site--home' : ''}`} ref={siteRef}>
      <MorphingBackground />
      <ThemeToggle theme={theme} onToggle={toggleTheme} />
      <SiteHeader />
      <div className="site-content">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/projects" element={<ComingSoonPage />} />
        <Route path="/photography" element={<ComingSoonPage />} />
        <Route path="/about" element={<ComingSoonPage />} />
        <Route path="/contact" element={<ComingSoonPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
      </div>
      <SiteFooter />
    </div>
  )
}

export default App
