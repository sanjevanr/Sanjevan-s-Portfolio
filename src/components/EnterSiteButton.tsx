import { useHomeAudio } from './HomeAudio'

export default function EnterSiteButton() {
  const { isBlocked, togglePlayback, track } = useHomeAudio()
  if (!isBlocked) return null
  return (
    <button
      className="resume-shortcut resume-shortcut--utility enter-site-button"
      type="button"
      aria-label={`Enter the site and play ${track.title}`}
      title="Enter and start the music"
      onClick={togglePlayback}
    >
      <span className="resume-shortcut__label">ENTER <span aria-hidden="true">↗</span></span>
    </button>
  )
}
