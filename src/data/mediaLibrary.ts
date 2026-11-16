export type FinderPhotoPortfolio = {
  id: string
  name: string
  preview: string
  googleDriveUrl: string
}

export type FinderVideo = {
  id: string
  title: string
  thumbnail: string
  youtubeUrl: string
}

// Add real portfolio and upload records here when their public URLs are available.
export const photoPortfolios: FinderPhotoPortfolio[] = []
export const videoUploads: FinderVideo[] = []
