import { useState } from 'react'
import { projects } from '../../data/projects'
import RetroWindow from '../RetroWindow'
import SpotifyPlayer from '../SpotifyPlayer'
import ProjectBrowser, { type ProjectBrowserTab } from './ProjectBrowser'
import ProjectExplorer from './ProjectExplorer'

export default function ProjectsPage() {
  const [selectedId, setSelectedId] = useState(projects[0].id)
  const [activeTab, setActiveTab] = useState<ProjectBrowserTab>('overview')
  const selected = projects.find((project) => project.id === selectedId) ?? projects[0]

  return (
    <main className="page-shell page-shell--projects">
      <div className="projects-stage">
        <div className="projects-collage">
          <RetroWindow
            title="Projects.exe"
            accessibleLabel="Projects application"
            className="projects-workspace"
            showTitle
            singleContentMount
            disableCloseControl
            expandedCloseWithRedButton
          >
            <div className="projects-workspace__layout">
              <ProjectExplorer projects={projects} selectedId={selected.id} onSelect={setSelectedId} />
              <ProjectBrowser project={selected} activeTab={activeTab} onTabChange={setActiveTab} />
            </div>
          </RetroWindow>

          <div className="projects-dock">
            <RetroWindow
              title="Now playing"
              accessibleLabel="Projects music player"
              canMaximise={false}
              className="retro-window--spotify retro-window--projects-player"
            >
              <SpotifyPlayer />
            </RetroWindow>
          </div>
        </div>
      </div>
    </main>
  )
}
