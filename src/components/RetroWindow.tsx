import { useState, type ReactNode } from 'react'
import WindowControls from './WindowControls'
import useWindowController from '../hooks/useWindowController'

type RetroWindowProps = {
  title: string
  children: ReactNode
  canMaximise?: boolean
  className?: string
  accessibleLabel?: string
  showControls?: boolean
  showTitle?: boolean
  singleContentMount?: boolean
}

export default function RetroWindow({
  title,
  children,
  canMaximise = true,
  className = '',
  accessibleLabel = `${title} window`,
  showControls = true,
  showTitle = false,
  singleContentMount = false,
}: RetroWindowProps) {
  const {
    dialogRef,
    maximiseButtonRef,
    openDialog,
    closeDialog,
    handleDialogClose,
    handleDialogClick,
  } = useWindowController()
  const [dialogIsOpen, setDialogIsOpen] = useState(false)
  const classes = `retro-window ${className}`.trim()
  const controlsAreVisible = showControls
  const openWindowDialog = () => {
    openDialog()
    setDialogIsOpen(true)
  }
  const handleWindowDialogClose = () => {
    setDialogIsOpen(false)
    handleDialogClose()
  }

  return (
    <>
      <section className={classes} aria-label={accessibleLabel}>
        <header className="retro-window__titlebar">
          {controlsAreVisible && (
            <WindowControls
              title={title}
              showMaximise={canMaximise}
              maximiseRef={maximiseButtonRef}
              onMaximise={openWindowDialog}
            />
          )}
          {showTitle && <h2 className="retro-window__title">{title}</h2>}
        </header>
        {(!singleContentMount || !dialogIsOpen) && <div className="retro-window__body">{children}</div>}
      </section>

      {canMaximise && (
        <dialog
          ref={dialogRef}
          className={`retro-window__dialog ${className}`.trim()}
          aria-label={`Expanded ${accessibleLabel}`}
          onClose={handleWindowDialogClose}
          onClick={handleDialogClick}
        >
          <header className="retro-window__titlebar retro-window__titlebar--dialog">
            <WindowControls title={title} expanded onMaximise={closeDialog} />
            {showTitle && <h2 className="retro-window__title">{title}</h2>}
          </header>
          {(!singleContentMount || dialogIsOpen) && <div className="retro-window__dialog-body">{children}</div>}
        </dialog>
      )}
    </>
  )
}
