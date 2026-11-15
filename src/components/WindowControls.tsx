import type { Ref } from 'react'

type WindowControlsProps = {
  title: string
  expanded?: boolean
  showMaximise?: boolean
  maximiseRef?: Ref<HTMLButtonElement>
  onMaximise?: () => void
}

export default function WindowControls({
  title,
  expanded = false,
  showMaximise = true,
  maximiseRef,
  onMaximise,
}: WindowControlsProps) {
  const panelName = title.toLowerCase()

  return (
    <div
      className="window-controls"
      {...(showMaximise
        ? { role: 'group' as const, 'aria-label': `${title} window controls` }
        : { 'aria-hidden': true })}
    >
      <span className="window-control window-control--close" aria-hidden="true" />
      {showMaximise && (
        <button
          ref={maximiseRef}
          className="window-control window-control--maximise"
          type="button"
          aria-label={`${expanded ? 'Restore' : 'Maximise'} ${panelName} panel`}
          title={`${expanded ? 'Restore' : 'Maximise'} ${panelName} panel`}
          onClick={onMaximise}
        />
      )}
    </div>
  )
}
