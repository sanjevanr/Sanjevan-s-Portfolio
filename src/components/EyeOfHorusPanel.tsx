import RetroWindow from './RetroWindow'

function EyeOfHorusContent() {
  return (
    <article className="intro-panel eye-panel">
      <div className="eye-panel__copy">
        <header className="intro-panel__header">
          <h2>the eye of horus.</h2>
        </header>
        <div className="intro-panel__content">
          <p>To me, this logo represents seeing through a believing and trusting yourself as a visionary.</p>
          <p>It reflects how I approach creativity, photography, and software development, by trusting my perspective, and creating with intention every step of the way.</p>
        </div>
      </div>
      <picture className="eye-panel__art">
        <source media="(prefers-reduced-motion: reduce)" srcSet="/rotating-eye-static.png" />
        <img className="eye-panel__gif" src="/rotating-eye.gif" alt="" />
      </picture>
    </article>
  )
}

export default function EyeOfHorusPanel() {
  return (
    <RetroWindow
      title="Eye of Horus"
      accessibleLabel="Eye of Horus information panel"
      singleContentMount
      className="retro-window--eye-horus"
    >
      <EyeOfHorusContent />
    </RetroWindow>
  )
}
