import mediaCaptionOverrides from './media-captions.json'

export interface PortfolioProject {
  id: string
  title: string
  /** Explorer label on phones. Defaults to the title. */
  shortTitle?: string
  technologies: string[]
  summary: string
  highlights: string[]
  skillsLearned: string[]
  achievements?: string[]
  githubUrl?: string
  links?: { label: string; shortLabel: string; url: string }[]
  media: ProjectMedia[]
}

export type ProjectMedia =
  | { type: 'image'; src: string; alt?: string; title?: string; description?: string; width?: number; height?: number; srcSet?: string; sizes?: string }
  | { type: 'video'; src: string; fallbackSrc?: string; alt?: string; title?: string; description?: string }
  | { type: 'website'; src: string; url: string; title: string; alt: string; description?: string; width: number; height: number; srcSet?: string; sizes?: string }
  | { type: 'youtube'; videoId: string; title: string; description?: string }

export const projectMediaPlaceholder = 'No media available'

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Readable title from a file path, e.g. `/roam.io/social-feed_roam.io.png` with `strip: 'roam.io'` gives "Social Feed". */
export function titleFromFilename(src: string, strip?: string) {
  const filename = src.split('/').pop() ?? ''
  let name = filename.replace(/\.[^.]+$/, '')
  const customCaption = mediaCaptionOverrides[filename.toLowerCase() as keyof typeof mediaCaptionOverrides]
  if (customCaption) return customCaption
  if (strip) name = name.replace(new RegExp(escapeRegExp(strip), 'gi'), ' ')
  return name.replace(/[-_](?:[a-f0-9]{8,}|[a-f0-9]{4}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12})$/i, '').replace(/[-_.\s]+/g, ' ').trim().replace(/\b\w/g, (letter) => letter.toUpperCase()) || 'Project media'
}

export function projectMediaCaption(item: ProjectMedia) {
  if (item.type === 'youtube') return mediaCaptionOverrides[`youtube:${item.videoId}` as keyof typeof mediaCaptionOverrides] ?? item.title
  if (item.type === 'website') return mediaCaptionOverrides[`website:${item.url}` as keyof typeof mediaCaptionOverrides] ?? item.title
  return item.title ?? titleFromFilename(item.src)
}

const videoExtensions = /\.(?:mp4|webm)$/i
const responsiveImages: Record<string, { width: number; height: number; srcSet: string; sizes: string }> = {
  '/roam.io/roam.io_team_photo.webp': { width: 1206, height: 1072, srcSet: '/roam.io/roam.io_team_photo-640.webp 640w, /roam.io/roam.io_team_photo.webp 1206w', sizes: '(max-width: 600px) 75vw, (max-width: 1200px) 55vw, 900px' },
  '/roam.io/social-feed_roam.io.webp': { width: 1206, height: 2622, srcSet: '/roam.io/social-feed_roam.io-640.webp 640w, /roam.io/social-feed_roam.io.webp 1206w', sizes: '(max-width: 600px) 75vw, (max-width: 1200px) 55vw, 900px' },
  '/roam.io/milestones_roam.io.webp': { width: 1206, height: 2622, srcSet: '/roam.io/milestones_roam.io-640.webp 640w, /roam.io/milestones_roam.io.webp 1206w', sizes: '(max-width: 600px) 75vw, (max-width: 1200px) 55vw, 900px' },
  '/unilinq/unilinq-poc-pitch.webp': { width: 1206, height: 1747, srcSet: '/unilinq/unilinq-poc-pitch-640.webp 640w, /unilinq/unilinq-poc-pitch.webp 1206w', sizes: '(max-width: 600px) 75vw, (max-width: 1200px) 55vw, 900px' },
  '/spotto/login-page.webp': { width: 1206, height: 2320, srcSet: '/spotto/login-page-640.webp 640w, /spotto/login-page.webp 1206w', sizes: '(max-width: 600px) 75vw, (max-width: 1200px) 55vw, 900px' },
  '/spotto/profile-view.webp': { width: 1206, height: 2622, srcSet: '/spotto/profile-view-640.webp 640w, /spotto/profile-view.webp 1206w', sizes: '(max-width: 600px) 75vw, (max-width: 1200px) 55vw, 900px' },
  '/spotto/spotto-map-view.webp': { width: 1206, height: 2343, srcSet: '/spotto/spotto-map-view-640.webp 640w, /spotto/spotto-map-view.webp 1206w', sizes: '(max-width: 600px) 75vw, (max-width: 1200px) 55vw, 900px' },
  '/spotto/reporting-tool.webp': { width: 1206, height: 2622, srcSet: '/spotto/reporting-tool-640.webp 640w, /spotto/reporting-tool.webp 1206w', sizes: '(max-width: 600px) 75vw, (max-width: 1200px) 55vw, 900px' },
}

