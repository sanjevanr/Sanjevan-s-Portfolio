export type FinderPhotoPortfolio = {
  id: string
  name: string
  preview: string
  googleDriveUrl: string
}

export type FinderVideo = {
  id: string
  title: string
  duration?: string
  /** Supplied snapshot only; this is not refreshed live. */
  snapshotViews?: number
  /** Supplied relative-age snapshot only. */
  snapshotAge?: string
  thumbnail: string
  youtubeUrl: string
}

// Add real portfolio and upload records here when their public URLs are available.
export const photoPortfolios: FinderPhotoPortfolio[] = []
export const videoUploads: FinderVideo[] = [
  {
    id: 'daikoku-pa',
    title: '大黒PA (daikoku PA)',
    snapshotViews: 23,
    snapshotAge: '7 mo ago',
    thumbnail: 'https://i.ytimg.com/vi/3bSQDVXawGk/hqdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=3bSQDVXawGk',
  },
  {
    id: 'biovortex',
    title: '6:16 @ biovortex',
    duration: '1:01',
    snapshotViews: 57,
    snapshotAge: '7 mo ago',
    thumbnail: 'https://i.ytimg.com/vi/cJjj_YPVw1I/hqdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=cJjj_YPVw1I',
  },
  {
    id: 'kaiyukan-aquarium',
    title: 'kaiyukan aquarium',
    duration: '0:45',
    snapshotViews: 24,
    snapshotAge: '7 mo ago',
    thumbnail: 'https://i.ytimg.com/vi/oxVTCFzqg0Q/hqdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=oxVTCFzqg0Q',
  },
  {
    id: 'drive-me-to-the-snow',
    title: 'drive ME 2 the snow¡',
    duration: '1:34',
    snapshotViews: 178,
    snapshotAge: '1 yr ago',
    thumbnail: 'https://i.ytimg.com/vi/NM7ghH2skHY/hqdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=NM7ghH2skHY',
  },
  {
    id: 'island-life',
    title: "island life (seychelles '06 - '09)",
    duration: '0:34',
    snapshotViews: 149,
    snapshotAge: '1 yr ago',
    thumbnail: 'https://i.ytimg.com/vi/qpie8Lw3-6E/hqdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=qpie8Lw3-6E',
  },
  {
    id: 'climbing-kosciuszko',
    title: 'climbing kosciuszko',
    duration: '1:05',
    snapshotViews: 144,
    snapshotAge: '1 yr ago',
    thumbnail: 'https://i.ytimg.com/vi/YMXKYU5uHvs/hqdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=YMXKYU5uHvs',
  },
  {
    id: 'india-through-my-eyes',
    title: 'india through my eyes',
    duration: '1:08',
    snapshotViews: 74,
    snapshotAge: '1 yr ago',
    thumbnail: 'https://i.ytimg.com/vi/xw-86GC_Il0/hqdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=xw-86GC_Il0',
  },
]
