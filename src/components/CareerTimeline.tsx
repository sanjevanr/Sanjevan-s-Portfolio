import { useId, useRef } from 'react'
import { career } from '../data/career'
import RetroScrollbar from './RetroScrollbar'

const companyLogos: Record<string, string> = {
  'deloitte-digital': '/company-logos/deloitte-digital.webp',
  muas: '/company-logos/monash-uncrewed-aerial-systems.webp',
  'lake-press': '/company-logos/lake-press.webp',
  campion: '/company-logos/campion-education.webp',
  mcav: '/company-logos/monash-connected-autonomous-vehicle.webp',
  nandos: '/company-logos/nandos-australia-new-zealand.webp',
}

type CareerTimelineProps = {
  expandedId: string | null
  onExpandedChange: (id: string | null) => void
}

export default function CareerTimeline({ expandedId, onExpandedChange }: CareerTimelineProps) {
  const instanceId = useId()
  const viewportRef = useRef<HTMLDivElement>(null)
  const viewportId = `${instanceId}-scroll-region`

  return (
    <div className="career-timeline">
      <div
        className="career-timeline__viewport"
        id={viewportId}
        ref={viewportRef}
        role="region"
        aria-label="Career history"
        tabIndex={0}
      >
        <ol className="career-timeline__list">
          {career.map((entry) => {
            const isExpanded = expandedId === entry.id
            const detailsId = `${instanceId}-${entry.id}-roles`
            const latestRole = entry.roles[0]
            const logo = companyLogos[entry.id]
            const isExpandable = entry.status !== 'incoming'
            const summary = (
              <>
                <span className="career-timeline__logo-tile" aria-hidden="true">
                  {logo ? (
                    <img src={logo} alt="" loading="lazy" decoding="async" draggable={false} />
                  ) : (
                    <span className="career-timeline__logo-fallback">{entry.initials}</span>
                  )}
                </span>
                <span className="career-timeline__summary">
                  <span className="career-timeline__organisation">{entry.organisation}</span>
                  <span className="career-timeline__preview">{latestRole.title}</span>
                  <span className="career-timeline__meta">
                    {entry.status === 'incoming' ? (
                      <span className="career-timeline__status">Incoming</span>
                    ) : (
                      <span>{entry.organisationPeriod}</span>
                    )}
                    {entry.arrangement && <span>{entry.arrangement}</span>}
                    {entry.location && <span>{entry.location}</span>}
                  </span>
                </span>
              </>
            )

            return (
              <li className={`career-timeline__entry${isExpanded ? ' is-expanded' : ''}`} key={entry.id}>
                <span className="career-timeline__node" aria-hidden="true" />
                {isExpandable ? (
                  <button
                    className="career-timeline__toggle"
                    type="button"
                    aria-expanded={isExpanded}
                    aria-controls={detailsId}
                    onClick={() => onExpandedChange(isExpanded ? null : entry.id)}
                  >
                    {summary}
                    <span className="career-timeline__toggle-icon" aria-hidden="true">{isExpanded ? '−' : '+'}</span>
                  </button>
                ) : (
                  <div className="career-timeline__toggle career-timeline__static">{summary}</div>
                )}
                {isExpandable && <div
                  className="career-timeline__reveal"
                  id={detailsId}
                  aria-hidden={!isExpanded}
                  inert={!isExpanded}
                  style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }}
                >
                  <div className="career-timeline__reveal-inner">
                    <div className="career-timeline__roles">
                      {entry.roles.map((role) => (
                        <article className="career-timeline__role" key={`${entry.id}-${role.title}`}>
                          <div className="career-timeline__role-heading">
                            <h3>{role.title}</h3>
                            <time>{role.period}</time>
                          </div>
                          {(role.arrangement || role.location) && (
                            <p className="career-timeline__role-context">
                              {[role.arrangement, role.location].filter(Boolean).join(' · ')}
                            </p>
                          )}
                          {role.details && <p className="career-timeline__description">{role.details}</p>}
                        </article>
                      ))}
                    </div>
                  </div>
                </div>}
              </li>
            )
          })}
        </ol>
      </div>
      <RetroScrollbar
        targetRef={viewportRef}
        targetId={viewportId}
        contentKey={expandedId ?? 'collapsed'}
        className="career-timeline__scrollbar"
        persistent
      />
    </div>
  )
}
