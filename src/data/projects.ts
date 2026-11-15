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
  links?: {
    label: string
    /** Button label on phones. */
    shortLabel: string
    url: string
  }[]
  media: ProjectMedia[]
}

export type ProjectMedia =
  | {
    type: 'image' | 'video'
    src: string
    alt?: string
    title?: string
    description?: string
  }
  | {
    type: 'youtube'
    videoId: string
    title: string
    description?: string
  }

export const projectMediaPlaceholder = 'No project media is available yet.'

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Readable title from a file path, e.g. `/roam.io/social-feed_roam.io.png` with `strip: 'roam.io'` gives "Social Feed". */
export function titleFromFilename(src: string, strip?: string) {
  let name = src.split('/').pop()?.replace(/\.[^.]+$/, '') ?? ''
  if (strip) name = name.replace(new RegExp(escapeRegExp(strip), 'gi'), ' ')
  return name
    .replace(/[-_](?:[a-f0-9]{8,}|[a-f0-9]{4}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12})$/i, '')
    .replace(/[-_.\s]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase()) || 'Project media'
}

const videoExtensions = /\.(?:mp4|webm)$/i

/** Media served from `public/<dir>/`. Add a file there, then list it here. */
function publicMedia(projectTitle: string, dir: string, files: string[]): ProjectMedia[] {
  return files.map((file) => {
    const title = titleFromFilename(file, dir)
    return { type: videoExtensions.test(file) ? 'video' : 'image', src: `/${dir}/${file}`, title, alt: `${projectTitle} ${title.toLowerCase()}` }
  })
}

