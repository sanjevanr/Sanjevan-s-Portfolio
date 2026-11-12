type Theme = 'light' | 'dark'

type ThemeToggleProps = {
  theme: Theme
  onToggle: () => void
}

export default function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const isDark = theme === 'dark'

  return (
    <div className="theme-toggle-container">
      <button
        className="theme-toggle"
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label="Dark mode"
        onClick={onToggle}
      >
        <span className="theme-toggle__label theme-toggle__label--light" aria-hidden="true">L</span>
        <span className="theme-toggle__label theme-toggle__label--dark" aria-hidden="true">D</span>
        <span className="theme-toggle__knob" aria-hidden="true" />
      </button>
    </div>
  )
}
