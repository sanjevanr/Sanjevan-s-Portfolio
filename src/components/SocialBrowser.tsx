import { useId, useRef, useState, type KeyboardEvent } from 'react'
import useWindowController from '../hooks/useWindowController'
import WindowControls from './WindowControls'

const platforms = [
  {
    id: 'instagram',
    label: 'Instagram',
    handle: 'sanjevanr_media',
    url: 'https://www.instagram.com/sanjevanr_media/',
    descriptor: 'Photo and media',
    cta: 'Visit profile',
    rows: [
      ['Focus', 'Photography + Videography'],
      ['Format', 'Posts and Reels'],
    ],
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    handle: 'Sanjevan Rajasegar',
    url: 'https://www.linkedin.com/in/sanjevan-rajasegar-a3b178272/',
    descriptor: 'SWE + CS Student at Monash University',
    cta: 'Visit profile',
    rows: [
      ['Place', 'Melbourne'],
      ['Study', 'SWE, Adv CS'],
    ],
  },
  {
    id: 'github',
    label: 'GitHub',
    handle: 'sanjevanr',
    url: 'https://github.com/sanjevanr',
    descriptor: 'Profile',
    cta: 'View repo profile',
    rows: [
      ['Profile', 'Technical Work'],
      ['Code', 'Technical Projects'],
    ],
  },
  {
    id: 'youtube',
    label: 'YouTube',
    handle: '@sanjevanr',
    url: 'https://www.youtube.com/@sanjevanr',
    descriptor: 'Videos and Edits',
    cta: 'Open Channel',
    rows: [
      ['Channel', '@sanjevanr'],
      ['Format', 'Films and Edits'],
    ],
  },
] as const

type PlatformId = (typeof platforms)[number]['id']

function PlatformMark({ id }: { id: PlatformId }) {
  if (id === 'instagram') {
    return (
      <svg className="social-browser__mark" viewBox="0 0 24 24" aria-hidden="true">
        <defs>
          <linearGradient id="social-ig-wash" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f7d36a" />
            <stop offset="38%" stopColor="#e1306c" />
            <stop offset="72%" stopColor="#833ab4" />
            <stop offset="100%" stopColor="#405de6" />
          </linearGradient>
        </defs>
        <rect x="1.5" y="1.5" width="21" height="21" rx="6" fill="url(#social-ig-wash)" />
        <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5" fill="none" stroke="#fff6e8" strokeWidth="1.4" />
        <circle cx="12" cy="12" r="4.1" fill="none" stroke="#fff" strokeWidth="1.7" />
        <circle cx="12" cy="12" r="1.7" fill="#fff" />
        <circle cx="17.1" cy="6.9" r="1.05" fill="#fff" />
      </svg>
    )
  }

  if (id === 'linkedin') {
    return (
      <svg className="social-browser__mark" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="1.5" y="1.5" width="21" height="21" rx="3" fill="#0a66c2" />
        <rect x="1.5" y="1.5" width="21" height="9" rx="3" fill="#7eb6ef" opacity=".45" />
        <path fill="#fff" d="M6.7 9.4h2.35V17H6.7zm1.18-3.7a1.28 1.28 0 1 1 0 2.56 1.28 1.28 0 0 1 0-2.56zM11.2 9.4h2.25v1.04h.04c.31-.6 1.08-1.22 2.22-1.22 2.38 0 2.82 1.56 2.82 3.6V17h-2.34v-3.55c0-.85-.02-1.94-1.18-1.94-1.19 0-1.37.92-1.37 1.88V17H11.2z" />
      </svg>
    )
  }

  if (id === 'github') {
    return (
      <svg className="social-browser__mark" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="1.5" y="1.5" width="21" height="21" rx="5" fill="#241f1c" />
        <path fill="#f3efe6" d="M12 4.2a6.3 6.3 0 0 0-2 12.27c.31.06.43-.13.43-.3v-1.05c-1.74.38-2.1-.74-2.1-.74-.29-.73-.7-.92-.7-.92-.57-.39.05-.38.05-.38.63.04.96.65.96.65.56.96 1.47.68 1.83.52.06-.4.22-.68.4-.84-1.39-.16-2.85-.7-2.85-3.1 0-.68.24-1.24.64-1.68-.06-.16-.28-.8.06-1.66 0 0 .53-.17 1.73.64a6 6 0 0 1 3.14 0c1.2-.81 1.73-.64 1.73-.64.34.86.12 1.5.06 1.66.4.44.64 1 .64 1.68 0 2.41-1.47 2.94-2.86 3.1.23.2.43.58.43 1.17v1.7c0 .17.11.36.43.3A6.3 6.3 0 0 0 12 4.2z" />
      </svg>
    )
  }

  return (
    <svg className="social-browser__mark" viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id="social-yt-wash" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff5d5d" />
          <stop offset="55%" stopColor="#e10600" />
          <stop offset="100%" stopColor="#9d0d12" />
        </linearGradient>
      </defs>
      <rect x="1.2" y="5" width="21.6" height="14" rx="4" fill="url(#social-yt-wash)" />
      <path fill="#fff" d="M10 8.7v6.6l5.8-3.3z" />
    </svg>
  )
}

