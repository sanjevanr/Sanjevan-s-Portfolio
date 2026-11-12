import type { ReactNode } from 'react'
import WindowControls from './WindowControls'
import useWindowController from '../hooks/useWindowController'

type RetroWindowProps = {
  title: string
  children: ReactNode
  canMaximise?: boolean
  canMinimise?: boolean
  className?: string
  accessibleLabel?: string
}

export default function RetroWindow({
  title,
  children,
  canMaximise = true,
  canMinimise = true,
  className = '',
  accessibleLabel = `${title} window`,
}: RetroWindowProps) {
  const {
    isMinimised,
    dialogRef,
    maximiseButtonRef,
    restoreButtonRef,
    openDialog,
    closeDialog,
    minimise,
    restore,
    handleDialogClose,
    handleDialogClick,
  } = useWindowController()
  const classes = `retro-window ${className}`.trim()

  return (
    <>
      {isMinimised ? (
        <button
          ref={restoreButtonRef}
          className="retro-window__restore"
          type="button"
          aria-label={`Restore ${title.toLowerCase()} panel`}
          onClick={restore}
        >
          <span className="retro-window__restore-dot" aria-hidden="true" />
          Restore panel
        </button>
      ) : (
        <section className={classes} aria-label={accessibleLabel}>
          <header className="retro-window__titlebar">
            <WindowControls
              title={title}
              canMaximise={canMaximise}
              canMinimise={canMinimise}
              maximiseRef={maximiseButtonRef}
              onMaximise={openDialog}
              onMinimise={minimise}
            />
          </header>
          <div className="retro-window__body">{children}</div>
        </section>
      )}

      {canMaximise && (
        <dialog
          ref={dialogRef}
          className={`retro-window__dialog ${className}`.trim()}
          aria-label={`Expanded ${accessibleLabel}`}
          onClose={handleDialogClose}
          onClick={handleDialogClick}
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
          </header>
          <div className="retro-window__dialog-body">{children}</div>
        </dialog>
      )}
    </>
  )
}
