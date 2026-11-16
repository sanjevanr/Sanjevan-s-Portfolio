import { describe, expect, it } from 'vitest'
import { projectMediaCaption, projects, titleFromFilename } from './projects'

const publicFiles = new Set(
  Object.keys(import.meta.glob('/public/**/*', { query: '?url' })).map((path) => path.replace(/^\/public/, '')),
)
const project = (id: string) => projects.find((item) => item.id === id)!

describe('project data and media', () => {
  it('keeps the requested project order and selects UniLinq first', () => {
    expect(projects.map(({ title }) => title)).toEqual(['UniLinq', 'Roam.io', 'MUAS Website', 'Spotto', 'FIT3155 Algorithms'])
    expect(projects[0].id).toBe('unilinq')
  })

  it('associates local media with existing project assets', () => {
    for (const item of projects.flatMap(({ media }) => media)) {
      if (item.type === 'youtube') continue
      expect(publicFiles.has(item.src)).toBe(true)
    }
  })

  it('keeps Roam.io Team Photo first and responsive image variants configured', () => {
    const media = project('roam-io').media
    expect(media[0]).toMatchObject({ type: 'image', title: 'Team Photo - r/Kuang' })
    expect(media[0]).toMatchObject({ width: 1206, height: 1072 })
    expect(media[0]).toMatchObject({ srcSet: expect.stringContaining('640w') })
  })

  it('associates UniLinq pitch media and preserves the website and Instagram links', () => {
    expect(project('unilinq').media.map(({ type }) => type)).toEqual(['image', 'video'])
    expect(project('unilinq').links).toEqual(expect.arrayContaining([
      expect.objectContaining({ url: 'https://unilinq.org' }),
      expect.objectContaining({ label: 'VIEW ON INSTAGRAM', shortLabel: 'INSTAGRAM', url: 'https://www.instagram.com/uni.linq/' }),
    ]))
    const text = [project('unilinq').summary, ...project('unilinq').highlights, ...project('unilinq').achievements!].join(' ').toLowerCase()
    for (const phrase of ['costs', 'feasibility', 'scalability', 'people’s choice', 'antler', 'messaging', 'database']) expect(text).toContain(phrase)
  })

  it('uses the live MUAS website preview and both website links', () => {
    const muas = project('muas-website')
    expect(muas.media).toEqual([expect.objectContaining({ type: 'website', url: 'https://monashuas.org/', src: '/muas/muas-website-preview.webp', srcSet: expect.stringContaining('muas-website-preview-960.webp') })])
    expect(projectMediaCaption(muas.media[0])).toBe('MUAS Website Preview')
    expect(muas.githubUrl).toBe('https://github.com/MonashUAS/muas-website')
    expect(muas.links).toContainEqual(expect.objectContaining({ label: 'VISIT WEBSITE', shortLabel: 'WEBSITE', url: 'https://monashuas.org/' }))
  })

  it('associates Spotto screenshots and its YouTube video, and keeps FIT3155 media empty', () => {
    expect(project('spotto').media.map((item) => item.type)).toEqual(['youtube', 'image', 'image', 'image', 'image'])
    expect(project('spotto').media.map(projectMediaCaption)).toEqual(['Spotto Pitch Video', 'Login Screen', 'Profile View', 'Map View', 'Reporting Tool'])
    expect(project('fit3155-algorithms').media).toEqual([])
    expect(project('fit3155-algorithms').githubUrl).toBe('https://github.com/sanjevanr/FIT3155-Algorithms')
    const text = [project('fit3155-algorithms').summary, ...project('fit3155-algorithms').highlights].join(' ').toLowerCase()
    expect(text).toContain('without generative ai')
    expect(text).not.toContain('test suite')
    expect(text).not.toContain('testing infrastructure')
  })

  it('uses JSON captions for newly added UniLinq media', () => {
    expect(project('unilinq').media.map(projectMediaCaption)).toEqual(['UniLinq Proof of Concept Pitch', 'UniLinq Demonstration'])
  })

  it('derives readable titles from filenames', () => {
    expect(titleFromFilename('/roam.io/social-feed_roam.io.png', 'roam.io')).toBe('App Social Feed')
    expect(titleFromFilename('/roam.io/roam.io_team_photo.webp', 'roam.io')).toBe('Team Photo - r/Kuang')
    expect(titleFromFilename('/roam.io/milestones_roam.io.webp', 'roam.io')).toBe('Milestone Tracking')
    expect(titleFromFilename('/roam.io/hazard_video.mp4', 'roam.io')).toBe('Hazard Reporting Demonstration Video')
  })
})
