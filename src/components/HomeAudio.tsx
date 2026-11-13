import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react'
import { useLocation } from 'react-router-dom'
import audioSource from '../assets/Nujabes - Highs 2 Lows (feat.Cise Starr from CYNE) [Official Audio].mp3'

export const mobileHomeQuery = '(max-width: 599px), (max-width: 760px) and (max-height: 999px)'

type HomeAudioContextValue = {
  audioRef: RefObject<HTMLAudioElement | null>
  isPlaying: boolean
  duration: number
  canSeek: boolean
  analyser: AnalyserNode | null
  playbackError: boolean
  togglePlayback: () => Promise<void>
  seekTo: (time: number) => void
}

const HomeAudioContext = createContext<HomeAudioContextValue | null>(null)

function validDuration(value: number) {
  return Number.isFinite(value) && value > 0 ? value : 0
}

function readAudioState(context: AudioContext) {
  return context.state
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    const update = () => setMatches(mediaQuery.matches)
    update()
    mediaQuery.addEventListener('change', update)
    return () => mediaQuery.removeEventListener('change', update)
  }, [query])

  return matches
}

let releaseTimer: number | null = null

export function HomeAudioProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null)
  const userPausedRef = useRef(false)
  const blockedRef = useRef(false)
  const playRequestRef = useRef(0)
  const generationRef = useRef(0)
  const engagedRef = useRef(false)
  const { pathname } = useLocation()
  const isMobile = useMediaQuery(mobileHomeQuery)
  const engaged = pathname === '/' && !isMobile
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [canSeek, setCanSeek] = useState(false)
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)
  const [playbackError, setPlaybackError] = useState(false)

  engagedRef.current = engaged

  const prepareAnalyser = useCallback(async (audio: HTMLAudioElement, fromGesture: boolean) => {
    if (analyserRef.current || typeof window.AudioContext === 'undefined') return
    try {
      let context = audioContextRef.current
      if (context?.state === 'closed') return
      if (!context) {
        context = new window.AudioContext()
        audioContextRef.current = context
      }
      if (context.state === 'suspended') {
        if (!fromGesture) return
        await context.resume()
        if (readAudioState(context) !== 'running' || analyserRef.current) return
      }
      if (!sourceNodeRef.current) sourceNodeRef.current = context.createMediaElementSource(audio)
      const nextAnalyser = context.createAnalyser()
      nextAnalyser.fftSize = 64
      nextAnalyser.smoothingTimeConstant = 0.78
      sourceNodeRef.current.connect(nextAnalyser)
      nextAnalyser.connect(context.destination)
      analyserRef.current = nextAnalyser
      setAnalyser(nextAnalyser)
    } catch {
      const context = audioContextRef.current
      const source = sourceNodeRef.current
      if (context && source && !analyserRef.current) {
        try {
          source.disconnect()
          source.connect(context.destination)
        } catch {
          // Native playback continues when analysis cannot be attached.
        }
      }
      analyserRef.current = null
      setAnalyser(null)
    }
  }, [])

  const attemptAutoplay = useCallback(() => {
    const audio = audioRef.current
    if (!audio || !engagedRef.current || userPausedRef.current || blockedRef.current) return
    if (audio.ended || !audio.paused) return
    if (audio.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) return
    const generation = generationRef.current
    const requestId = ++playRequestRef.current
    void audio.play().catch((error: unknown) => {
      if (generation !== generationRef.current || requestId !== playRequestRef.current) return
      const name = error instanceof DOMException ? error.name : 'PlaybackError'
      if (name === 'AbortError') return
      if (name === 'NotAllowedError') {
        blockedRef.current = true
        if (import.meta.env.DEV) console.debug('Music autoplay was blocked by browser policy.', error)
        return
      }
      if (import.meta.env.DEV) console.error('Music autoplay failed for a reason other than browser policy.', error)
      setPlaybackError(true)
    })
  }, [])

  useEffect(() => {
    if (releaseTimer !== null) {
      window.clearTimeout(releaseTimer)
      releaseTimer = null
    }
    const generation = ++generationRef.current
    const audio = audioRef.current
    if (!audio) return

    const syncPlaying = () => setIsPlaying(!audio.paused && !audio.ended)
    const syncMetadata = () => {
      const nextDuration = validDuration(audio.duration)
      setDuration(nextDuration)
      setCanSeek(nextDuration > 0 && audio.seekable.length > 0)
    }
    const onPlay = () => {
      setIsPlaying(true)
      setPlaybackError(false)
      void prepareAnalyser(audio, false)
    }
    const onPause = () => setIsPlaying(false)
    const onEnded = () => setIsPlaying(false)
    const onReady = () => {
      syncMetadata()
      attemptAutoplay()
    }
    const onError = () => {
      const mediaError = audio.error
      if (import.meta.env.DEV) {
        console.error('Music file failed to load.', {
          code: mediaError?.code,
          message: mediaError?.message,
          networkState: audio.networkState,
          readyState: audio.readyState,
        })
      }
      setPlaybackError(true)
    }

    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('loadedmetadata', syncMetadata)
    audio.addEventListener('durationchange', syncMetadata)
    audio.addEventListener('progress', syncMetadata)
    audio.addEventListener('canplay', onReady)
    audio.addEventListener('canplaythrough', onReady)
    audio.addEventListener('error', onError)
    syncPlaying()
    syncMetadata()
    attemptAutoplay()

    return () => {
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('loadedmetadata', syncMetadata)
      audio.removeEventListener('durationchange', syncMetadata)
      audio.removeEventListener('progress', syncMetadata)
      audio.removeEventListener('canplay', onReady)
      audio.removeEventListener('canplaythrough', onReady)
      audio.removeEventListener('error', onError)
      releaseTimer = window.setTimeout(() => {
        if (generation !== generationRef.current) return
        releaseTimer = null
        audio.pause()
        sourceNodeRef.current?.disconnect()
        analyserRef.current?.disconnect()
        const context = audioContextRef.current
        if (context && context.state !== 'closed') void context.close()
        sourceNodeRef.current = null
        analyserRef.current = null
        audioContextRef.current = null
      }, 0)
    }
  }, [attemptAutoplay, prepareAnalyser])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (!engaged) {
      if (!audio.paused) audio.pause()
      return
    }
    attemptAutoplay()
  }, [attemptAutoplay, engaged])

  const togglePlayback = useCallback(async () => {
    const audio = audioRef.current
    if (!audio) return
    if (!audio.paused) {
      userPausedRef.current = true
      audio.pause()
      return
    }

    userPausedRef.current = false
    blockedRef.current = false
    const generation = generationRef.current
    const requestId = ++playRequestRef.current
    const playAttempt = audio.play().then(
      () => ({ ok: true as const }),
      (error: unknown) => ({ ok: false as const, error }),
    )
    await prepareAnalyser(audio, true)
    const result = await playAttempt
    if (generation !== generationRef.current || requestId !== playRequestRef.current || result.ok) return
    const name = result.error instanceof DOMException ? result.error.name : 'PlaybackError'
    if (name === 'AbortError') return
    if (name === 'NotAllowedError') {
      blockedRef.current = true
      return
    }
    setPlaybackError(true)
  }, [prepareAnalyser])

  const seekTo = useCallback((time: number) => {
    const audio = audioRef.current
    const availableDuration = validDuration(audio?.duration ?? 0)
    if (!audio || !availableDuration || audio.seekable.length === 0) return
    audio.currentTime = Math.min(availableDuration, Math.max(0, time))
  }, [])

  const value = useMemo(() => ({
    audioRef,
    isPlaying,
    duration,
    canSeek,
    analyser,
    playbackError,
    togglePlayback,
    seekTo,
  }), [analyser, canSeek, duration, isPlaying, playbackError, seekTo, togglePlayback])

  return (
    <HomeAudioContext.Provider value={value}>
      {children}
      <audio ref={audioRef} className="home-audio" src={audioSource} preload="auto" autoPlay={engaged} />
    </HomeAudioContext.Provider>
  )
}

export function useHomeAudio() {
  const value = useContext(HomeAudioContext)
  if (!value) throw new Error('useHomeAudio must be used within HomeAudioProvider')
  return value
}
