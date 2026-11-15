import { describe, expect, it } from 'vitest'
import providerSource from '../components/HomeAudio.tsx?raw'
import stateSource from './audioState.ts?raw'
import transportSource from './audioTransport.ts?raw'
import { activeWantsPlayback, audioReducer, createInitialState, type AudioAction, type AudioControllerState } from './audioState'

function run(state: AudioControllerState, ...actions: AudioAction[]) {
  return actions.reduce(audioReducer, state)
}

const goHome: AudioAction = { type: 'routeChanged', trackId: 'home' }
const goProjects: AudioAction = { type: 'routeChanged', trackId: 'projects' }
const play: AudioAction = { type: 'userPlay' }
const pause: AudioAction = { type: 'userPause' }

describe('audioReducer', () => {
  it('A: pausing projects leaves the home preference playing', () => {
    const state = run(createInitialState('/projects'), pause)
    expect(state.tracks.projects.desiredPlayback).toBe('paused')
    expect(state.tracks.home.desiredPlayback).toBe('playing')
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

  it('E: a fresh document load always starts with both tracks playing', () => {
    for (const path of ['/', '/projects', '/about']) {
      const state = createInitialState(path)
      expect(state.tracks.home.desiredPlayback).toBe('playing')
      expect(state.tracks.projects.desiredPlayback).toBe('playing')
    }
    expect([stateSource, transportSource, providerSource].join('\n')).not.toMatch(/localStorage|sessionStorage/)
  })
})
