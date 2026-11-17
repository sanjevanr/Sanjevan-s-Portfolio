import type { VercelRequest, VercelResponse } from '@vercel/node'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import handler, { escapeHtml, validateSubmission } from './contact'

const { sendEmail } = vi.hoisted(() => ({ sendEmail: vi.fn() }))

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: sendEmail }
  },
}))

function makeRequest(method: string, body: unknown, ip: string) {
  return { method, body, headers: { 'x-forwarded-for': ip } } as unknown as VercelRequest
}

function makeResponse() {
  const result = { statusCode: 200, body: undefined as unknown, headers: {} as Record<string, string> }
  const response = {
    setHeader: (name: string, value: string) => { result.headers[name] = value; return response },
    status: (statusCode: number) => { result.statusCode = statusCode; return response },
    json: (body: unknown) => { result.body = body; return response },
  }
  return { result, response: response as unknown as VercelResponse }
}

describe('contact submission validation', () => {
  it('trims the name and email while preserving the message body', () => {
    expect(validateSubmission({ name: '  Alex  ', email: ' alex@example.com ', message: ' Hello\nthere  ' })).toEqual({
      name: 'Alex',
      email: 'alex@example.com',
      message: ' Hello\nthere  ',
    })
  })

  it('rejects empty, malformed, oversized, and header-injection values', () => {
    expect(validateSubmission({ name: '', email: 'alex@example.com', message: 'hello' })).toHaveProperty('error')
    expect(validateSubmission({ name: 'Alex', email: 'bad-address', message: 'hello' })).toHaveProperty('error')
    expect(validateSubmission({ name: 'Alex\nBcc: victim@example.com', email: 'alex@example.com', message: 'hello' })).toHaveProperty('error')
    expect(validateSubmission({ name: 'Alex', email: 'alex@example.com', message: 'x'.repeat(5001) })).toHaveProperty('error')
  })

  it('escapes content before it is inserted into the HTML email', () => {
    expect(escapeHtml(`<script a="b">it's & done</script>`)).toBe('&lt;script a=&quot;b&quot;&gt;it&#39;s &amp; done&lt;/script&gt;')
  })
})

describe('contact API handler', () => {
  beforeEach(() => {
    vi.stubEnv('RESEND_API_KEY', 'test-key')
    vi.stubEnv('CONTACT_TO_EMAIL', 'sanjevanr.10@gmail.com')
    vi.stubEnv('CONTACT_FROM_EMAIL', 'contact@sanjevanrajasegar.com')
    sendEmail.mockReset().mockResolvedValue({ data: { id: 'email_123' }, error: null })
  })

  afterEach(() => vi.unstubAllEnvs())

  it('returns JSON 405 for non-POST requests', async () => {
    const { result, response } = makeResponse()
    await handler(makeRequest('GET', {}, 'test-get'), response)
    expect(result.statusCode).toBe(405)
    expect(result.body).toEqual({ success: false, error: 'Use POST to send a message.' })
    expect(result.headers.Allow).toBe('POST')
  })

  it('returns JSON validation errors without calling Resend', async () => {
    const { result, response } = makeResponse()
    await handler(makeRequest('POST', { name: '', email: 'bad', message: '' }, 'test-invalid'), response)
    expect(result.statusCode).toBe(400)
    expect(result.body).toMatchObject({ success: false, error: expect.any(String) })
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('only reports success after Resend returns an accepted message id', async () => {
    const { result, response } = makeResponse()
    await handler(makeRequest('POST', { name: 'Alex', email: 'alex@example.com', message: 'Hello' }, 'test-valid'), response)
    expect(result.statusCode).toBe(200)
    expect(result.body).toEqual({ success: true })
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
      from: 'contact@sanjevanrajasegar.com',
      to: 'sanjevanr.10@gmail.com',
      replyTo: 'alex@example.com',
    }))
  })

  it('returns JSON 502 when Resend rejects or does not accept the email', async () => {
    sendEmail.mockResolvedValue({ data: null, error: { message: 'Provider failure' } })
    const { result, response } = makeResponse()
    await handler(makeRequest('POST', { name: 'Alex', email: 'alex@example.com', message: 'Hello' }, 'test-provider-error'), response)
    expect(result.statusCode).toBe(502)
    expect(result.body).toEqual({ success: false, error: 'Your message could not be sent. Please try again later.' })
  })

  it('does not report a honeypot submission as a successful email', async () => {
    const { result, response } = makeResponse()
    await handler(makeRequest('POST', { name: 'Bot', email: 'bot@example.com', message: 'Hello', website: 'spam' }, 'test-honeypot'), response)
    expect(result.statusCode).toBe(400)
    expect(result.body).toMatchObject({ success: false })
    expect(sendEmail).not.toHaveBeenCalled()
  })
})
