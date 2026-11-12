const videoUrl = 'https://www.youtube.com/watch?v=3bSQDVXawGk'
const thumbnailUrl = 'https://i.ytimg.com/an_webp/3bSQDVXawGk/mqdefault_6s.webp?du=3000&sqp=CMDG1NcG&rs=AOn4CLD4IOaHLtiGNF1wIQDCTiHn39C9jA'

export default function YouTubePreview() {
  return (
    <a
      className="youtube-preview"
      href={videoUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Watch Sanjevan's latest video edit on YouTube (opens in a new tab)"
    >
      <img
        className="youtube-preview__thumbnail"
        src={thumbnailUrl}
        alt="Preview thumbnail for Sanjevan's latest YouTube video edit"
        loading="lazy"
        decoding="async"
      />
      <span className="youtube-preview__play" aria-hidden="true" />
    </a>
  )
}
