import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Resend } from 'resend'

const limits = new Map<string, number[]>()
const windowMs = 10 * 60 * 1000
const maxRequests = 5
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const config = { api: { bodyParser: { sizeLimit: '12kb' } } }

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] ?? character)
}

export function validateSubmission(body: unknown) {
  const values = body && typeof body === 'object' ? body as Record<string, unknown> : {}
  const name = typeof values.name === 'string' ? values.name.trim() : ''
  const email = typeof values.email === 'string' ? values.email.trim() : ''
  const message = typeof values.message === 'string' ? values.message : ''

  if (!name || name.length > 120 || /[\r\n\u0000-\u001f\u007f]/.test(name)) return { error: 'Enter a valid name (up to 120 characters).' } as const
  if (!email || email.length > 254 || !emailPattern.test(email)) return { error: 'Enter a valid email address.' } as const
  if (!message.trim() || message.length > 5000) return { error: 'Enter a message of up to 5000 characters.' } as const
  return { name, email, message } as const
}

function isValidFromAddress(value: string) {
  const match = value.match(/^(?:[^<>]*<)?([^<>\s]+@[^<>\s]+)>?$/)
  return Boolean(match && emailPattern.test(match[1]))
}

function isRateLimited(key: string, now = Date.now()) {
  const recent = (limits.get(key) ?? []).filter((timestamp) => now - timestamp < windowMs)
  if (recent.length >= maxRequests) {
    limits.set(key, recent)
    return true
  }
  // Vercel functions can reuse a warm instance, so this is a small best-effort
  // per-instance limit in addition to the honeypot; it does not require a store.
  recent.push(now)
  limits.set(key, recent)
  if (limits.size > 1000) {
    for (const [ip, timestamps] of limits) {
      if (!timestamps.some((timestamp) => now - timestamp < windowMs)) limits.delete(ip)
    }
  }
  return false
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  response.setHeader('Cache-Control', 'no-store')
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return response.status(405).json({ success: false, error: 'Use POST to send a message.' })
  }

  const forwardedFor = request.headers['x-forwarded-for']
  const clientIp = (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor)?.split(',')[0]?.trim() || 'unknown'
  if (isRateLimited(clientIp)) {
    return response.status(429).json({ success: false, error: 'Too many messages. Please try again later.' })
  }

  const body = request.body && typeof request.body === 'object' ? request.body as Record<string, unknown> : {}
  if (typeof body.website === 'string' && body.website.trim()) {
    return response.status(400).json({ success: false, error: 'This message could not be accepted.' })
  }

  const submission = validateSubmission(body)
  if ('error' in submission) return response.status(400).json({ success: false, error: submission.error })
  const { name, email, message } = submission

  const apiKey = process.env.RESEND_API_KEY
  const recipient = process.env.CONTACT_TO_EMAIL
  const sender = process.env.CONTACT_FROM_EMAIL
  if (!apiKey || !recipient || !sender || !emailPattern.test(recipient) || !isValidFromAddress(sender)) {
    return response.status(503).json({ success: false, error: 'Contact email is not configured yet. Please try again later.' })
  }

  const escapedName = escapeHtml(name)
  const escapedEmail = escapeHtml(email)
  const escapedMessage = escapeHtml(message)
  try {
    const resend = new Resend(apiKey)
    const { data, error } = await resend.emails.send({
      from: sender,
      to: recipient,
      replyTo: email,
      subject: `Portfolio Contact — ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}\n\nSource: Portfolio Website`,
      html: `<main style="font-family:Arial,sans-serif;color:#1e2930;line-height:1.6"><h2>Portfolio contact message</h2><p><strong>Name:</strong> ${escapedName}</p><p><strong>Email:</strong> ${escapedEmail}</p><hr><p style="white-space:pre-wrap">${escapedMessage}</p><p style="color:#64727a;font-size:12px">Source: Portfolio Website</p></main>`,
    })
    if (error || !data?.id) {
      return response.status(502).json({ success: false, error: 'Your message could not be sent. Please try again later.' })
    }
    return response.status(200).json({ success: true })
  } catch {
    return response.status(502).json({ success: false, error: 'Your message could not be sent. Please try again later.' })
  }
}
