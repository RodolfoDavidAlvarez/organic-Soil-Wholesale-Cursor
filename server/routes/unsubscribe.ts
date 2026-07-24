/**
 * Unsubscribe API — sp_customers only (no Airtable).
 */

import { Router } from 'express'
import { supabase } from '../supabaseClient'
import { unsubscribeNewsletterContact } from '../../shared/newsletterEngagement.js'

const router = Router()

interface UnsubscribeRequest {
  email: string
  reason?: string
}

router.post('/', async (req, res) => {
  try {
    const body = (req.body || {}) as UnsubscribeRequest & { 'List-Unsubscribe'?: string }
    const email = body.email || String(req.query.email || '')
    const reason =
      body.reason || (body['List-Unsubscribe'] === 'One-Click' ? 'One-click unsubscribe' : undefined)
    if (!email) return res.status(400).json({ error: 'Email is required' })

    const normalizedEmail = email.toLowerCase().trim()
    console.log('[Unsubscribe] Processing:', normalizedEmail)

    await unsubscribeNewsletterContact(supabase, normalizedEmail, reason)

    res.json({ success: true, message: 'Unsubscribed successfully' })
  } catch (error) {
    console.error('[Unsubscribe] Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/status/:email', async (req, res) => {
  try {
    const email = req.params.email.toLowerCase().trim()

    const { data: customer } = await supabase
      .from('sp_customers')
      .select('newsletter_subscribed, newsletter_unsubscribed_at')
      .ilike('email', email)
      .maybeSingle()

    if (customer) {
      return res.json({
        found: true,
        subscribed: customer.newsletter_subscribed !== false,
        unsubscribedDate: customer.newsletter_unsubscribed_at || null,
        source: 'sp_customers',
      })
    }

    res.json({ found: false })
  } catch (error) {
    console.error('[Unsubscribe] Status check error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