function publicMedia(projectTitle: string, dir: string, files: string[]): ProjectMedia[] {
  return files.map((file) => {
    const isVideo = videoExtensions.test(file)
    const title = titleFromFilename(file, dir)
    const src = `/${dir}/${file}`
    const optimized = responsiveImages[src]
    if (isVideo) {
      return {
        type: 'video', src, fallbackSrc: `/${dir}/${file}`, title,
        alt: `${projectTitle} ${title.toLowerCase()}`,
      }
    }
    return {
      type: 'image', src, title,
      alt: `${projectTitle} ${title.toLowerCase()}`,
      ...(optimized ?? {}),
    }
  })
}

export const projects: PortfolioProject[] = [
  {
    id: 'unilinq', title: 'UniLinq', shortTitle: 'UniLinq',
    technologies: ['Next.js', 'React', 'TypeScript', 'Supabase', 'PostgreSQL / pgvector', 'Gemini API'],
    summary: 'UniLinq is a platform concept for connecting university students with small and medium-sized enterprises through structured real-world projects. Building it as a team gave us experience taking an idea from problem research and commercial evaluation through to a working MVP and an external pitch.',
    highlights: [
      'Building a startup: We identified and investigated a real problem affecting students and SMEs, explored how to validate the need, researched customer needs, the market and competing solutions, and refined our positioning and value proposition. We also considered the costs of building, launching and maintaining the platform, its commercial feasibility, scalability and possible business models.',
      'From concept to MVP: We translated early concepts and wireframes into a working product and iterated on the proposal using research and feedback, without assuming validation outcomes that were not documented.',
      'Development: Next.js, React and TypeScript power the application, with Supabase and PostgreSQL for data. PostgreSQL pgvector stores skill and project embeddings for semantic similarity search, while Gemini supports AI-assisted project scoping.',
      'The platform includes student onboarding and profiles, matching students to relevant SME projects, and messaging and collaboration functionality. AI-assisted scoping helps businesses shape project briefs.',
      'My contributions were collaborative: application development, messaging, database improvements, implementation and refinement with the team. The experience helped me understand how research and feasibility assessment lead into building and pitching a startup idea.',
    ],
    skillsLearned: ['Full-stack development with React, Next.js and TypeScript', 'Supabase, PostgreSQL, database design and access control', 'pgvector similarity search and Gemini integration', 'Startup research, value propositions and pitching', 'Collaborative MVP development and iteration'],
    achievements: ['Our team was selected as one of the top teams in the faculty to pitch UniLinq before a panel that included representatives from Antler and Monash University researchers. We also won the People’s Choice award.'],
    links: [
      { label: 'VISIT UNILINQ', shortLabel: 'UNILINQ', url: 'https://unilinq.org' },
      { label: 'VIEW ON INSTAGRAM', shortLabel: 'INSTAGRAM', url: 'https://www.instagram.com/uni.linq/' },
    ],
    media: publicMedia('UniLinq', 'unilinq', ['unilinq-poc-pitch.webp', 'Unilinq Demo.mp4']),
  },
  {
    id: 'roam-io', title: 'Roam.io',
    technologies: ['Flutter', 'Dart', 'Firebase', 'PostgreSQL / PostGIS', 'Google Maps APIs'],
    summary: 'A team-built, cross-platform exploration app that turns real-world movement into map discovery, journeys and progression.',
    highlights: ['Fog-of-war map exploration, nearby places and visit logs.', 'GPS journey tracking, including background tracking on iOS and Android.', 'XP, milestones, quests, achievements and a social activity feed.', 'The repository combines Firebase services with a PostgreSQL/PostGIS spatial API.', 'The repository documents CI checks for formatting, analysis, tests, coverage and Android builds.'],
    skillsLearned: ['Flutter and Dart development', 'Firebase integration', 'Location-aware application development', 'Geospatial data concepts', 'Cross-platform mobile development'],
    githubUrl: 'https://github.com/Monash-FIT3170/2026W2-Roam.io',
    links: [{ label: 'VIEW LANDING PAGE', shortLabel: 'WEBSITE', url: 'https://roamio-landing-page-gamma.vercel.app/' }],
    media: publicMedia('Roam.io', 'roam.io', ['roam.io_team_photo.webp', 'social-feed_roam.io.webp', 'milestones_roam.io.webp', 'hazard_video.mp4']),
  },
  {
    id: 'muas-website', title: 'MUAS Website', shortTitle: 'MUAS',
    technologies: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Three.js', 'React Three Fiber', 'Resend'],
    summary: 'A public-facing website for Monash Uncrewed Aerial Systems, presenting its engineering work, competitions, teams and activities.',
    highlights: ['Uses the Next.js App Router with React and TypeScript.', 'Includes reusable page sections and a responsive site structure.', 'Uses Three.js with React Three Fiber and Drei for interactive 3D content.', 'The server-side contact route validates submissions and sends email through Resend.', 'The site includes recruitment, competitions, team, sponsor and newsletter areas.'],
    skillsLearned: ['Next.js and React', 'TypeScript', 'Responsive frontend development', 'Tailwind CSS', 'Interactive web design'],
    achievements: ['SUAS 2026 — Monash UAS placed 10th overall out of 60 teams.', 'Website evaluation — 92/100 points.'],
    githubUrl: 'https://github.com/MonashUAS/muas-website',
    links: [{ label: 'VISIT WEBSITE', shortLabel: 'WEBSITE', url: 'https://monashuas.org/' }],
    media: [{ type: 'website', src: '/muas/muas-website-preview.webp', url: 'https://monashuas.org/', title: 'MUAS Website Preview', alt: 'Screenshot of the Monash Uncrewed Aerial Systems website homepage', description: 'Open the live MUAS website.', width: 1920, height: 861, srcSet: '/muas/muas-website-preview-960.webp 960w, /muas/muas-website-preview.webp 1920w', sizes: '(max-width: 600px) 75vw, (max-width: 1200px) 65vw, 900px' }],
  },
  {
    id: 'spotto', title: 'Spotto', technologies: ['Swift', 'Xcode', 'iOS', 'MapKit', 'Core Location'],
    summary: 'An iOS prototype developed during UniHack, translating interface designs into a functional app under hackathon time constraints.',
    highlights: ['Built with Swift and Xcode, with map and location handling through MapKit and Core Location.', 'Displays map annotations and requests the user’s current location.', 'Includes a station picker and a modal reporting flow for spotted Myki officers.', 'Developed collaboratively while working through debugging and runtime constraints.'],
    skillsLearned: ['Swift and iOS development', 'Xcode', 'Translating Figma designs into interfaces', 'Debugging and collaborative development', 'Rapid prototyping'],
    githubUrl: 'https://github.com/Amar723/UniHack-Team-YVL',
    links: [{ label: 'VIEW ON DEVPOST', shortLabel: 'DEVPOST', url: 'https://devpost.com/software/spotto' }],
    media: [
      { type: 'youtube', videoId: 'WQhQ-47rHPU', title: 'Spotto Demo' },
      ...publicMedia('Spotto', 'spotto', ['login-page.webp', 'profile-view.webp', 'spotto-map-view.webp', 'reporting-tool.webp']),
    ],
  },
  {
    id: 'fit3155-algorithms', title: 'FIT3155 Algorithms', shortTitle: 'FIT3155',
    technologies: ['Python', 'Algorithm Design', 'Data Structures'],
    summary: 'FIT3155 Advanced Algorithms deepened my understanding of algorithm design and data structures. I translated selected ideas studied in the unit into independent Python implementations, without generative AI assistance, and learned to reason about complexity, performance and trade-offs.',
    highlights: ['Independently implemented Boyer–Moore string matching and explored Burrows–Wheeler Transform-based approximate matching.', 'Implemented Ukkonen’s suffix tree construction and rolling-hash-based pattern matching.', 'Worked from algorithmic ideas to functioning implementations, strengthening problem-solving and algorithm design skills.', 'Developed confidence in understanding advanced techniques well enough to implement them independently.'],
    skillsLearned: ['Advanced algorithms and data structures', 'Algorithm design and complexity analysis', 'Performance trade-offs and problem-solving', 'Independent Python implementation', 'String processing and pattern matching'],
    githubUrl: 'https://github.com/sanjevanr/FIT3155-Algorithms',
    media: [],
  },
]
