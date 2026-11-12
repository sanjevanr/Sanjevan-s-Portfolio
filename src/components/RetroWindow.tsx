import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import WindowControls from './WindowControls'

type RetroWindowProps = {
  title: string
  children: ReactNode
  canMaximise?: boolean
  canMinimise?: boolean
  className?: string
}

export default function RetroWindow({
  title,
  children,
  canMaximise = true,
  canMinimise = true,
  className = '',
}: RetroWindowProps) {
  const [isMinimised, setIsMinimised] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const maximiseButtonRef = useRef<HTMLButtonElement>(null)
  const restoreButtonRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const classes = `retro-window ${className}`.trim()

  useEffect(() => {
    if (isMinimised) restoreButtonRef.current?.focus()
  }, [isMinimised])

  const toggleDialog = () => {
    const dialog = dialogRef.current
    if (!dialog || !canMaximise) return
    if (dialog.open) {
      dialog.close()
      return
    }
    dialog.showModal()
  }

  const closeDialog = () => dialogRef.current?.close()

  return (
    <>
      {isMinimised ? (
        <button
          ref={restoreButtonRef}
          className="retro-window__restore"
          type="button"
          aria-label={`Restore ${title.toLowerCase()} panel`}
          onClick={() => {
            setIsMinimised(false)
            window.requestAnimationFrame(() => maximiseButtonRef.current?.focus())
          }}
        >
          <span className="retro-window__restore-dot" aria-hidden="true" />
          Restore {title}
        </button>
      ) : (
        <section className={classes} aria-labelledby={`${titleId}-heading`}>
          <header className="retro-window__titlebar">
            <WindowControls
              title={title}
              canMaximise={canMaximise}
              canMinimise={canMinimise}
              maximiseRef={maximiseButtonRef}
              onMaximise={toggleDialog}
              onMinimise={() => setIsMinimised(true)}
            />
            <h2 id={`${titleId}-heading`} className="retro-window__title">{title}</h2>
            {title.toLowerCase() === 'introduction' && (
              <span className="retro-window__hint">green button to expand</span>
            )}
          </header>
          <div className="retro-window__body">{children}</div>
        </section>
      )}

      <dialog
        ref={dialogRef}
        className={`retro-window__dialog ${className}`.trim()}
        aria-labelledby={`${titleId}-dialog-heading`}
        onClose={() => {
          if (maximiseButtonRef.current?.isConnected) maximiseButtonRef.current.focus()
        }}
      >
        <header className="retro-window__titlebar retro-window__titlebar--dialog">
          <WindowControls
            title={title}
            canMaximise={canMaximise}
            canMinimise={canMinimise}
            expanded
            onMaximise={closeDialog}
            onMinimise={closeDialog}
          />
          <h2 id={`${titleId}-dialog-heading`} className="retro-window__title">{title}</h2>
        </header>
        <div className="retro-window__dialog-body">{children}</div>
      </dialog>
    </>
  )
}
