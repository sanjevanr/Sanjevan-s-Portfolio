import { describe, expect, it } from 'vitest'
import { audioReducer, activeWantsPlayback, createInitialState, type AudioAction, type AudioControllerState, type TrackId } from './audioState'
import { AudioTransport, type MediaLike } from './audioTransport'

const sources = { home: '/nujabes.mp3', projects: '/roses.mp3', about: '/bodies.mp3', media: '/ouroborus.mp3' } as const

type Deferred = { src: string; resolve: () => void; reject: (error: unknown) => void }

class FakeMedia implements MediaLike {
  src = ''
  currentSrc = ''
  paused = true
  ended = false
  readyState = 0
  error = null
  plays: Deferred[] = []
  playCalls: string[] = []
  autoResolve = true
  rejectWith: unknown = null
  private listeners = new Map<string, Set<() => void>>()

  play() {
    this.playCalls.push(this.src)
    const src = this.src
    return new Promise<void>((resolve, rawReject) => {
      let done = false
      const reject = (error: unknown) => {
        done = true
        rawReject(error)
      }
      const settle = () => {
        if (done) return
        done = true
        if (this.src !== src) {
          rawReject(Object.assign(new Error('aborted'), { name: 'AbortError' }))
          return
        }
        this.paused = false
        this.emit('playing')
        resolve()
      }
      const fail = (error: unknown) => reject(error)
      if (this.rejectWith) fail(this.rejectWith)
      else if (this.autoResolve) queueMicrotask(settle)
      else this.plays.push({ src, resolve: settle, reject: fail })
    })
  }

  pause() {
    if (this.paused) return
    this.paused = true
    this.emit('pause')
  }

  load() {
    this.currentSrc = this.src
    this.readyState = 0
    if (!this.paused) this.pause()
    for (const pending of this.plays.splice(0)) pending.reject(Object.assign(new Error('aborted'), { name: 'AbortError' }))
  }

  addEventListener(type: string, listener: () => void) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set())
    this.listeners.get(type)!.add(listener)
  }

  removeEventListener(type: string, listener: () => void) {
    this.listeners.get(type)?.delete(listener)
  }

  emit(type: string) {
    this.listeners.get(type)?.forEach((listener) => listener())
  }
}