export default function SocialBrowser() {
  const baseId = useId()
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const { isMinimised, minimise, restore, restoreButtonRef } = useWindowController()
  const [activeId, setActiveId] = useState<PlatformId>('instagram')
  const [hasSwitched, setHasSwitched] = useState(false)
  const active = platforms.find((platform) => platform.id === activeId) ?? platforms[0]

  const selectPlatform = (id: PlatformId, focusIndex?: number) => {
    setHasSwitched(true)
    setActiveId(id)
    if (focusIndex !== undefined) tabRefs.current[focusIndex]?.focus()
  }

  const onTabsKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = platforms.findIndex((platform) => platform.id === activeId)
    if (index < 0) return
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault()
      const direction = event.key === 'ArrowRight' ? 1 : -1
      const nextIndex = (index + direction + platforms.length) % platforms.length
      selectPlatform(platforms[nextIndex].id, nextIndex)
      return
    }
    if (event.key === 'Home') {
      event.preventDefault()
      selectPlatform(platforms[0].id, 0)
      return
    }
    if (event.key === 'End') {
      event.preventDefault()
      selectPlatform(platforms[platforms.length - 1].id, platforms.length - 1)
    }
  }

  if (isMinimised) {
    return (
      <button
        ref={restoreButtonRef}
        className="retro-window__restore retro-window--social-browser"
        type="button"
        aria-label="Restore internet panel"
        onClick={restore}
      >
        <span className="retro-window__restore-dot" aria-hidden="true" />
        Restore panel
      </button>
    )
  }

  return (
    <section className="retro-window retro-window--social-browser" aria-label="Social browser">
      <header className="retro-window__titlebar social-browser__chrome">
        <WindowControls
          title="Internet"
          canMaximise={false}
          canMinimise
          maximiseIndicatorOnly
          onMaximise={() => {}}
          onMinimise={minimise}
        />
        <div className="social-browser__tabs" role="tablist" aria-label="Sanjevan on the web" onKeyDown={onTabsKeyDown}>
          {platforms.map((platform, index) => {
            const selected = platform.id === active.id
            return (
              <button
                key={platform.id}
                ref={(node) => { tabRefs.current[index] = node }}
                id={`${baseId}-tab-${platform.id}`}
                className="social-browser__tab"
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`${baseId}-panel-${platform.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => selectPlatform(platform.id)}
              >
                <PlatformMark id={platform.id} />
                <span className="social-browser__tab-label">{platform.label}</span>
              </button>
            )
          })}
        </div>
      </header>
      <p className="social-browser__address">
        <span className="social-browser__address-kicker">Address</span>
        <span className="social-browser__address-url" title={active.url}>{active.url}</span>
      </p>
      <div className="retro-window__body social-browser__viewport">
        <div
          key={active.id}
          id={`${baseId}-panel-${active.id}`}
          className={`social-browser__panel${hasSwitched ? ' social-browser__panel--swap' : ''}`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${active.id}`}
          tabIndex={0}
        >
          <div className="social-browser__identity">
            <span className={`social-browser__avatar social-browser__avatar--${active.id}`} aria-hidden="true">
              <PlatformMark id={active.id} />
            </span>
            <div className="social-browser__identity-copy">
              <h2>{active.label}</h2>
              <p className="social-browser__handle">{active.handle}</p>
              <p className="social-browser__descriptor">{active.descriptor}</p>
            </div>
          </div>
          <dl className="social-browser__meta">
            {active.rows.map(([label, value]) => (
              <div className="social-browser__meta-row" key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <a
            className="social-browser__cta"
            href={active.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${active.cta} on ${active.label} (opens in a new tab)`}
          >
            {active.cta} <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
    </section>
  )
}
