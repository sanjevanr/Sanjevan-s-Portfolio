import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { projectMediaPlaceholder, type PortfolioProject } from '../../data/projects'

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'media', label: 'Media' },
] as const

export type ProjectBrowserTab = (typeof tabs)[number]['id']

function OverviewSection({ id, title, variant, children }: { id: string; title: string; variant?: 'band' | 'highlight'; children: ReactNode }) {
  const modifier = variant === 'band'
    ? ' project-overview__section--band'
    : variant === 'highlight' ? ' project-overview__section--band project-overview__section--highlight' : ''
  return (
    <section className={`project-overview__section${modifier}`} aria-labelledby={id}>
      <h3 id={id} className="project-overview__section-title">{title}</h3>
      {children}
    </section>
  )
}

function OverviewList({ items }: { items: string[] }) {
  return (
    <ul className="project-overview__list">
      {items.map((item) => <li key={item}>{item}</li>)}
    </ul>
  )
}

function Overview({ project }: { project: PortfolioProject }) {
  const baseId = useId()
  return (
    <article className="project-overview">
      <header className="project-overview__header">
        <h2>{project.title}</h2>
        <p className="project-overview__meta">{project.technologies.join(' / ')}</p>
      </header>
      <OverviewSection id={`${baseId}-about`} title="About the project">
        <p className="project-overview__summary">{project.summary}</p>
      </OverviewSection>
      <OverviewSection id={`${baseId}-features`} title="Key Features & Implementation" variant="band">
        <OverviewList items={project.highlights} />
      </OverviewSection>
      <OverviewSection id={`${baseId}-skills`} title="Skills Learned">
        <OverviewList items={project.skillsLearned} />
      </OverviewSection>
      {project.achievements && (
        <OverviewSection id={`${baseId}-achievements`} title="Achievements" variant="highlight">
          <OverviewList items={project.achievements} />
        </OverviewSection>
      )}
      <OverviewSection id={`${baseId}-links`} title="Links">
        <div className="project-browser__links">
          <a className="project-github-link" href={project.githubUrl} target="_blank" rel="noopener noreferrer">
            VIEW ON GITHUB <span aria-hidden="true">↗</span>
          </a>
          {project.links?.map((link) => (
            <a className="project-github-link project-github-link--secondary" key={link.url} href={link.url} target="_blank" rel="noopener noreferrer">
              {link.label}
            </a>
          ))}
        </div>
      </OverviewSection>
    </article>
  )
}

function Media({ project }: { project: PortfolioProject }) {
  if (project.media.length === 0) return <p className="project-browser__placeholder">{projectMediaPlaceholder}</p>
  return (
    <div className="project-browser__media">
      {project.media.map((item) => (
        item.type === 'video' ? (
          <video key={item.src} src={item.src} controls />
        ) : (
          <img key={item.src} src={item.src} alt={item.alt ?? ''} />
        )
      ))}
    </div>
  )
}

type ProjectBrowserProps = {
  project: PortfolioProject
  activeTab: ProjectBrowserTab
  onTabChange: (tab: ProjectBrowserTab) => void
}

export default function ProjectBrowser({ project, activeTab, onTabChange }: ProjectBrowserProps) {
  const baseId = useId()
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const [hasSwitched, setHasSwitched] = useState(false)

  const selectTab = (id: ProjectBrowserTab, focusIndex?: number) => {
    if (id !== activeTab) {
      setHasSwitched(true)
      onTabChange(id)
    }
    if (focusIndex !== undefined) tabRefs.current[focusIndex]?.focus()
  }

  const onTabsKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = tabs.findIndex((item) => item.id === activeTab)
    if (index < 0) return
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault()
      const direction = event.key === 'ArrowRight' ? 1 : -1
      const nextIndex = (index + direction + tabs.length) % tabs.length
      selectTab(tabs[nextIndex].id, nextIndex)
      return
    }
    if (event.key === 'Home') {
      event.preventDefault()
      selectTab(tabs[0].id, 0)
      return
    }
    if (event.key === 'End') {
      event.preventDefault()
      selectTab(tabs[tabs.length - 1].id, tabs.length - 1)
    }
  }

  return (
    <section className="project-browser" aria-label="Project browser">
      <header className="retro-window__titlebar project-browser__chrome">
        <div className="project-browser__tabs" role="tablist" aria-label="Project sections" onKeyDown={onTabsKeyDown}>
          {tabs.map((item, index) => {
            const selected = item.id === activeTab
            return (
              <button
                key={item.id}
                ref={(node) => { tabRefs.current[index] = node }}
                id={`${baseId}-tab-${item.id}`}
                className="project-browser__tab"
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`${baseId}-panel`}
                tabIndex={selected ? 0 : -1}
                onClick={() => selectTab(item.id)}
              >
                {item.label}
              </button>
            )
          })}
        </div>
      </header>
      <div className="retro-window__body project-browser__viewport">
        <div
          key={activeTab}
          id={`${baseId}-panel`}
          className={`project-browser__panel project-browser__panel--${activeTab}${hasSwitched ? ' project-browser__panel--swap' : ''}`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${activeTab}`}
          tabIndex={0}
        >
          {activeTab === 'overview' ? <Overview project={project} /> : <Media project={project} />}
        </div>
      </div>
    </section>
  )
}
