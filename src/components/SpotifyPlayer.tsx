import { useState } from 'react'

const bars = Array.from({ length: 24 }, (_, index) => index)

export default function SpotifyPlayer() {
  const [isPlaying, setIsPlaying] = useState(true)

  return (
    <section className={`spotify-player${isPlaying ? ' spotify-player--playing' : ''}`} aria-label="Now playing Highs 2 Lows by Nujabes">
      <div className="spotify-player__display">
        <div className="spotify-player__visualizer" aria-hidden="true">
          {bars.map((bar) => (
            <span key={bar} style={{ animationDelay: `${(bar % 8) * -110}ms` }} />
          ))}
        </div>
        <div className="spotify-player__track">
          <h2>Highs 2 Lows</h2>
          <p>Nujabes</p>
        </div>
      </div>

      <div className="spotify-player__controls" role="group" aria-label="Visual player controls">
        <button className="spotify-player__skip" type="button" disabled aria-label="Previous track unavailable">‹</button>
        <button
          className="spotify-player__play"
          type="button"
          aria-label={isPlaying ? 'Pause visualizer' : 'Resume visualizer'}
          title={isPlaying ? 'Pause visualizer' : 'Resume visualizer'}
          aria-pressed={isPlaying}
          onClick={() => setIsPlaying((playing) => !playing)}
        >
          <span aria-hidden="true">{isPlaying ? 'Ⅱ' : '▶'}</span>
        </button>
        <button className="spotify-player__skip" type="button" disabled aria-label="Next track unavailable">›</button>
      </div>

      <div className="spotify-player__progress" aria-hidden="true">
        <span />
      </div>
    </section>
  )
}