function harness(pathname: string) {
  const media = new FakeMedia()
  let state = createInitialState(pathname)
  const apply = (action: AudioAction) => {
    state = audioReducer(state, action)
    return state
  }
  const transport = new AudioTransport(media, (report) => {
    apply({ type: 'transportReported', operationId: report.operationId, status: report.status })
  })
  const activate = (next: AudioControllerState) => {
    transport.activate(next.activeTrackId ? sources[next.activeTrackId] : null, activeWantsPlayback(next), next.operationId)
  }
  const navigate = (trackId: TrackId | null) => activate(apply({ type: 'routeChanged', trackId }))
  const toggle = () => {
    if (state.actualPlayback === 'playing') transport.pause(apply({ type: 'userPause' }).operationId)
    else transport.playFromGesture(apply({ type: 'userPlay' }).operationId)
  }
  activate(state)
  return { media, navigate, toggle, get state() { return state } }
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('AudioTransport with the reducer', () => {
  it('activates Ouroborus on Media and replaces it when navigating away', async () => {
    const h = harness('/media')
    await flush()
    expect(h.state.activeTrackId).toBe('media')
    expect(h.media.src).toBe(sources.media)
    expect(h.media.paused).toBe(false)

    h.navigate('projects')
    await flush()
    expect(h.media.src).toBe(sources.projects)
  })

  it('plays the About track through the shared transport and restores its own preference', async () => {
    const h = harness('/about')
    await flush()
    expect(h.media.src).toBe(sources.about)
    expect(h.media.paused).toBe(false)

    h.toggle()
    h.navigate('home')
    await flush()
    expect(h.media.src).toBe(sources.home)
    expect(h.media.paused).toBe(false)

    h.navigate('about')
    await flush()
    expect(h.media.src).toBe(sources.about)
    expect(h.media.paused).toBe(true)
    expect(h.state.tracks.about.desiredPlayback).toBe('paused')
  })

  it('B: paused tracks are activated without calling play', async () => {
    const h = harness('/')
    await flush()
    h.toggle()
    h.navigate('projects')
    await flush()
    h.toggle()
    const callsBefore = h.media.playCalls.length
    h.navigate('home')
    await flush()
    expect(h.media.playCalls.length).toBe(callsBefore)
    expect(h.media.paused).toBe(true)
    expect(h.state.actualPlayback).toBe('paused')
  })

  it('C: the reported sequence needs one click to restart Nujabes', async () => {
    const h = harness('/projects')
    await flush()
    expect(h.state.actualPlayback).toBe('playing')
    h.toggle()
    h.navigate('home')
    await flush()
    expect(h.state.actualPlayback).toBe('playing')
    expect(h.media.src).toBe(sources.home)
    h.toggle()
    h.navigate('projects')
    await flush()
    expect(h.state.actualPlayback).toBe('paused')
    h.toggle()
    await flush()
    expect(h.state.actualPlayback).toBe('playing')

    const nujabesCalls = h.media.playCalls.filter((src) => src === sources.home).length
    h.navigate('home')
    await flush()
    expect(h.media.playCalls.filter((src) => src === sources.home).length).toBe(nujabesCalls)
    expect(h.media.paused).toBe(true)
    expect(h.media.src).toBe(sources.home)
    expect(h.state.actualPlayback).toBe('paused')
    expect(h.state.tracks.projects.desiredPlayback).toBe('playing')

    h.toggle()
    await flush()
    expect(h.state.actualPlayback).toBe('playing')
    expect(h.media.paused).toBe(false)
    expect(h.media.src).toBe(sources.home)

    h.toggle()
    h.navigate('projects')
    await flush()
    expect(h.media.src).toBe(sources.projects)
    expect(h.media.playCalls.at(-1)).toBe(sources.projects)
    expect(h.state.actualPlayback).toBe('playing')
  })

  it('D: late play results from earlier routes cannot change the current state', async () => {
    const h = harness('/')
    h.media.autoResolve = false
    const started: Deferred[] = []
    const play = h.media.play.bind(h.media)
    h.media.play = () => {
      const result = play()
      started.push(h.media.plays.at(-1)!)
      return result
    }
    h.navigate('projects')
    h.navigate('home')
    h.navigate('projects')
    expect(started.length).toBe(3)
    for (const item of started.slice(0, -1).reverse()) item.resolve()
    await flush()
    expect(h.state.activeTrackId).toBe('projects')
    expect(h.state.actualPlayback).toBe('loading')
    expect(h.media.paused).toBe(true)
    started.at(-1)!.resolve()
    await flush()
    expect(h.state.actualPlayback).toBe('playing')
    expect(h.media.src).toBe(sources.projects)
  })

  it('switching to a phone pauses playback and a late play result cannot restart it', async () => {
    const h = harness('/')
    await flush()
    h.navigate(null)
    h.media.autoResolve = false
    h.navigate('home')
    const pending = h.media.plays.at(-1)!
    h.navigate(null)
    pending.resolve()
    await flush()
    expect(h.media.paused).toBe(true)
    expect(h.state.actualPlayback).toBe('paused')
    expect(h.state.tracks.home.desiredPlayback).toBe('playing')
  })

  it('a phone stops a playing track and resizing back resumes it', async () => {
    const h = harness('/projects')
    await flush()
    expect(h.media.paused).toBe(false)
    h.navigate(null)
    await flush()
    expect(h.media.paused).toBe(true)
    h.navigate('projects')
    await flush()
    expect(h.media.paused).toBe(false)
    expect(h.state.actualPlayback).toBe('playing')
  })

  it('reports blocked autoplay without changing the saved preference', async () => {
    const media = new FakeMedia()
    media.rejectWith = Object.assign(new Error('blocked'), { name: 'NotAllowedError' })
    let state = createInitialState('/')
    const transport = new AudioTransport(media, (report) => {
      state = audioReducer(state, { type: 'transportReported', operationId: report.operationId, status: report.status })
    })
    transport.activate(sources.home, true, state.operationId)
    await flush()
    expect(state.actualPlayback).toBe('blocked')
    expect(state.tracks.home.desiredPlayback).toBe('playing')

    media.rejectWith = null
    state = audioReducer(state, { type: 'userPlay' })
    transport.playFromGesture(state.operationId)
    await flush()
    expect(state.actualPlayback).toBe('playing')
  })

  it('ignores a stale autoplay rejection after the gesture retry succeeds', async () => {
    const media = new FakeMedia()
    media.autoResolve = false
    let state = createInitialState('/')
    const transport = new AudioTransport(media, (report) => {
      state = audioReducer(state, { type: 'transportReported', operationId: report.operationId, status: report.status })
    })
    transport.activate(sources.home, true, state.operationId)
    const initialAttempt = media.plays[0]
    transport.playFromGesture(state.operationId)
    const gestureAttempt = media.plays[1]
    gestureAttempt.resolve()
    await flush()
    initialAttempt.reject(Object.assign(new Error('blocked'), { name: 'NotAllowedError' }))
    await flush()
    expect(state.actualPlayback).toBe('playing')
  })
})
