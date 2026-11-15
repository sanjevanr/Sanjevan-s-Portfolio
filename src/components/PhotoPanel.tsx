import type { Ref } from 'react'
import WindowControls from './WindowControls'
import useWindowController from '../hooks/useWindowController'

type PhotoFrameProps = {
  expanded?: boolean
  maximiseButtonRef?: Ref<HTMLButtonElement>
  onMaximise: () => void
}

function PhotoFrame({ expanded = false, maximiseButtonRef, onMaximise }: PhotoFrameProps) {
  return (
    <figure className={`photo-frame ${expanded ? 'photo-frame--expanded' : 'photo-frame--standalone'}`}>
      <div className="photo-frame__inner">
        <span className="photo-cross photo-cross--top" aria-hidden="true">+</span>
        <img className="featured-photo" src="/home-page-featured-photo.png" alt="Sanjevan holding a camera for a self-portrait" />
        <span className="photo-cross photo-cross--bottom" aria-hidden="true">+</span>
      </div>
      <div className="photo-frame__controls">
        <WindowControls title="Photo" expanded={expanded} maximiseRef={maximiseButtonRef} onMaximise={onMaximise} />
      </div>
    </figure>
  )
}

export default function PhotoPanel() {
  const { dialogRef, maximiseButtonRef, openDialog, closeDialog, handleDialogClose, handleDialogClick } = useWindowController()

  return (
    <>
      <PhotoFrame maximiseButtonRef={maximiseButtonRef} onMaximise={openDialog} />
      <dialog
        ref={dialogRef}
        className="photo-viewer"
        aria-label="Expanded photograph"
        onClose={handleDialogClose}
        onClick={handleDialogClick}
      >
        <PhotoFrame expanded onMaximise={closeDialog} />
      </dialog>
    </>
  )
}
