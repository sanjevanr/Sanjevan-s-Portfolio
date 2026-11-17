export const entryStorageKey = 'portfolio-entered'

let memoryGranted = false

function storedGrant(): boolean {
  try {
    return window.sessionStorage.getItem(entryStorageKey) === '1'
  } catch {
    return false
  }
}

/** True once this tab has finished the entry sequence. A failed read counts as not entered. */
export function entryGranted(): boolean {
  if (memoryGranted) return true
  return storedGrant()
}

/** Remember a finished entry for this tab. A failed write still dismisses it until reload. */
export function grantEntry(): void {
  memoryGranted = true
  try {
    window.sessionStorage.setItem(entryStorageKey, '1')
  } catch {
    // The in-memory flag still dismisses the screen for this page load.
  }
}
