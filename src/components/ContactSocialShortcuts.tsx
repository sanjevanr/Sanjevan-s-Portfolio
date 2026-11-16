import { socialPlatforms, type SocialPlatformId } from './SocialBrowser'

function ContactAppIcon({ platform }: { platform: SocialPlatformId }) {
  return (
    <span className={`contact-app-icon contact-app-icon--${platform}`} aria-hidden="true">
      {platform === 'instagram' && (
        <svg className="contact-app-icon__glyph" viewBox="0 0 24 24" fill="none">
          <rect x="5.2" y="5.2" width="13.6" height="13.6" rx="4.2" stroke="currentColor" strokeWidth="2" />
          <circle cx="12" cy="12" r="3.25" stroke="currentColor" strokeWidth="2" />
          <circle cx="16.45" cy="7.65" r="1.15" fill="currentColor" />
        </svg>
      )}
      {platform === 'linkedin' && (
        <svg className="contact-app-icon__glyph" viewBox="0 0 24 24" fill="none">
          <path fill="currentColor" d="M5.25 9.15h3.2v10.1h-3.2zm1.6-5.05a1.86 1.86 0 1 1-.02 3.72 1.86 1.86 0 0 1 .02-3.72ZM10.2 9.15h3.06v1.38h.05c.43-.8 1.47-1.65 3.03-1.65 3.24 0 3.84 2.13 3.84 4.9v5.47h-3.2v-4.85c0-1.16-.02-2.65-1.62-2.65-1.62 0-1.87 1.27-1.87 2.57v4.93H10.2z" />
        </svg>
      )}
      {platform === 'github' && (
        <svg className="contact-app-icon__glyph" viewBox="0 0 24 24" fill="none">
          <path fill="currentColor" d="M12 .55C5.67.55.55 5.68.55 12c0 5.06 3.28 9.36 7.83 10.88.57.1.78-.25.78-.55v-2.1c-3.18.7-3.85-1.35-3.85-1.35-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.75 1.18 1.75 1.18 1.02 1.74 2.68 1.24 3.33.95.1-.74.4-1.24.73-1.53-2.54-.29-5.21-1.27-5.21-5.66 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.45.11-3.02 0 0 .96-.31 3.14 1.17a10.9 10.9 0 0 1 5.72 0c2.18-1.48 3.14-1.17 3.14-1.17.62 1.57.23 2.73.12 3.02.73.8 1.17 1.82 1.17 3.07 0 4.4-2.67 5.36-5.22 5.65.41.35.78 1.04.78 2.1v3.13c0 .3.2.66.79.55A11.46 11.46 0 0 0 23.45 12C23.45 5.68 18.32.55 12 .55Z" />
        </svg>
      )}
      {platform === 'youtube' && (
        <svg className="contact-app-icon__glyph" viewBox="0 0 24 24" fill="none">
          <rect x="3.4" y="6.3" width="17.2" height="11.4" rx="3.8" fill="currentColor" />
          <path d="m10.15 9.15 5.1 2.85-5.1 2.85z" fill="#d71920" />
        </svg>
      )}
    </span>
  )
}

export default function ContactSocialShortcuts() {
  return (
    <nav className="contact-shortcuts" aria-label="Social media profiles">
      {socialPlatforms.map((platform) => (
        <a
          className="contact-shortcut"
          key={platform.id}
          href={platform.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${platform.label} (opens in a new tab)`}
        >
          <ContactAppIcon platform={platform.id} />
          <span>{platform.label}</span>
        </a>
      ))}
    </nav>
  )
}
