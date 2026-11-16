import type { Ref } from 'react'
import WindowControls from './WindowControls'
import useWindowController from '../hooks/useWindowController'

type PhotoFrameProps = {
  src: string
  alt: string
  srcSet?: string
  sizes?: string
  width?: number
  height?: number
  className?: string
  expanded?: boolean
  maximiseButtonRef?: Ref<HTMLButtonElement>
  onMaximise: () => void
}

function PhotoFrame({ src, alt, srcSet, sizes, width, height, className = '', expanded = false, maximiseButtonRef, onMaximise }: PhotoFrameProps) {
  return (
    <figure className={`photo-frame ${expanded ? 'photo-frame--expanded' : 'photo-frame--standalone'} ${className}`}>
      <div className="photo-frame__inner">
        <span className="photo-cross photo-cross--top" aria-hidden="true">+</span>
        <img
          className="featured-photo"
          src={src}
          srcSet={srcSet}
          sizes={expanded ? '(max-width: 760px) 86vw, 720px' : sizes}
          width={width}
          height={height}
          alt={alt}
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
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
  srcSet?: string
  sizes?: string
  width?: number
  height?: number
  className?: string
}

export default function PhotoPanel({
  src = '/home-page-featured-photo.webp',
  alt = 'Sanjevan holding a camera for a self-portrait',
  srcSet = '/home-page-featured-photo-640.webp 640w, /home-page-featured-photo.webp 1206w',
  sizes = '(max-width: 760px) 84vw, 390px',
  width = 1206,
  height = 1481,
  className = '',
}: PhotoPanelProps) {
  const { dialogRef, maximiseButtonRef, openDialog, closeDialog, handleDialogClose, handleDialogClick } = useWindowController()

  return (
    <>
      <PhotoFrame src={src} alt={alt} srcSet={srcSet} sizes={sizes} width={width} height={height} className={className} maximiseButtonRef={maximiseButtonRef} onMaximise={openDialog} />
      <dialog
        ref={dialogRef}
        className="photo-viewer"
        aria-label="Expanded photograph"
        onClose={handleDialogClose}
        onClick={handleDialogClick}
      >
        <PhotoFrame src={src} alt={alt} srcSet={srcSet} sizes={sizes} width={width} height={height} className={className} expanded onMaximise={closeDialog} />
      </dialog>
    </>
  )
}
