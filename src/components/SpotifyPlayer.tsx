import { useRef, useState } from 'react'

const bars = Array.from({ length: 24 }, (_, index) => index)
// No licensed audio file is bundled with the project. Add a local source here
// when one is available; the player controls then follow the real audio element.
const audioSource: string | undefined = undefined

export default function SpotifyPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)

  const togglePlayback = async () => {
    const audio = audioRef.current
    if (!audio || !audioSource) return
    if (audio.paused) {
      try {
        await audio.play()
      } catch {
        setIsPlaying(false)
      }
    } else {
      audio.pause()
    }
  }

  return (
    <section className={`spotify-player${isPlaying ? ' spotify-player--playing' : ''}`} aria-label="Now playing Highs 2 Lows by Nujabes">
      <div className="spotify-player__art" aria-hidden="true">
        <img src="/nujabes-album-cover.jpg" alt="" />
      </div>
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

      <div className="spotify-player__controls" role="group" aria-label="Music playback controls">
        <button className="spotify-player__skip" type="button" disabled aria-label="Previous track unavailable">‹</button>
        <button
          className="spotify-player__play"
          type="button"
          disabled={!audioSource}
          aria-label={!audioSource ? 'Playback unavailable: no audio file is installed' : isPlaying ? 'Pause playback' : 'Play playback'}
          title={!audioSource ? 'Audio file is not available' : isPlaying ? 'Pause' : 'Play'}
          aria-pressed={isPlaying}
          onClick={togglePlayback}
        >
          <span aria-hidden="true">{isPlaying ? 'Ⅱ' : '▶'}</span>
        </button>
        <button className="spotify-player__skip" type="button" disabled aria-label="Next track unavailable">›</button>
      </div>

      <div className="spotify-player__progress" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>
      <audio
        className="spotify-player__audio"
        ref={audioRef}
        src={audioSource}
        preload="none"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onTimeUpdate={(event) => {
          const { currentTime, duration } = event.currentTarget
          setProgress(duration > 0 ? (currentTime / duration) * 100 : 0)
        }}
      />
    </section>
  )
}
