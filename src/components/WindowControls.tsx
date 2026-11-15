import type { Ref } from 'react'

type WindowControlsProps = {
  title: string
  expanded?: boolean
  showMaximise?: boolean
  maximiseRef?: Ref<HTMLButtonElement>
  onMaximise?: () => void
  closeDisabled?: boolean
  onClose?: () => void
  closeLabel?: string
  disabled?: boolean
}

export default function WindowControls({
  title,
  expanded = false,
  showMaximise = true,
  maximiseRef,
  onMaximise,
  closeDisabled = false,
  onClose,
  closeLabel,
  disabled = false,
}: WindowControlsProps) {
  const panelName = title.toLowerCase()
  const hasInteractiveControl = showMaximise || closeDisabled || Boolean(onClose)

  return (
    <div
      className={`window-controls${disabled ? ' window-controls--disabled' : ''}`}
      {...(hasInteractiveControl
        ? { role: 'group' as const, 'aria-label': `${title} window controls` }
        : { 'aria-hidden': true })}
    >
      {onClose && !disabled ? (
        <button
          className="window-control window-control--close window-control--close--interactive"
          type="button"
          aria-label={closeLabel ?? `Close ${panelName} window`}
          title={closeLabel ?? `Close ${panelName} window`}
          onClick={onClose}
        />
      ) : closeDisabled || disabled ? (
        <button
          className="window-control window-control--close window-control--close--disabled"
          type="button"
          aria-label={`Close ${panelName} window`}
          title="Unavailable"
          disabled
        />
      ) : (
        <span className="window-control window-control--close" aria-hidden="true" />
      )}
      {showMaximise && (
        <button
          ref={maximiseRef}
          className="window-control window-control--maximise"
          type="button"
          aria-label={`${expanded ? 'Restore' : 'Maximise'} ${panelName} panel`}
          title={disabled ? 'Unavailable' : `${expanded ? 'Restore' : 'Maximise'} ${panelName} panel`}
          disabled={disabled}
          onClick={onMaximise}
        />
      )}
    </div>
  )
}
