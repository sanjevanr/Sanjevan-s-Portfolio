export interface PortfolioProject {
  id: string
  title: string
  technologies: string[]
  summary: string
  highlights: string[]
  skillsLearned: string[]
  achievements?: string[]
  githubUrl: string
  links?: {
    label: string
    url: string
  }[]
  media: {
    type: 'image' | 'video' | 'gif'
    src: string
    alt?: string
  }[]
}

export const projectMediaPlaceholder = 'No project media is available yet.'

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
    media: [],
  },
  {
    id: 'muas-website',
    title: 'MUAS Website',
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
    links: [{ label: 'VIEW ON DEVPOST ↗', url: 'https://devpost.com/software/spotto' }],
    media: [],
  },
]
