import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import audioSource from '../assets/Nujabes - Highs 2 Lows (feat.Cise Starr from CYNE) [Official Audio].mp3'

const bars = Array.from({ length: 16 }, (_, index) => ({
  id: index,
  duration: 450 + ((index * 73) % 550),
  delay: -((index * 97) % 900),
  amplitude: 0.68 + ((index * 17) % 30) / 100,
}))

let autoplayAttempted = false

function validDuration(value: number) {
  return Number.isFinite(value) && value > 0 ? value : 0
}

function formatTime(value: number) {
  if (!Number.isFinite(value) || value < 0) return '0:00'
  const seconds = Math.floor(value)
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

export default function SpotifyPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const visualizerRef = useRef<HTMLDivElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [canSeek, setCanSeek] = useState(false)
  const [hasAnalyser, setHasAnalyser] = useState(false)
  const [isDocumentVisible, setIsDocumentVisible] = useState(() => !document.hidden)
  const [scrubTime, setScrubTime] = useState(0)
  const [isScrubbing, setIsScrubbing] = useState(false)
  const [playbackError, setPlaybackError] = useState(false)

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
    const analyser = analyserRef.current
    const visualizer = visualizerRef.current
    if (!visualizer || document.hidden || animationFrameRef.current !== null) return

    visualizer.querySelectorAll<HTMLElement>('.visualizer-bar__motion').forEach((bar) => {
      bar.style.removeProperty('animation')
      bar.style.removeProperty('transform')
    })

    if (!analyser) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      visualizer.querySelectorAll<HTMLElement>('.visualizer-bar__activity').forEach((bar) => {
        bar.style.opacity = '1'
      })
      return
    }

    const frequencies = new Uint8Array(analyser.frequencyBinCount)
    let lastPaint = 0
    const draw = (timestamp: number) => {
      if (!analyserRef.current || !visualizerRef.current) {
        animationFrameRef.current = null
        return
      }
      if (timestamp - lastPaint >= 50) {
        analyserRef.current.getByteFrequencyData(frequencies)
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

  const prepareAnalyser = useCallback(async (audio: HTMLAudioElement) => {
    if (typeof window.AudioContext === 'undefined') return
    try {
      let context = audioContextRef.current
      if (context?.state === 'closed' && sourceNodeRef.current) {
        analyserRef.current = null
        setHasAnalyser(false)
        return
      }
      if (!context || context.state === 'closed') {
        context = new window.AudioContext()
        audioContextRef.current = context
      }
      if (context.state === 'suspended') await context.resume()
      if (!sourceNodeRef.current) sourceNodeRef.current = context.createMediaElementSource(audio)
      if (!analyserRef.current) {
        const analyser = context.createAnalyser()
        analyser.fftSize = 64
        analyser.smoothingTimeConstant = 0.78
        sourceNodeRef.current.connect(analyser)
        analyser.connect(context.destination)
        analyserRef.current = analyser
      }
      setHasAnalyser(true)
    } catch {
      // Native audio playback still works if Web Audio analysis is unavailable.
      const context = audioContextRef.current
      const source = sourceNodeRef.current
      if (context && source && !analyserRef.current) {
        try {
          source.disconnect()
          source.connect(context.destination)
        } catch {
          // Keep native playback errors visible through the audio element.
        }
      }
      analyserRef.current = null
      setHasAnalyser(false)
    }
  }, [])

  useEffect(() => () => {
    stopVisualizer(false)
    audioRef.current?.pause()
    sourceNodeRef.current?.disconnect()
    analyserRef.current?.disconnect()
    const context = audioContextRef.current
    if (context && context.state !== 'closed') void context.close()
    sourceNodeRef.current = null
    analyserRef.current = null
    audioContextRef.current = null
  }, [stopVisualizer])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || autoplayAttempted) return
    // Defer one tick so React StrictMode's development-only setup/cleanup cycle
    // does not consume the one autoplay attempt before the page settles.
    const attempt = window.setTimeout(() => {
      if (autoplayAttempted) return
      autoplayAttempted = true
      void audio.play().then(() => {
        setIsPlaying(!audio.paused)
      }).catch(() => {
        setIsPlaying(false)
      })
    }, 0)
    return () => window.clearTimeout(attempt)
  }, [])

  useEffect(() => {
    const updateVisibility = () => setIsDocumentVisible(!document.hidden)
    document.addEventListener('visibilitychange', updateVisibility)
    return () => document.removeEventListener('visibilitychange', updateVisibility)
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (!isDocumentVisible) stopVisualizer(false)
    else if (!audio.paused) startVisualizer()
  }, [isDocumentVisible, startVisualizer, stopVisualizer])

  useEffect(() => {
    const audio = audioRef.current
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotion = () => {
      if (motionPreference.matches) {
        stopVisualizer(false)
        if (!audio?.paused) {
          visualizerRef.current?.querySelectorAll<HTMLElement>('.visualizer-bar__activity').forEach((bar) => {
            bar.style.opacity = '1'
          })
        }
      } else if (audio && !audio.paused && isDocumentVisible) {
        startVisualizer()
      }
    }
    motionPreference.addEventListener('change', updateMotion)
    return () => motionPreference.removeEventListener('change', updateMotion)
  }, [isDocumentVisible, startVisualizer, stopVisualizer])

  const togglePlayback = async () => {
    const audio = audioRef.current
    if (!audio) return
    autoplayAttempted = true
    if (!audio.paused) {
      audio.pause()
      return
    }

    await prepareAnalyser(audio)
    try {
      await audio.play()
      setPlaybackError(false)
    } catch {
      setIsPlaying(false)
      stopVisualizer()
      setPlaybackError(true)
    }
  }

  const seekTo = (time: number) => {
    const audio = audioRef.current
    const availableDuration = validDuration(audio?.duration ?? duration)
    if (!audio || !availableDuration || audio.seekable.length === 0) return
    const nextTime = Math.min(availableDuration, Math.max(0, time))
    audio.currentTime = nextTime
    setCurrentTime(nextTime)
    setScrubTime(nextTime)
  }

  const seekBy = (offset: number) => seekTo((audioRef.current?.currentTime ?? currentTime) + offset)
  const progress = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0
  const sliderValue = isScrubbing ? scrubTime : currentTime

  const updateMetadata = (audio: HTMLAudioElement) => {
    const nextDuration = validDuration(audio.duration)
    setDuration(nextDuration)
    setCanSeek(nextDuration > 0 && audio.seekable.length > 0)
  }

  return (
    <section className={`spotify-player${isPlaying ? ' spotify-player--playing' : ' spotify-player--paused'}${hasAnalyser ? ' spotify-player--analyser' : ''}${isDocumentVisible ? '' : ' spotify-player--hidden'}`} aria-label="Now playing Highs 2 Lows by Nujabes">
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
          onClick={togglePlayback}
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
            seekTo(nextTime)
          }}
        />
        <span className="spotify-player__time" aria-hidden="true">{formatTime(duration)}</span>
      </div>

      {playbackError && <p className="spotify-player__error" role="status">Playback could not start. Try again.</p>}

      <audio
        ref={audioRef}
        src={audioSource}
        preload="metadata"
        onLoadedMetadata={(event) => updateMetadata(event.currentTarget)}
        onDurationChange={(event) => updateMetadata(event.currentTarget)}
        onProgress={(event) => updateMetadata(event.currentTarget)}
        onCanPlay={(event) => updateMetadata(event.currentTarget)}
        onTimeUpdate={(event) => {
          const time = event.currentTarget.currentTime
          if (Number.isFinite(time)) setCurrentTime(time)
        }}
        onPlay={() => {
          setIsPlaying(true)
          startVisualizer()
        }}
        onPause={() => {
          setIsPlaying(false)
          stopVisualizer()
        }}
        onEnded={(event) => {
          setIsPlaying(false)
          setCurrentTime(validDuration(event.currentTarget.duration))
          stopVisualizer()
        }}
        onError={() => {
          setIsPlaying(false)
          stopVisualizer()
          setPlaybackError(true)
        }}
      />
    </section>
  )
}
