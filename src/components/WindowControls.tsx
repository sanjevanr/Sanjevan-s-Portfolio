import type { Ref } from 'react'

type WindowControlsProps = {
  title: string
  canMaximise: boolean
  canMinimise: boolean
  expanded?: boolean
  maximiseIndicatorOnly?: boolean
  maximiseRef?: Ref<HTMLButtonElement>
  onMaximise: () => void
  onMinimise: () => void
}

export default function WindowControls({
  title,
  canMaximise,
  canMinimise,
  expanded = false,
  maximiseIndicatorOnly = false,
  maximiseRef,
  onMaximise,
  onMinimise,
}: WindowControlsProps) {
  const panelName = title.toLowerCase()

  return (
    <div className="window-controls" role="group" aria-label={`${title} window controls`}>
      <button
        className="window-control window-control--close"
        type="button"
        aria-label={`Close ${panelName} panel`}
        title={`Close ${panelName} panel`}
        disabled={!canMinimise}
        onClick={onMinimise}
      />
      {maximiseIndicatorOnly && !canMaximise ? (
        <span className="window-control window-control--maximise window-control--indicator" aria-hidden="true" />
      ) : (
        <button
          ref={maximiseRef}
          className="window-control window-control--maximise"
          type="button"
          aria-label={`${expanded ? 'Restore' : 'Maximise'} ${panelName} panel`}
          title={`${expanded ? 'Restore' : 'Maximise'} ${panelName} panel`}
          disabled={!canMaximise}
          onClick={onMaximise}
        />
      )}
    </div>
  )
}
