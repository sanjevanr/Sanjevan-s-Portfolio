import { describe, expect, it } from 'vitest'
import providerSource from '../components/HomeAudio.tsx?raw'
import stateSource from './audioState.ts?raw'
import transportSource from './audioTransport.ts?raw'
import { activeWantsPlayback, audioReducer, createInitialState, permittedTrackId, trackIdForPath, type AudioAction, type AudioControllerState, type TrackId } from './audioState'

function run(state: AudioControllerState, ...actions: AudioAction[]) {
  return actions.reduce(audioReducer, state)
}

const goHome: AudioAction = { type: 'routeChanged', trackId: 'home' }
const goProjects: AudioAction = { type: 'routeChanged', trackId: 'projects' }
const goAbout: AudioAction = { type: 'routeChanged', trackId: 'about' }
const play: AudioAction = { type: 'userPlay' }
const pause: AudioAction = { type: 'userPause' }

describe('audioReducer', () => {
  it('selects the Media track on desktop and suppresses it on phones', () => {
    expect(trackIdForPath('/media')).toBe('media')
    expect(createInitialState('/media').activeTrackId).toBe('media')
    expect(createInitialState('/media', true).activeTrackId).toBeNull()
  })

  it('A: pausing projects leaves the home preference playing', () => {
    const state = run(createInitialState('/projects'), pause)
    expect(state.tracks.projects.desiredPlayback).toBe('paused')
    expect(state.tracks.home.desiredPlayback).toBe('playing')
  })

  it('keeps the About track preference independent from Home and Projects', () => {
    let state = run(createInitialState('/about'), pause, goHome)
    expect(state.tracks.about.desiredPlayback).toBe('paused')
    expect(state.tracks.home.desiredPlayback).toBe('playing')
    state = run(state, pause, goProjects, pause, goAbout)
    expect(state.activeTrackId).toBe('about')
    expect(state.tracks.about.desiredPlayback).toBe('paused')
    expect(state.tracks.projects.desiredPlayback).toBe('paused')
    state = run(state, play)
    expect(state.tracks.about.desiredPlayback).toBe('playing')
    expect(state.tracks.home.desiredPlayback).toBe('paused')
    state = run(state, pause, goProjects)
    expect(state.tracks.about.desiredPlayback).toBe('paused')
    expect(state.tracks.projects.desiredPlayback).toBe('paused')
  })

  it('B: both tracks stay paused across navigation', () => {
    const state = run(createInitialState('/'), pause, goProjects, pause, goHome)
    expect(state.tracks.home.desiredPlayback).toBe('paused')
    expect(state.tracks.projects.desiredPlayback).toBe('paused')
    expect(state.actualPlayback).toBe('paused')
    expect(activeWantsPlayback(state)).toBe(false)
  })

  it('C: the reported sequence keeps Nujabes paused and Roses playing', () => {
    let state = createInitialState('/projects')
    state = run(state, play, pause, goHome, play, pause, goProjects, play)
    state = audioReducer(state, { type: 'transportReported', operationId: state.operationId, status: 'playing' })
    state = audioReducer(state, goHome)
    expect(state.activeTrackId).toBe('home')
    expect(state.tracks.home.desiredPlayback).toBe('paused')
    expect(state.actualPlayback).toBe('paused')
    expect(state.tracks.projects.desiredPlayback).toBe('playing')
    state = audioReducer(state, play)
    expect(state.tracks.home.desiredPlayback).toBe('playing')
    expect(state.actualPlayback).toBe('loading')
  })

  it('rejects transport reports from older operations', () => {
    const start = createInitialState('/')
    const moved = run(start, goProjects)
    const stale = audioReducer(moved, { type: 'transportReported', operationId: start.operationId, status: 'playing' })
    expect(stale.actualPlayback).toBe('loading')
  })

  it('native pause events do not change saved preferences', () => {
    const state = run(createInitialState('/'), { type: 'transportReported', operationId: 0, status: 'paused' })
    expect(state.tracks.home.desiredPlayback).toBe('playing')
  })

  it('phones suppress both tracks without touching preferences', () => {
    expect(permittedTrackId('home', true)).toBeNull()
    expect(permittedTrackId('projects', true)).toBeNull()
    expect(permittedTrackId('about', true)).toBeNull()
    expect(permittedTrackId('media', true)).toBeNull()
    expect(permittedTrackId('home', false)).toBe('home')
    expect(permittedTrackId('projects', false)).toBe('projects')
    expect(permittedTrackId('media', false)).toBe('media')

    for (const path of ['/', '/projects', '/about', '/media']) {
      const state = createInitialState(path, true)
      expect(state.activeTrackId).toBeNull()
      expect(state.actualPlayback).toBe('paused')
      expect(activeWantsPlayback(state)).toBe(false)
      expect(state.tracks.home.desiredPlayback).toBe('playing')
      expect(state.tracks.projects.desiredPlayback).toBe('playing')
      expect(state.tracks.about.desiredPlayback).toBe('playing')
      expect(state.tracks.media.desiredPlayback).toBe('playing')
    }
  })

  it('route changes on a phone never activate a track', () => {
    const phoneRoute = (trackId: TrackId): AudioAction => ({ type: 'routeChanged', trackId: permittedTrackId(trackId, true) })
    const state = run(createInitialState('/', true), phoneRoute('projects'), phoneRoute('home'), phoneRoute('projects'))
    expect(state.activeTrackId).toBeNull()
    expect(activeWantsPlayback(state)).toBe(false)
    expect(run(state, play)).toBe(state)
  })

  it('a phone round trip restores each track from its own preference', () => {
    const toPhone: AudioAction = { type: 'routeChanged', trackId: null }
    let state = run(createInitialState('/'), pause, goProjects)
    expect(state.actualPlayback).toBe('loading')
    state = run(state, toPhone)
    expect(state.actualPlayback).toBe('paused')
    expect(state.tracks.projects.desiredPlayback).toBe('playing')
    expect(state.tracks.home.desiredPlayback).toBe('paused')

    state = run(state, goProjects)
    expect(state.actualPlayback).toBe('loading')
    state = run(state, toPhone, goHome)
    expect(state.actualPlayback).toBe('paused')
    expect(activeWantsPlayback(state)).toBe(false)
  })

  it('E: a fresh document load always starts with both tracks playing', () => {
    for (const path of ['/', '/projects', '/about', '/media']) {
      const state = createInitialState(path)
      expect(state.tracks.home.desiredPlayback).toBe('playing')
      expect(state.tracks.projects.desiredPlayback).toBe('playing')
    }
    expect([stateSource, transportSource, providerSource].join('\n')).not.toMatch(/localStorage|sessionStorage/)
  })
})
