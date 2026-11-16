import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react'
import { useLocation } from 'react-router-dom'
import { activeWantsPlayback, audioReducer, createInitialState, permittedTrackId, type ActualPlayback, type AudioAction, type AudioControllerState } from '../audio/audioState'
import { AudioTransport, type TransportReport } from '../audio/audioTransport'
import { homeTrack, trackIdForPath, tracksById, type SiteTrack } from '../data/tracks'

/* Must match the CSS phone query:
   @media (max-width: 760px) and (max-height: 999px), (max-width: 599px) */
export const mobileHomeQuery = '(max-width: 599px), (max-width: 760px) and (max-height: 999px)'
export const tabletHomeQuery = '(min-width: 761px) and (max-width: 1199px) and (min-height: 740px), (min-width: 600px) and (max-width: 760px) and (min-height: 1000px), (min-width: 1200px) and (max-width: 1230px) and (min-height: 800px), (min-width: 1231px) and (max-width: 1440px) and (min-height: 901px)'

type HomeAudioContextValue = {
  audioRef: RefObject<HTMLAudioElement | null>
  track: SiteTrack
  actualPlayback: ActualPlayback
  isPlaying: boolean
  isLoading: boolean
  isBlocked: boolean
  isAvailable: boolean
  duration: number
  canSeek: boolean
  analyser: AnalyserNode | null
  playbackError: boolean
  togglePlayback: () => void
  seekTo: (time: number) => void
}

const HomeAudioContext = createContext<HomeAudioContextValue | null>(null)

function validDuration(value: number) {
  return Number.isFinite(value) && value > 0 ? value : 0
}

function readAudioState(context: AudioContext) {
  return context.state
}

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const media = window.matchMedia(query)
    const update = () => setMatches(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [query])
  return matches
}

const devLog = import.meta.env.DEV
  ? (message: string, details?: unknown) => console.debug(message, { route: window.location.pathname, ...(details && typeof details === 'object' && !(details instanceof Error) ? details : { details }) })
  : undefined

let releaseTimer: number | null = null

export function HomeAudioProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null)
  const transportRef = useRef<AudioTransport | null>(null)
  const { pathname } = useLocation()
  const routeTrackId = trackIdForPath(pathname)
  const isPhone = useMediaQuery(mobileHomeQuery)
  const [state, setState] = useState<AudioControllerState>(() => createInitialState(pathname, isPhone))
  const stateRef = useRef(state)
  const [duration, setDuration] = useState(0)
  const [canSeek, setCanSeek] = useState(false)
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)

  const apply = useCallback((action: AudioAction) => {
    const next = audioReducer(stateRef.current, action)
    if (next !== stateRef.current) {
      stateRef.current = next
      setState(next)
    }
    return next
  }, [])

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

  useEffect(() => {
    if (releaseTimer !== null) {
      window.clearTimeout(releaseTimer)
      releaseTimer = null
    }
    const audio = audioRef.current
    if (!audio) return

    const onReport = (report: TransportReport) => {
      apply({ type: 'transportReported', operationId: report.operationId, status: report.status })
    }
    const transport = new AudioTransport(audio, onReport, devLog)
    transportRef.current = transport

    const syncMetadata = () => {
      const nextDuration = validDuration(audio.duration)
      setDuration(nextDuration)
      setCanSeek(nextDuration > 0 && audio.seekable.length > 0)
    }
    const onPlay = () => { void prepareAnalyser(audio, false) }
    audio.addEventListener('play', onPlay)
    audio.addEventListener('loadedmetadata', syncMetadata)
    audio.addEventListener('durationchange', syncMetadata)
    audio.addEventListener('progress', syncMetadata)
    audio.addEventListener('emptied', syncMetadata)
    syncMetadata()

    return () => {
      transport.destroy()
      if (transportRef.current === transport) transportRef.current = null
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('loadedmetadata', syncMetadata)
      audio.removeEventListener('durationchange', syncMetadata)
      audio.removeEventListener('progress', syncMetadata)
      audio.removeEventListener('emptied', syncMetadata)
      releaseTimer = window.setTimeout(() => {
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
  }, [apply, prepareAnalyser])

  useEffect(() => {
    const transport = transportRef.current
    if (!transport) return
    const next = apply({ type: 'routeChanged', trackId: permittedTrackId(routeTrackId, isPhone) })
    const trackId = next.activeTrackId
    transport.activate(trackId ? tracksById[trackId].src : null, activeWantsPlayback(next), next.operationId)
  }, [apply, isPhone, routeTrackId])

  const togglePlayback = useCallback(() => {
    const transport = transportRef.current
    const audio = audioRef.current
    if (!transport || !audio || !stateRef.current.activeTrackId) return
    if (stateRef.current.actualPlayback === 'playing') {
      transport.pause(apply({ type: 'userPause' }).operationId)
      return
    }
    transport.playFromGesture(apply({ type: 'userPlay' }).operationId)
    void prepareAnalyser(audio, true)
  }, [apply, prepareAnalyser])

  const seekTo = useCallback((time: number) => {
    const audio = audioRef.current
    const availableDuration = validDuration(audio?.duration ?? 0)
    if (!audio || !availableDuration || audio.seekable.length === 0) return
    audio.currentTime = Math.min(availableDuration, Math.max(0, time))
  }, [])

  const track = state.activeTrackId ? tracksById[state.activeTrackId] : homeTrack
  const { actualPlayback } = state
  const wantsPlayback = activeWantsPlayback(state)

  const value = useMemo(() => ({
    audioRef,
    track,
    actualPlayback,
    isPlaying: actualPlayback === 'playing',
    isLoading: actualPlayback === 'loading' && wantsPlayback,
    isBlocked: actualPlayback === 'blocked' && wantsPlayback,
    isAvailable: state.activeTrackId !== null,
    duration,
    canSeek: canSeek && state.activeTrackId !== null,
    analyser,
    playbackError: actualPlayback === 'error',
    togglePlayback,
    seekTo,
  }), [actualPlayback, analyser, canSeek, duration, seekTo, state.activeTrackId, togglePlayback, track, wantsPlayback])

  return (
    <HomeAudioContext.Provider value={value}>
      {children}
      <audio ref={audioRef} className="home-audio" preload="auto" />
    </HomeAudioContext.Provider>
  )
}

export function useHomeAudio() {
  const value = useContext(HomeAudioContext)
  if (!value) throw new Error('useHomeAudio must be used within HomeAudioProvider')
  return value
}
