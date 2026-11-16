export type PhotoPortfolio = {
  id: string
  name: string
  pdfUrl: string
  coverUrl: string
  downloadFilename: string
  description: string
}

export type FinderVideo = {
  id: string
  title: string
  duration?: string
  /** Supplied snapshot only; this is not refreshed live. */
  snapshotViews?: number
  /** Supplied relative-age snapshot only. */
  snapshotAge?: string
  description?: string
  camera?: string
  editing?: string
  colourGrading?: string
  editingAndColourGrading?: string
  song?: string
  thumbnail: string
  youtubeUrl: string
}

export const photoPortfolios: PhotoPortfolio[] = [
  {
    id: 'selected-works',
    name: 'Selected Works',
    pdfUrl: '/portfolios/selected-works.pdf',
    coverUrl: '/portfolios/selected-works-cover.webp',
    downloadFilename: 'Sanjevan-Rajasegar-Selected-Works.pdf',
    description: 'A photography collection featuring Mt Kosciuszko, Roadtripping With Friends and Sacred Spaces.',
  },
  {
    id: 'the-japanese-everyman',
    name: 'THE JAPANESE EVERYMAN',
    pdfUrl: '/portfolios/the-japanese-everyman.pdf',
    coverUrl: '/portfolios/the-japanese-everyman-cover.webp',
    downloadFilename: 'Sanjevan-Rajasegar-The-Japanese-Everyman.pdf',
    description: 'A solo photographic journey through Japan, observing ordinary people, places, interactions and daily life.',
  },
]
export const videoUploads: FinderVideo[] = [
  {
    id: 'daikoku-pa',
    title: '大黒PA (daikoku PA)',
    description: 'ZOOOOOOOOM',
    camera: 'anko camcorder',
    editing: 'Final Cut Pro X',
    song: 'rottweiler — esdeekid',
    snapshotViews: 23,
    snapshotAge: '7 mo ago',
    thumbnail: 'https://i.ytimg.com/vi/3bSQDVXawGk/hqdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=3bSQDVXawGk',
  },
  {
    id: 'biovortex',
    title: '6:16 @ biovortex',
    description: 'a reflection on creating art which makes you feel every detail',
    camera: 'Fujifilm X-T30 II',
    editing: 'Final Cut Pro X',
    colourGrading: 'DaVinci Resolve',
    song: 'the legend of ashitaka — joe hisaishi',
    duration: '1:01',
    snapshotViews: 57,
    snapshotAge: '7 mo ago',
    thumbnail: 'https://i.ytimg.com/vi/cJjj_YPVw1I/hqdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=cJjj_YPVw1I',
  },
  {
    id: 'kaiyukan-aquarium',
    title: 'kaiyukan aquarium',
    description: 'saw a whale shark for the first time in my life :)',
    camera: 'Fujifilm X-T30 II',
    editing: 'Final Cut Pro X',
    colourGrading: 'DaVinci Resolve',
    song: 'moonlight on the river — mac de marco',
    duration: '0:45',
    snapshotViews: 24,
    snapshotAge: '7 mo ago',
    thumbnail: 'https://i.ytimg.com/vi/oxVTCFzqg0Q/hqdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=oxVTCFzqg0Q',
  },
  {
    id: 'drive-me-to-the-snow',
    title: 'drive ME 2 the snow¡',
    description: 'dedicated to amar, sandavi and sahana',
    camera: 'Fujifilm X-T30 II',
    editing: 'Final Cut Pro X',
    colourGrading: 'DaVinci Resolve',
    song: 'drive ME crazy! — lil yachty',
    duration: '1:34',
    snapshotViews: 178,
    snapshotAge: '1 yr ago',
    thumbnail: 'https://i.ytimg.com/vi/NM7ghH2skHY/hqdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=NM7ghH2skHY',
  },
  {
    id: 'island-life',
    title: "island life (seychelles '06 - '09)",
    camera: 'Sony Cyber-shot',
    editingAndColourGrading: 'Final Cut Pro X',
    song: 'on one in october — mixed by V!KK',
    duration: '0:34',
    snapshotViews: 149,
    snapshotAge: '1 yr ago',
    thumbnail: 'https://i.ytimg.com/vi/qpie8Lw3-6E/hqdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=qpie8Lw3-6E',
  },
  {
    id: 'climbing-kosciuszko',
    title: 'climbing kosciuszko',
    description: 'climbing the tallest mountain in australia (2,228m)',
    camera: 'Fujifilm X-T30 II',
    editingAndColourGrading: 'Final Cut Pro X',
    song: 'ghost town — kanye west',
    duration: '1:05',
    snapshotViews: 144,
    snapshotAge: '1 yr ago',
    thumbnail: 'https://i.ytimg.com/vi/YMXKYU5uHvs/hqdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=YMXKYU5uHvs',
  },
  {
    id: 'india-through-my-eyes',
    title: 'india through my eyes',
    camera: 'iPhone 12',
    editing: 'CapCut',
    song: 'nights — frank ocean',
    duration: '1:08',
    snapshotViews: 74,
    snapshotAge: '1 yr ago',
    thumbnail: 'https://i.ytimg.com/vi/xw-86GC_Il0/hqdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=xw-86GC_Il0',
  },
]
