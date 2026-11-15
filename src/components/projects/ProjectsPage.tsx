import { useState } from 'react'
import { projects } from '../../data/projects'
import { mobileHomeQuery, useMediaQuery } from '../HomeAudio'
import RetroWindow from '../RetroWindow'
import SpotifyPlayer from '../SpotifyPlayer'
import ProjectBrowser, { type ProjectBrowserTab } from './ProjectBrowser'
import ProjectExplorer from './ProjectExplorer'

export default function ProjectsPage() {
  const [selectedId, setSelectedId] = useState(projects[0].id)
  const [activeTab, setActiveTab] = useState<ProjectBrowserTab>('overview')
  const isPhone = useMediaQuery(mobileHomeQuery)
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
            controlsDisabled={isPhone}
          >
            <div className="projects-workspace__layout">
              <ProjectExplorer projects={projects} selectedId={selected.id} onSelect={setSelectedId} compact={isPhone} />
              <ProjectBrowser project={selected} activeTab={activeTab} onTabChange={setActiveTab} compact={isPhone} />
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
