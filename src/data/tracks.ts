import homeAudio from '../assets/Nujabes - Highs 2 Lows (feat.Cise Starr from CYNE) [Official Audio].mp3'
import rosesAudio from '../assets/Roses.mp3'
import bodiesAudio from '../assets/Dominic Fike - Bodies (Official Audio).mp3'
import { trackIdForPath, type TrackId } from '../audio/audioState'

export type SiteTrack = {
  id: string
  title: string
  artist: string
  src: string
  artwork: string
}

export const homeTrack: SiteTrack = {
  id: 'highs-2-lows',
  title: 'Highs 2 Lows',
  artist: 'Nujabes',
  src: homeAudio,
  artwork: '/nujabes-album-cover.jpg',
}

export const projectsTrack: SiteTrack = {
  id: 'roses',
  title: 'Roses',
  artist: 'Kanye West',
  src: rosesAudio,
  artwork: '/late-registration-cover.jpg',
}

export const aboutTrack: SiteTrack = {
  id: 'bodies',
  title: 'Bodies',
  artist: 'Dominic Fike',
  src: bodiesAudio,
  artwork: '/bodies-cover.jpeg',
}

export const tracksById: Record<TrackId, SiteTrack> = {
  home: homeTrack,
  projects: projectsTrack,
  about: aboutTrack,
}

export { trackIdForPath }

export function trackForPath(pathname: string): SiteTrack | null {
  const trackId = trackIdForPath(pathname)
  return trackId ? tracksById[trackId] : null
}