export const projects: PortfolioProject[] = [
  {
    id: 'roam-io',
    title: 'Roam.io',
    technologies: ['Flutter', 'Dart', 'Firebase', 'PostgreSQL / PostGIS', 'Google Maps APIs'],
    summary: 'A team-built, cross-platform exploration app that turns real-world movement into map discovery, journeys and progression.',
    highlights: [
      'Fog-of-war map exploration, nearby places and visit logs.',
      'GPS journey tracking, including background tracking on iOS and Android.',
      'XP, milestones, quests, achievements and a social activity feed.',
      'The repository combines Firebase services with a PostgreSQL/PostGIS spatial API.',
      'The repository documents CI checks for formatting, analysis, tests, coverage and Android builds.',
    ],
    skillsLearned: [
      'Flutter and Dart development',
      'Firebase integration',
      'Location-aware application development',
      'Geospatial data concepts',
      'Cross-platform mobile development',
    ],
    githubUrl: 'https://github.com/Monash-FIT3170/2026W2-Roam.io',
    links: [{ label: 'VIEW LANDING PAGE', shortLabel: 'WEBSITE', url: 'https://roamio-landing-page-gamma.vercel.app/' }],
    media: publicMedia('Roam.io', 'roam.io', [
      'social-feed_roam.io.png',
      'milestones_roam.io.png',
      'roam.io_team_photo.png',
      'hazard_video.mp4',
    ]),
  },
  {
    id: 'muas-website',
    title: 'MUAS Website',
    shortTitle: 'MUAS',
    technologies: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Three.js', 'React Three Fiber', 'Resend'],
    summary: 'A public-facing website for Monash Uncrewed Aerial Systems, presenting its engineering work, competitions, teams and activities.',
    highlights: [
      'Uses the Next.js App Router with React and TypeScript.',
      'Includes reusable page sections and a responsive site structure.',
      'Uses Three.js with React Three Fiber and Drei for interactive 3D content.',
      'The server-side contact route validates submissions and sends email through Resend.',
      'The site includes recruitment, competitions, team, sponsor and newsletter areas.',
    ],
    skillsLearned: [
      'Next.js and React',
      'TypeScript',
      'Responsive frontend development',
      'Tailwind CSS',
      'Interactive web design',
    ],
    achievements: [
      'SUAS 2026 — Monash UAS placed 10th overall out of 60 teams.',
      'Website evaluation — 92/100 points.',
    ],
    githubUrl: 'https://github.com/MonashUAS/muas-website',
    media: [],
  },
  {
    id: 'fit3155-algorithms',
    title: 'FIT3155 Algorithms',
    shortTitle: 'FIT3155',
    technologies: ['Python', 'Algorithm Design', 'Data Structures'],
    summary: 'An exploration of advanced algorithms and data structures studied and applied throughout FIT3155 at Monash University. As one of the most challenging units in my degree, it pushed me to strengthen my understanding of algorithm design, optimisation, and problem-solving through practical Python implementations.',
    highlights: [
      'Implemented Boyer–Moore string matching.',
      'Explored Burrows–Wheeler Transform-based approximate matching.',
      "Implemented Ukkonen's suffix tree construction.",
      'Applied rolling-hash-based pattern matching.',
      'Developed supporting examples and basic tests.',
    ],
    skillsLearned: [
      'Advanced data structures',
      'String-processing algorithms',
      'Algorithm design and complexity analysis',
      'Pattern matching',
      'Python implementation and debugging',
    ],
    githubUrl: 'https://github.com/sanjevanr/FIT3155-Algorithms',
    media: [],
  },
  {
    id: 'spotto',
    title: 'Spotto',
    technologies: ['Swift', 'Xcode', 'iOS', 'MapKit', 'Core Location'],
    summary: 'An iOS prototype developed during UniHack, translating interface designs into a functional app under hackathon time constraints.',
    highlights: [
      'Built with Swift and Xcode, with map and location handling through MapKit and Core Location.',
      'Displays map annotations and requests the user’s current location.',
      'Includes a station picker and a modal reporting flow for spotted Myki officers.',
      'Developed collaboratively while working through debugging and runtime constraints.',
    ],
    skillsLearned: [
      'Swift and iOS development',
      'Xcode',
      'Translating Figma designs into interfaces',
      'Debugging and collaborative development',
      'Rapid prototyping',
    ],
    githubUrl: 'https://github.com/Amar723/UniHack-Team-YVL',
    links: [{ label: 'VIEW ON DEVPOST', shortLabel: 'DEVPOST', url: 'https://devpost.com/software/spotto' }],
    media: [{ type: 'youtube', videoId: 'WQhQ-47rHPU', title: 'Spotto Demo' }],
  },
  {
    id: 'unilinq',
    title: 'UniLinq',
    shortTitle: 'UniLinq',
    technologies: ['Next.js', 'React', 'TypeScript', 'Supabase', 'PostgreSQL / pgvector', 'Gemini API'],
    summary: 'A collaborative platform connecting university students with small and medium-sized enterprises through structured real-world projects. UniLinq progressed from a proof of concept towards an MVP, helping businesses publish opportunities and students discover work aligned with their skills and interests.',
    highlights: [
      'AI-assisted project scoping uses a guided conversation and Gemini to draft structured plans, deliverables and milestones for businesses to review and edit.',
      'Student skills and project requirements are represented as embeddings; PostgreSQL pgvector similarity search surfaces potentially relevant opportunities without claiming a guaranteed match.',
      'Student onboarding supports profiles for skills and interests, with an architecture for resume parsing, AI-assisted profile generation and verification workflows.',
      'Project discovery and messaging help students and SMEs communicate and coordinate after finding an opportunity.',
      'Contributed to wireframes and user flows, MVP feature implementation and refinement, messaging, database reorganisation, testing, debugging and demonstration preparation.',
    ],
    skillsLearned: [
      'Full-stack development with React, Next.js and TypeScript',
      'Supabase, PostgreSQL, database design and access control',
      'pgvector similarity search, Gemini integration and AI-assisted matching',
      'Team collaboration and iterative MVP development',
    ],
    links: [{ label: 'VISIT UNILINQ', shortLabel: 'UNILINQ', url: 'https://unilinq.org' }],
    media: [],
  },
]
