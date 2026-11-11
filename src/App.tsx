import { useEffect, useState } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'

const navigation = [
  ['home', '/'],
  ['projects', '/projects'],
  ['photography', '/photography'],
  ['about', '/about'],
  ['contact', '/contact'],
] as const

function AmbientBackground() {
  return (
    <div className="ambient" aria-hidden="true">
      <div className="ambient__palette" />
      <div className="ambient__palette ambient__palette--second" />
      <div className="ambient__palette ambient__palette--third" />
      <div className="ambient__palette ambient__palette--fourth" />
      <div className="ambient__bands" />
      <div className="ambient__scanlines" />
      <div className="ambient__texture" />
      <span className="orb orb--one" />
      <span className="orb orb--two" />
      <span className="ring ring--one" />
      <span className="ring ring--two" />
      <span className="dot-cluster dot-cluster--one">••••<br />••••<br />••••</span>
      <span className="dot-cluster dot-cluster--two">••••<br />••••<br />••••</span>
    </div>
  )
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
    <main className="page-shell">
      <h1 className="wordmark">sanjevan rajasegar</h1>
      <PhotoPlaceholder />
      <Navigation />
    </main>
  )
}

function ComingSoonPage() {
  return (
    <main className="page-shell page-shell--coming-soon">
      <p className="coming-soon">Coming soon</p>
      <Navigation />
    </main>
  )
}

function App() {
  const [isVisible, setIsVisible] = useState(() => document.visibilityState === 'visible')

  useEffect(() => {
    const updateVisibility = () => setIsVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', updateVisibility)
    return () => document.removeEventListener('visibilitychange', updateVisibility)
  }, [])

  return (
    <>
      <div className={isVisible ? undefined : 'ambient-paused'}>
        <AmbientBackground />
      </div>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/projects" element={<ComingSoonPage />} />
        <Route path="/photography" element={<ComingSoonPage />} />
        <Route path="/about" element={<ComingSoonPage />} />
        <Route path="/contact" element={<ComingSoonPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </>
  )
}

export default App
