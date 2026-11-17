import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { entryStorageKey } from './entrySession'

function installStorage(options?: { getItem?: () => string | null; setItem?: (key: string, value: string) => void }) {
  const store = new Map<string, string>()
  vi.stubGlobal('window', {
    sessionStorage: {
      getItem: options?.getItem ?? ((key: string) => store.get(key) ?? null),
      setItem: options?.setItem ?? ((key: string, value: string) => { store.set(key, value) }),
    },
  })
  return store
}

async function loadFresh() {
  vi.resetModules()
  return import('./entrySession')
}

beforeEach(() => {
  installStorage()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('entry session', () => {
  it('starts ungranted and records a finished entry for this tab', async () => {
    const { entryGranted, grantEntry } = await loadFresh()
    expect(entryGranted()).toBe(false)
    grantEntry()
    expect(entryGranted()).toBe(true)
    expect(window.sessionStorage.getItem(entryStorageKey)).toBe('1')
  })

  it('reads an existing grant after the module reloads', async () => {
    const first = await loadFresh()
    first.grantEntry()
    const second = await loadFresh()
    expect(second.entryGranted()).toBe(true)
  })

  it('treats a failed read as not entered', async () => {
    installStorage({ getItem: () => { throw new Error('denied') } })
    const { entryGranted } = await loadFresh()
    expect(entryGranted()).toBe(false)
  })

  it('keeps the grant for this page load when writing storage throws', async () => {
    installStorage({ setItem: () => { throw new Error('denied') } })
    const { entryGranted, grantEntry } = await loadFresh()
    grantEntry()
    expect(entryGranted()).toBe(true)
    expect(window.sessionStorage.getItem(entryStorageKey)).toBeNull()
  })
})
