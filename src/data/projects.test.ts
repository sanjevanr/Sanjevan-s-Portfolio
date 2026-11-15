import { describe, expect, it } from 'vitest'
import { projects, titleFromFilename } from './projects'

const publicFiles = new Set(
  Object.keys(import.meta.glob('/public/**/*', { query: '?url' })).map((path) => path.replace(/^\/public/, '')),
)
const project = (id: string) => projects.find((item) => item.id === id)!

describe('project media', () => {
  it('only references Roam.io files that exist in public/roam.io', () => {
    const media = project('roam-io').media
    expect(media.length).toBeGreaterThan(0)
    for (const item of media) {
      if (item.type === 'youtube') throw new Error('Roam.io media should come from public/roam.io')
      expect(item.src.startsWith('/roam.io/')).toBe(true)
      expect(publicFiles.has(item.src)).toBe(true)
    }
  })

  it('gives Spotto only its YouTube video', () => {
    expect(project('spotto').media).toEqual([{ type: 'youtube', videoId: 'WQhQ-47rHPU', title: 'Spotto Demo' }])
  })

  it('derives readable titles from filenames', () => {
    expect(titleFromFilename('/roam.io/social-feed_roam.io.png', 'roam.io')).toBe('Social Feed')
    expect(titleFromFilename('/roam.io/roam.io_team_photo.png', 'roam.io')).toBe('Team Photo')
    expect(titleFromFilename('/roam.io/milestones_roam.io.png', 'roam.io')).toBe('Milestones')
    expect(titleFromFilename('/roam.io/hazard_video.mp4', 'roam.io')).toBe('Hazard Video')
  })
})
