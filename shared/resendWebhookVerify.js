/** Svix-style signature verification for Resend webhooks (no extra dependency). */

import crypto from 'node:crypto'

/**
 * @param {string} rawBody
 * @param {Record<string, string | string[] | undefined>} headers
 * @param {string | undefined} secret whsec_…
 * @returns {{ ok: true } | { ok: false, reason: string }}
 */
export function verifyResendWebhookSignature(rawBody, headers, secret) {
  const whsec = String(secret || '').trim()
  if (!whsec) return { ok: false, reason: 'missing_secret' }

  const id = header(headers, 'svix-id')
  const timestamp = header(headers, 'svix-timestamp')
  const signatureHeader = header(headers, 'svix-signature')
  if (!id || !timestamp || !signatureHeader) {
    return { ok: false, reason: 'missing_headers' }
  }

  const ts = Number(timestamp)
  if (!Number.isFinite(ts)) return { ok: false, reason: 'bad_timestamp' }
  if (Math.abs(Date.now() / 1000 - ts) > 300) {
    return { ok: false, reason: 'timestamp_skew' }
  }

  let secretBytes
  try {
    secretBytes = Buffer.from(whsec.replace(/^whsec_/, ''), 'base64')
  } catch {
    return { ok: false, reason: 'bad_secret' }
  }

  const signed = `${id}.${timestamp}.${rawBody}`
  const expected = crypto.createHmac('sha256', secretBytes).update(signed, 'utf8').digest('base64')

  const candidates = String(signatureHeader)
    .split(/\s+/)
    .map((part) => part.replace(/^v1,/, '').trim())
    .filter(Boolean)

  for (const candidate of candidates) {
    try {
      const a = Buffer.from(candidate)
      const b = Buffer.from(expected)
      if (a.length === b.length && crypto.timingSafeEqual(a, b)) {
        return { ok: true }
      }
    } catch {
      // continue
    }
  }

  return { ok: false, reason: 'bad_signature' }
}

function header(headers, name) {
  const lower = name.toLowerCase()
  for (const [key, value] of Object.entries(headers || {})) {
    if (String(key).toLowerCase() === lower) {
      return Array.isArray(value) ? value[0] : value
    }
  }
  return undefined
}

export async function readRawBody(req) {
  if (typeof req.rawBody === 'string' && req.rawBody) return req.rawBody
  if (Buffer.isBuffer(req.rawBody)) return req.rawBody.toString('utf8')

  if (typeof req.body === 'string') return req.body
  if (Buffer.isBuffer(req.body)) return req.body.toString('utf8')

  // Prefer stream when bodyParser is disabled
  if (req.readable && !req.readableEnded && req.body === undefined) {
    const chunks = []
    for await (const chunk of req) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
    }
    return Buffer.concat(chunks).toString('utf8')
  }

  // Fallback when framework already parsed JSON (signature may fail — prefer raw route)
  if (req.body && typeof req.body === 'object') {
    return JSON.stringify(req.body)
  }

  return ''
}
