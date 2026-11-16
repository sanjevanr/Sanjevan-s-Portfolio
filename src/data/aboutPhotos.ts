export type AboutPhoto = {
  id: string
  label: string
  src?: string
  caption: string
  alt: string
}

export const japanPhotos: AboutPhoto[] = [
  { id: 'japan-1', label: 'JAPAN_01', caption: 'JAPAN_01', alt: 'Placeholder for the first Japan scrapbook photograph' },
  { id: 'japan-2', label: 'JAPAN_02', caption: 'JAPAN_02', alt: 'Placeholder for the second Japan scrapbook photograph' },
  { id: 'japan-3', label: 'JAPAN_03', caption: 'JAPAN_03', alt: 'Placeholder for the third Japan scrapbook photograph' },
]

export const interestPhotos: AboutPhoto[] = [
  { id: 'interest-1', label: 'ARCHIVE_01', caption: 'ARCHIVE_01', alt: 'Placeholder for a future personal interest photograph' },
  { id: 'interest-2', label: 'ARCHIVE_02', caption: 'ARCHIVE_02', alt: 'Placeholder for a future personal interest photograph' },
  { id: 'interest-3', label: 'ARCHIVE_03', caption: 'ARCHIVE_03', alt: 'Placeholder for a future personal interest photograph' },
]
