import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { grantEntry } from '../audio/entrySession'
import { useHomeAudio, useMediaQuery } from './HomeAudio'
import '../styles/entry-screen.css'

const reducedMotionQuery = '(prefers-reduced-motion: reduce)'

type EntryScreenProps = {
  fading: boolean
  onComplete: () => void
}

export default function EntryScreen({ fading, onComplete }: EntryScreenProps) {
  const { beginEntryPlayback } = useHomeAudio()
  const reducedMotion = useMediaQuery(reducedMotionQuery)
  const dialogRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const timersRef = useRef<number[]>([])
  const startedRef = useRef(false)
  const [phase, setPhase] = useState<'ready' | 'loading'>('ready')
  const [status, setStatus] = useState('')

  useEffect(() => {
    buttonRef.current?.focus()
  }, [])

  useEffect(() => {
    if (phase === 'loading') dialogRef.current?.focus()
  }, [phase])

  useEffect(() => {
    const root = document.documentElement
    const previous = root.style.overflow
    root.style.overflow = 'hidden'
    return () => {
      root.style.overflow = previous
      for (const timer of timersRef.current) window.clearTimeout(timer)
    }
  }, [])

  function enter() {
    beginEntryPlayback()
    if (startedRef.current) return
    startedRef.current = true
    if (reducedMotion) {
      grantEntry()
      onComplete()
      return
    }
    setPhase('loading')
    setStatus('INITIALISING...')
    timersRef.current = [
      window.setTimeout(() => setStatus('LOADING PORTFOLIO...'), 600),
      window.setTimeout(() => setStatus('WELCOME'), 1400),
      window.setTimeout(() => {
        grantEntry()
        onComplete()
      }, 1750),
    ]
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (phase !== 'ready' || event.target !== dialogRef.current) return
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    enter()
  }

  return (
    <div className={`entry-screen${fading ? ' entry-screen--out' : ''}`}>
      <div
        ref={dialogRef}
        className="entry-screen__window"
        role="dialog"
        aria-modal="true"
        aria-labelledby="entry-welcome"
        aria-busy={phase === 'loading'}
        tabIndex={-1}
        onKeyDown={onKeyDown}
      >
        <div className="entry-screen__titlebar">
          <div className="entry-screen__dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>
        <div className="entry-screen__body">
          <p id="entry-welcome" className="entry-screen__welcome">Welcome to Sanjevan's Portfolio</p>
          <button
            ref={buttonRef}
            className="entry-screen__enter"
            type="button"
            disabled={phase === 'loading'}
            onClick={enter}
          >
            ENTER
          </button>
          {phase === 'loading' && (
            <div className="entry-screen__track" aria-hidden="true">
              <div className="entry-screen__fill" />
            </div>
          )}
          <p className="entry-screen__status" aria-live="polite">{status}</p>
        </div>
      </div>
    </div>
  )
}
