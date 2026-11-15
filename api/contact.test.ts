import { describe, expect, it } from 'vitest'
import { escapeHtml, validateSubmission } from './contact'

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
