import crypto from 'node:crypto';
import Stripe from 'stripe';

export const config = { api: { bodyParser: false } };

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function requestOrigin(req) {
  const forwardedHost = String(req.headers['x-forwarded-host'] || '').split(',')[0].trim();
  const host = forwardedHost || req.headers.host || 'organicsoilwholesale.com';
  const forwardedProto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  return `${forwardedProto || 'https'}://${host}`;
}

export default async function handler(req, res) {
  const startedAt = Date.now();
  const requestId = req.headers['x-vercel-id'] || crypto.randomUUID();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers['stripe-signature'];
  if (!stripeKey || !webhookSecret) {
    console.error(JSON.stringify({ event: 'stripe_webhook_misconfigured', requestId }));
    return res.status(503).json({ error: 'Stripe webhook is not configured' });
  }
  if (!signature) return res.status(400).json({ error: 'Missing Stripe-Signature header' });

  try {
    const rawBody = await readRawBody(req);
    const stripe = new Stripe(stripeKey, { httpClient: Stripe.createFetchHttpClient() });
    const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    const verifiedBody = JSON.stringify(event);
    const internalSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(verifiedBody)
      .digest('hex');

    const response = await fetch(`${requestOrigin(req)}/api/stripe/process-verified-event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-OSW-Internal-Signature': internalSignature,
        'X-OSW-Webhook-Request-Id': String(requestId),
      },
      body: verifiedBody,
    });
    const responseText = await response.text();
    if (!response.ok) {
      throw new Error(`Verified event processor returned ${response.status}: ${responseText.slice(0, 300)}`);
    }

    console.log(JSON.stringify({
      event: 'stripe_webhook_processed',
      requestId,
      stripeEventId: event.id,
      stripeEventType: event.type,
      durationMs: Date.now() - startedAt,
    }));
    return res.status(200).json({ received: true });
  } catch (error) {
    const signatureFailure = error?.type === 'StripeSignatureVerificationError';
    console.error(JSON.stringify({
      event: signatureFailure ? 'stripe_webhook_signature_rejected' : 'stripe_webhook_processing_failed',
      requestId,
      message: error?.message || String(error),
      durationMs: Date.now() - startedAt,
    }));
    return res.status(signatureFailure ? 400 : 500).json({
      error: signatureFailure ? 'Invalid Stripe signature' : 'Webhook processing failed',
    });
  }
}
