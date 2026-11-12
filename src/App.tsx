import { useLayoutEffect, useRef } from 'react'
import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import MorphingBackground from './components/background/MorphingBackground'

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

function PhotoPlaceholder() {
  return (
    <figure className="photo-frame" aria-label="Featured photograph placeholder">
      <div className="photo-frame__inner">
        <span className="photo-cross photo-cross--top" aria-hidden="true">+</span>
        <div className="placeholder-copy">
          <span className="placeholder-copy__title">FEATURED<br />PHOTOGRAPH</span>
          <span className="placeholder-copy__pending">IMAGE PENDING</span>
        </div>
        <span className="photo-cross photo-cross--bottom" aria-hidden="true">+</span>
      </div>
    </figure>
  )
}

function HomePage() {
  return (
    <main className="page-shell page-shell--home">
      <PhotoPlaceholder />
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
