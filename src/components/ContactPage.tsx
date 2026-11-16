import { useState, type ChangeEvent, type FormEvent } from 'react'
import RetroWindow from './RetroWindow'
import ContactSocialShortcuts from './ContactSocialShortcuts'

type SubmitState = 'idle' | 'sending' | 'success' | 'error'
type ContactFields = { name: string; email: string; message: string }

const maxNameLength = 120
const maxMessageLength = 5000
const emptyFields: ContactFields = { name: '', email: '', message: '' }

export default function ContactPage() {
  const [state, setState] = useState<SubmitState>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  // Kept here so typed text survives moving between the window and its maximised dialog.
  const [fields, setFields] = useState<ContactFields>(emptyFields)

  const updateField = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.currentTarget
    setFields((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    if (!form.reportValidity()) return

    const formData = new FormData(form)
    setState('sending')
    setErrorMessage('')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          email: formData.get('email'),
          message: formData.get('message'),
          website: formData.get('website'),
        }),
      })
      const result: { success?: boolean; error?: string } = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Your message could not be sent. Please try again.')
      }
      form.reset()
      setFields(emptyFields)
      setState('success')
    } catch (error) {
      setState('error')
      setErrorMessage(error instanceof Error ? error.message : 'Your message could not be sent. Please try again.')
    }
  }

  return (
    <main className="page-shell page-shell--contact">
      <div className="contact-collage">
        <RetroWindow
          title="Contact"
          accessibleLabel="Contact form"
          className="contact-window"
          singleContentMount
          disableCloseControl
          expandedCloseWithRedButton
        >
          <div className="contact-panel">
            <h2 className="contact-panel__title">Contact</h2>

            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="contact-form__field">
                <label htmlFor="contact-name">NAME</label>
                <input id="contact-name" name="name" type="text" autoComplete="name" maxLength={maxNameLength} required disabled={state === 'sending'} value={fields.name} onChange={updateField} />
              </div>
              <div className="contact-form__field">
                <label htmlFor="contact-email">EMAIL</label>
                <input id="contact-email" name="email" type="email" autoComplete="email" maxLength={254} required disabled={state === 'sending'} value={fields.email} onChange={updateField} />
              </div>
              <div className="contact-form__field">
                <label htmlFor="contact-message">MESSAGE</label>
                <textarea id="contact-message" name="message" rows={5} maxLength={maxMessageLength} required disabled={state === 'sending'} value={fields.message} onChange={updateField} />
              </div>
              <div className="contact-form__trap" aria-hidden="true">
                <label htmlFor="contact-website">Leave this field empty</label>
                <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
              </div>
              <div className="contact-form__actions">
                <p className="contact-form__status" aria-live="polite" role={state === 'error' ? 'alert' : 'status'}>
                  {state === 'success' && 'MESSAGE SENT SUCCESSFULLY ✓'}
                  {state === 'error' && errorMessage}
                  {state === 'sending' && 'SENDING MESSAGE…'}
                </p>
                <button className="contact-form__submit" type="submit" disabled={state === 'sending'}>
                  {state === 'sending' ? 'SENDING…' : 'SEND MESSAGE'} <span aria-hidden="true">↗</span>
                </button>
              </div>
            </form>
          </div>
        </RetroWindow>
        <ContactSocialShortcuts />
      </div>
    </main>
  )
}
