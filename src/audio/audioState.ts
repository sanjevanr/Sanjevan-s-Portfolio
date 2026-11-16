export type TrackId = 'home' | 'projects' | 'about' | 'media'
export type DesiredPlayback = 'playing' | 'paused'
export type ActualPlayback = 'playing' | 'paused' | 'loading' | 'blocked' | 'error'

export interface AudioControllerState {
  activeTrackId: TrackId | null
  tracks: Record<TrackId, { desiredPlayback: DesiredPlayback }>
  actualPlayback: ActualPlayback
  operationId: number
}

export type AudioAction =
  | { type: 'routeChanged'; trackId: TrackId | null }
  | { type: 'userPlay' }
  | { type: 'userPause' }
  | { type: 'transportReported'; operationId: number; status: ActualPlayback }

export function trackIdForPath(pathname: string): TrackId | null {
  if (pathname === '/') return 'home'
  if (pathname === '/projects') return 'projects'
  if (pathname === '/about') return 'about'
  if (pathname === '/media') return 'media'
  return null
}

/** Phones never get an audible track. Saved preferences are untouched. */
export function permittedTrackId(routeTrackId: TrackId | null, isPhone: boolean): TrackId | null {
  return isPhone ? null : routeTrackId
}

export function createInitialState(pathname: string, isPhone = false): AudioControllerState {
  const activeTrackId = permittedTrackId(trackIdForPath(pathname), isPhone)
  return {
    activeTrackId,
    tracks: {
      home: { desiredPlayback: 'playing' },
      projects: { desiredPlayback: 'playing' },
      about: { desiredPlayback: 'playing' },
      media: { desiredPlayback: 'playing' },
    },
    actualPlayback: activeTrackId ? 'loading' : 'paused',
    operationId: 0,
  }
}

export function activeWantsPlayback(state: AudioControllerState) {
  return state.activeTrackId !== null && state.tracks[state.activeTrackId].desiredPlayback === 'playing'
}

function withDesired(state: AudioControllerState, trackId: TrackId, desiredPlayback: DesiredPlayback) {
  return { ...state.tracks, [trackId]: { desiredPlayback } }
}

export function audioReducer(state: AudioControllerState, action: AudioAction): AudioControllerState {
  switch (action.type) {
    case 'routeChanged': {
      if (action.trackId === state.activeTrackId) return state
      const next = { ...state, activeTrackId: action.trackId, operationId: state.operationId + 1 }
      return { ...next, actualPlayback: activeWantsPlayback(next) ? 'loading' : 'paused' }
    }
    case 'userPlay': {
      if (!state.activeTrackId) return state
      return {
        ...state,
        tracks: withDesired(state, state.activeTrackId, 'playing'),
        actualPlayback: 'loading',
        operationId: state.operationId + 1,
      }
    }
    case 'userPause': {
      if (!state.activeTrackId) return state
      return {
        ...state,
        tracks: withDesired(state, state.activeTrackId, 'paused'),
        actualPlayback: 'paused',
        operationId: state.operationId + 1,
      }
    }
    case 'transportReported': {
      if (action.operationId !== state.operationId || action.status === state.actualPlayback) return state
      return { ...state, actualPlayback: action.status }
    }
  }
}
