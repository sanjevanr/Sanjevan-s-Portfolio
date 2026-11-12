import { useEffect, useRef, useState, type MouseEvent } from 'react'

export default function useWindowController() {
  const [isMinimised, setIsMinimised] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const maximiseButtonRef = useRef<HTMLButtonElement>(null)
  const restoreButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (isMinimised) restoreButtonRef.current?.focus()
  }, [isMinimised])

  const openDialog = () => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }

  const closeDialog = () => dialogRef.current?.close()
  const minimise = () => setIsMinimised(true)
  const restore = () => {
    setIsMinimised(false)
    window.requestAnimationFrame(() => maximiseButtonRef.current?.focus())
  }

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
  }
}
