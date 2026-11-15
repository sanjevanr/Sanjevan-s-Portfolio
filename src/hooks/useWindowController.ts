import { useRef, type MouseEvent } from 'react'

export default function useWindowController() {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const maximiseButtonRef = useRef<HTMLButtonElement>(null)

  const openDialog = () => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }

  const closeDialog = () => dialogRef.current?.close()

  const handleDialogClose = () => {
    if (maximiseButtonRef.current?.isConnected) maximiseButtonRef.current.focus()
  }

  const handleDialogClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target !== event.currentTarget) return
    const rect = event.currentTarget.getBoundingClientRect()
    const clickedOutside = event.clientX < rect.left
      || event.clientX > rect.right
      || event.clientY < rect.top
      || event.clientY > rect.bottom
    if (clickedOutside) event.currentTarget.close()
  }

  return {
    dialogRef,
    maximiseButtonRef,
    openDialog,
    closeDialog,
    handleDialogClose,
    handleDialogClick,
  }
}
