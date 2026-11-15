export default function ResumeShortcut() {
  return (
    <a
      className="resume-shortcut resume-shortcut--utility"
      href="/resume.pdf"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Open Sanjevan Rajasegar's resume PDF"
      title="Open resume PDF"
    >
      <span className="resume-shortcut__icon" aria-hidden="true">
        <span className="resume-shortcut__fold" />
        <span className="resume-shortcut__mark">PDF</span>
      </span>
      <span className="resume-shortcut__label">RESUME</span>
    </a>
  )
}
