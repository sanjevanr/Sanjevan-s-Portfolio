import type { Ref } from 'react'
import WindowControls from './WindowControls'
import useWindowController from '../hooks/useWindowController'

type PhotoFrameProps = {
  src: string
  alt: string
  className?: string
  expanded?: boolean
  maximiseButtonRef?: Ref<HTMLButtonElement>
  onMaximise: () => void
}

function PhotoFrame({ src, alt, className = '', expanded = false, maximiseButtonRef, onMaximise }: PhotoFrameProps) {
  return (
    <figure className={`photo-frame ${expanded ? 'photo-frame--expanded' : 'photo-frame--standalone'} ${className}`}>
      <div className="photo-frame__inner">
        <span className="photo-cross photo-cross--top" aria-hidden="true">+</span>
        <img className="featured-photo" src={src} alt={alt} />
        <span className="photo-cross photo-cross--bottom" aria-hidden="true">+</span>
      </div>
      <div className="photo-frame__controls">
        <WindowControls title="Photo" expanded={expanded} maximiseRef={maximiseButtonRef} onMaximise={onMaximise} />
      </div>
    </figure>
  )
}

type PhotoPanelProps = {
  src?: string
  alt?: string
  className?: string
}

export default function PhotoPanel({
  src = '/home-page-featured-photo.png',
  alt = 'Sanjevan holding a camera for a self-portrait',
  className = '',
}: PhotoPanelProps) {
  const { dialogRef, maximiseButtonRef, openDialog, closeDialog, handleDialogClose, handleDialogClick } = useWindowController()

  return (
    <>
      <PhotoFrame src={src} alt={alt} className={className} maximiseButtonRef={maximiseButtonRef} onMaximise={openDialog} />
      <dialog
        ref={dialogRef}
        className="photo-viewer"
        aria-label="Expanded photograph"
        onClose={handleDialogClose}
        onClick={handleDialogClick}
      >
        <PhotoFrame src={src} alt={alt} className={className} expanded onMaximise={closeDialog} />
      </dialog>
    </>
  )
}
