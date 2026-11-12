import type { Ref } from 'react'
import WindowControls from './WindowControls'
import useWindowController from '../hooks/useWindowController'

type PhotoFrameProps = {
  expanded?: boolean
  maximiseButtonRef?: Ref<HTMLButtonElement>
  onMaximise: () => void
  onMinimise: () => void
}

function PhotoFrame({ expanded = false, maximiseButtonRef, onMaximise, onMinimise }: PhotoFrameProps) {
  return (
    <figure className={`photo-frame ${expanded ? 'photo-frame--expanded' : 'photo-frame--standalone'}`}>
      <div className="photo-frame__inner">
        <span className="photo-cross photo-cross--top" aria-hidden="true">+</span>
        <img className="featured-photo" src="/home-page-featured-photo.png" alt="Sanjevan holding a camera for a self-portrait" />
        <span className="photo-cross photo-cross--bottom" aria-hidden="true">+</span>
      </div>
      <div className="photo-frame__controls">
        <WindowControls
          title="Photo"
          canMaximise
          canMinimise
          expanded={expanded}
          maximiseRef={maximiseButtonRef}
          onMaximise={onMaximise}
          onMinimise={onMinimise}
        />
      </div>
    </figure>
  )
}

export default function PhotoPanel() {
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

  return (
    <>
      {isMinimised ? (
        <button ref={restoreButtonRef} className="retro-window__restore" type="button" aria-label="Restore photo panel" onClick={restore}>
          <span className="retro-window__restore-dot" aria-hidden="true" />
          Restore photo
        </button>
      ) : (
        <PhotoFrame maximiseButtonRef={maximiseButtonRef} onMaximise={openDialog} onMinimise={minimise} />
      )}

      <dialog
        ref={dialogRef}
        className="photo-viewer"
        aria-label="Expanded photograph"
        onClose={handleDialogClose}
        onClick={handleDialogClick}
      >
        <PhotoFrame expanded onMaximise={closeDialog} onMinimise={closeDialog} />
      </dialog>
    </>
  )
}
