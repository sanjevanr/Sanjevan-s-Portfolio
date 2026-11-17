import { useEffect, useState, type ReactNode } from 'react'
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
  disableCloseControl?: boolean
  expandedCloseWithRedButton?: boolean
  expandedCloseAndRestore?: boolean
  controlsDisabled?: boolean
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
  disableCloseControl = false,
  expandedCloseWithRedButton = false,
  expandedCloseAndRestore = false,
  controlsDisabled = false,
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

  useEffect(() => {
    if (controlsDisabled) dialogRef.current?.close()
  }, [controlsDisabled, dialogRef])

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
              closeDisabled={disableCloseControl}
              disabled={controlsDisabled}
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
          onClose={(event) => {
            // React forwards close events from portalled child dialogs (the media viewer) up the tree.
            if (event.target === event.currentTarget) handleWindowDialogClose()
          }}
          onClick={handleDialogClick}
        >
          <header className="retro-window__titlebar retro-window__titlebar--dialog">
            <WindowControls
              title={title}
              expanded
              showMaximise={!expandedCloseWithRedButton || expandedCloseAndRestore}
              onMaximise={closeDialog}
              onClose={closeDialog}
              closeLabel={`Close expanded ${title.replace(/\.exe$/i, '')} window`}
            />
            {showTitle && <h2 className="retro-window__title">{title}</h2>}
          </header>
          {(!singleContentMount || dialogIsOpen) && <div className="retro-window__dialog-body">{children}</div>}
        </dialog>
      )}
    </>
  )
}
