/**
 * Dedicated Resend webhook — raw body + Svix signature verification.
 * Canonical production URL: https://www.organicsoilwholesale.com/api/resend/webhook
 */

import { createClient } from '@supabase/supabase-js'
import { handleResendNewsletterWebhook } from '../../shared/newsletterEngagement.js'
import {
  readRawBody,
  verifyResendWebhookSignature,
} from '../../shared/resendWebhookVerify.js'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, svix-id, svix-timestamp, svix-signature')
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const rawBody = await readRawBody(req)
    const secret = process.env.RESEND_WEBHOOK_SECRET

    if (secret) {
      const verified = verifyResendWebhookSignature(rawBody, req.headers, secret)
      if (!verified.ok) {
        console.error('[Resend Webhook] signature failed:', verified.reason)
        return res.status(401).json({ error: 'Invalid signature', reason: verified.reason })
      }
    } else {
      console.warn('[Resend Webhook] RESEND_WEBHOOK_SECRET unset — accepting unsigned payload')
    }

    let event
    try {
      event = JSON.parse(rawBody || '{}')
    } catch {
      return res.status(400).json({ error: 'Invalid JSON' })
    }

    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      console.error('[Resend Webhook] Supabase env missing')
      return res.status(500).json({ error: 'Server misconfigured' })
    }

    const db = createClient(url, key)
    const result = await handleResendNewsletterWebhook(db, event)
    return res.status(200).json({ received: true, ...result })
  } catch (error) {
    console.error('[Resend Webhook] processing error:', error?.message || error)
    // Non-2xx so Resend retries
    return res.status(500).json({ received: false, error: 'Processing error' })
  }
}
