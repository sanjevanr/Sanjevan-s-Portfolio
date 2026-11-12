import { NavLink, Route, Routes } from 'react-router-dom'
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

function BottomDock() {
  return (
    <div className="bottom-dock">
      <Navigation />
      <footer className="site-footer">
        <p>© Sanjevan Rajasegar 2026</p>
        <p>
          Website Developed by Sanjevan Rajasegar, Inspired by{' '}
          <a href="https://www.instagram.com/bicflame" target="_blank" rel="noopener noreferrer">bicflame</a>
        </p>
      </footer>
    </div>
  )
}

function App() {
  return (
    <div className="site">
      <MorphingBackground />
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
      <BottomDock />
    </div>
  )
}

export default App
