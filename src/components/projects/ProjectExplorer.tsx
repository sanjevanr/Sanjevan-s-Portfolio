import { useRef, type KeyboardEvent } from 'react'
import type { PortfolioProject } from '../../data/projects'

type ProjectExplorerProps = {
  projects: PortfolioProject[]
  selectedId: string
  onSelect: (id: string) => void
  compact: boolean
}

export default function ProjectExplorer({ projects, selectedId, onSelect, compact }: ProjectExplorerProps) {
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = projects.findIndex((project) => project.id === selectedId)
    if (index < 0) return
    let next = index
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = Math.min(projects.length - 1, index + 1)
    else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = Math.max(0, index - 1)
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = projects.length - 1
    else return
    event.preventDefault()
    onSelect(projects[next].id)
    optionRefs.current[next]?.focus()
  }

  return (
    <aside className="project-explorer" aria-label="Project explorer">
      <p className="project-explorer__path">Projects</p>
      <div className="project-explorer__list" role="listbox" aria-label="Projects" onKeyDown={onKeyDown}>
        {projects.map((project, index) => {
          const selected = project.id === selectedId
          return (
            <button
              key={project.id}
              ref={(node) => { optionRefs.current[index] = node }}
              className="project-explorer__option"
              type="button"
              role="option"
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              title={project.title}
              aria-label={project.title}
              onClick={() => onSelect(project.id)}
            >
              <span className="project-explorer__folder" aria-hidden="true" />
              <span className="project-explorer__name">{compact ? project.shortTitle ?? project.title : project.title}</span>
            </button>
          )
        })}
      </div>
    </aside>
  )
}
