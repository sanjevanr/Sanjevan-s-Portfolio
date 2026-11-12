import { useState } from 'react'

const videoId = '3bSQDVXawGk'
const videoUrl = `https://www.youtube.com/watch?v=${videoId}`
const thumbnailUrls = [
  `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
  `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
]

export default function YouTubePreview() {
  const [thumbnailIndex, setThumbnailIndex] = useState(0)
  const [thumbnailUnavailable, setThumbnailUnavailable] = useState(false)

  return (
    <a
      className="youtube-preview"
      href={videoUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Watch Sanjevan's latest video edit on YouTube (opens in a new tab)"
    >
      {thumbnailUnavailable ? (
        <span className="youtube-preview__fallback" aria-hidden="true" />
      ) : (
        <img
          className="youtube-preview__thumbnail"
          src={thumbnailUrls[thumbnailIndex]}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => {
            if (thumbnailIndex < thumbnailUrls.length - 1) setThumbnailIndex(thumbnailIndex + 1)
            else setThumbnailUnavailable(true)
          }}
        />
      )}
      <span className="youtube-preview__play" aria-hidden="true" />
    </a>
  )
}
