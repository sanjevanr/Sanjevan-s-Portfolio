import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { useHomeAudio } from './HomeAudio'

const bars = Array.from({ length: 16 }, (_, index) => ({
  id: index,
  duration: 450 + ((index * 73) % 550),
  delay: -((index * 97) % 900),
  amplitude: 0.68 + ((index * 17) % 30) / 100,
}))

function formatTime(value: number) {
  if (!Number.isFinite(value) || value < 0) return '0:00'
  const seconds = Math.floor(value)
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

export default function SpotifyPlayer() {
  const { audioRef, isPlaying, duration, canSeek, analyser, playbackError, togglePlayback, seekTo } = useHomeAudio()
  const visualizerRef = useRef<HTMLDivElement>(null)
  const analyserRef = useRef<AnalyserNode | null>(analyser)
  const animationFrameRef = useRef<number | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [isDocumentVisible, setIsDocumentVisible] = useState(() => !document.hidden)
  const [scrubTime, setScrubTime] = useState(0)
  const [isScrubbing, setIsScrubbing] = useState(false)

  analyserRef.current = analyser

  const stopVisualizer = useCallback((resetBars = true) => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    if (resetBars) {
      visualizerRef.current?.querySelectorAll<HTMLElement>('.visualizer-bar__motion').forEach((bar) => {
        const currentTransform = getComputedStyle(bar).transform
        bar.style.animation = 'none'
        bar.style.transform = currentTransform
        requestAnimationFrame(() => {
          bar.style.removeProperty('animation')
        })
      })
    }
  }, [])

  const startVisualizer = useCallback(() => {
    const visualizer = visualizerRef.current
    if (!visualizer || document.hidden || animationFrameRef.current !== null) return

    visualizer.querySelectorAll<HTMLElement>('.visualizer-bar__motion').forEach((bar) => {
      bar.style.removeProperty('animation')
      bar.style.removeProperty('transform')
    })

    const activeAnalyser = analyserRef.current
    if (!activeAnalyser) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      visualizer.querySelectorAll<HTMLElement>('.visualizer-bar__activity').forEach((bar) => {
        bar.style.opacity = '1'
      })
      return
    }

    const frequencies = new Uint8Array(activeAnalyser.frequencyBinCount)
    let lastPaint = 0
    const draw = (timestamp: number) => {
      const analyserNow = analyserRef.current
      if (!analyserNow || !visualizerRef.current) {
        animationFrameRef.current = null
        return
      }
      if (timestamp - lastPaint >= 50) {
        analyserNow.getByteFrequencyData(frequencies)
        const barsNow = visualizerRef.current.querySelectorAll<HTMLElement>('.visualizer-bar__activity')
        for (let index = 0; index < barsNow.length; index += 1) {
          const binIndex = Math.min(frequencies.length - 1, Math.floor(index * frequencies.length / barsNow.length))
          const brightness = 0.62 + (frequencies[binIndex] / 255) * 0.38
          barsNow[index].style.opacity = String(brightness)
        }
        lastPaint = timestamp
      }
      animationFrameRef.current = requestAnimationFrame(draw)
    }
    animationFrameRef.current = requestAnimationFrame(draw)
  }, [])

  useEffect(() => () => stopVisualizer(false), [stopVisualizer])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const syncTime = () => {
      const time = audio.currentTime
      if (Number.isFinite(time)) setCurrentTime(time)
    }
    syncTime()
    audio.addEventListener('timeupdate', syncTime)
    audio.addEventListener('seeked', syncTime)
    audio.addEventListener('ended', syncTime)
    return () => {
      audio.removeEventListener('timeupdate', syncTime)
      audio.removeEventListener('seeked', syncTime)
      audio.removeEventListener('ended', syncTime)
    }
  }, [audioRef])

  useEffect(() => {
    const updateVisibility = () => setIsDocumentVisible(!document.hidden)
    document.addEventListener('visibilitychange', updateVisibility)
    return () => document.removeEventListener('visibilitychange', updateVisibility)
  }, [])

  useEffect(() => {
    if (!isDocumentVisible) stopVisualizer(false)
    else if (isPlaying) startVisualizer()
    else stopVisualizer()
  }, [analyser, isDocumentVisible, isPlaying, startVisualizer, stopVisualizer])

  useEffect(() => {
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotion = () => {
      if (motionPreference.matches) {
        stopVisualizer(false)
        if (isPlaying) {
          visualizerRef.current?.querySelectorAll<HTMLElement>('.visualizer-bar__activity').forEach((bar) => {
            bar.style.opacity = '1'
          })
        }
      } else if (isPlaying && isDocumentVisible) {
        startVisualizer()
      }
    }
    motionPreference.addEventListener('change', updateMotion)
    return () => motionPreference.removeEventListener('change', updateMotion)
  }, [isDocumentVisible, isPlaying, startVisualizer, stopVisualizer])

  const seekBy = (offset: number) => {
    const time = (audioRef.current?.currentTime ?? currentTime) + offset
    seekTo(time)
    setCurrentTime(Math.max(0, time))
    setScrubTime(Math.max(0, time))
  }
  const progress = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0
  const sliderValue = isScrubbing ? scrubTime : currentTime

  return (
    <section className={`spotify-player${isPlaying ? ' spotify-player--playing' : ' spotify-player--paused'}${analyser ? ' spotify-player--analyser' : ''}${isDocumentVisible ? '' : ' spotify-player--hidden'}`} aria-label="Now playing Highs 2 Lows by Nujabes">
      <div className="spotify-player__art" aria-hidden="true">
        <img src="/nujabes-album-cover.jpg" alt="" />
      </div>

      <div className="spotify-player__display">
        <div ref={visualizerRef} className="spotify-player__visualizer" aria-hidden="true">
          {bars.map((bar) => (
            <span className="visualizer-bar" key={bar.id}>
              <span
                className="visualizer-bar__motion"
                style={{
                  '--bar-duration': `${bar.duration}ms`,
                  '--bar-delay': `${bar.delay}ms`,
                  '--bar-amplitude': bar.amplitude,
                } as CSSProperties & { '--bar-duration': string; '--bar-delay': string; '--bar-amplitude': number }}
              >
                <span className="visualizer-bar__activity" />
              </span>
            </span>
          ))}
        </div>
        <div className="spotify-player__track">
          <h2>Highs 2 Lows</h2>
          <p>Nujabes</p>
        </div>
      </div>

      <div className="spotify-player__controls" role="group" aria-label="Music playback controls">
        <button className="spotify-player__skip" type="button" disabled={!canSeek} aria-label="Rewind 10 seconds" title="Rewind 10 seconds" onClick={() => seekBy(-10)}>−10s</button>
        <button
          className="spotify-player__play"
          type="button"
          aria-label={isPlaying ? 'Pause playback' : 'Play playback'}
          title={isPlaying ? 'Pause' : 'Play'}
          aria-pressed={isPlaying}
          onClick={() => { void togglePlayback() }}
        >
          <span aria-hidden="true">{isPlaying ? 'Ⅱ' : '▶'}</span>
        </button>
        <button className="spotify-player__skip" type="button" disabled={!canSeek} aria-label="Forward 10 seconds" title="Forward 10 seconds" onClick={() => seekBy(10)}>+10s</button>
      </div>

      <div className="spotify-player__timeline">
        <span className="spotify-player__time" aria-hidden="true">{formatTime(isScrubbing ? scrubTime : currentTime)}</span>
        <input
          className="spotify-player__progress"
          type="range"
          min={0}
          max={duration || 1}
          step={0.1}
          value={Math.min(duration || 1, Math.max(0, sliderValue))}
          disabled={!canSeek}
          aria-label="Track position"
          aria-valuetext={`${formatTime(isScrubbing ? scrubTime : currentTime)} of ${formatTime(duration)}`}
          style={{ '--progress': `${isScrubbing && duration ? (scrubTime / duration) * 100 : progress}%` } as CSSProperties & { '--progress': string }}
          onPointerDown={() => {
            setIsScrubbing(true)
            setScrubTime(currentTime)
          }}
          onPointerUp={() => setIsScrubbing(false)}
          onPointerCancel={() => setIsScrubbing(false)}
          onBlur={() => setIsScrubbing(false)}
          onChange={(event) => {
            const nextTime = Number(event.currentTarget.value)
            setScrubTime(nextTime)
            setCurrentTime(nextTime)
            seekTo(nextTime)
          }}
        />
        <span className="spotify-player__time" aria-hidden="true">{formatTime(duration)}</span>
      </div>

      {playbackError && <p className="spotify-player__error" role="status">Playback could not start. Try again.</p>}
    </section>
  )
}
