import { useId } from 'react'
import { Link } from 'react-router-dom'

export function IntroPanel() {
  const headingId = useId()
  return (
    <section className="intro-panel" aria-labelledby={headingId}>
      <div className="intro-panel__header">
        <h2 id={headingId}>a little about me.</h2>
      </div>

      <div className="intro-panel__content">
        <p>Hey! I'm Sanjevan Rajasegar, a SWE and Comp Sci student at Monash University in Melbourne.</p>

        <p>I’m passionate about combining software development with creativity, particularly through front-end design, UI/UX, and digital storytelling. My interest in videography and photography has influenced the way I think about visual design, helping me create interfaces that are clear, engaging, and user-focused.</p>

        <p>I enjoy building thoughtful software solutions, learning new technologies, and working on projects that bring together strong technical foundations with meaningful user experiences.</p>
      </div>

      <Link to="/about" className="intro-panel__link">more about me ↗</Link>
    </section>
  )
}
