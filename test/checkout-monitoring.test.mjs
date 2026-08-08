import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CHECKOUT_ABANDONMENT_STATUSES,
  CHECKOUT_EVENT_STATE,
  buildCheckoutAlertHtml,
  checkoutAlertFollowUpFromOrder,
  shouldAlertUnmatchedInput,
} from '../shared/checkoutMonitoring.js';

test('abandonment digest excludes failures that already receive immediate alerts', () => {
  assert.deepEqual(CHECKOUT_ABANDONMENT_STATUSES, ['active', 'payment_pending', 'redirected']);
  assert.equal(CHECKOUT_EVENT_STATE.checkout_error.status, 'failed');
  assert.equal(CHECKOUT_EVENT_STATE.payment_failed.status, 'failed');
  assert.equal(CHECKOUT_ABANDONMENT_STATUSES.includes('failed'), false);
});

test('known GraphQL scanner probes do not trigger customer-input alerts', () => {
  assert.equal(shouldAlertUnmatchedInput('/api/graphql', 'POST'), false);
  assert.equal(shouldAlertUnmatchedInput('/api/leads/submiit', 'POST'), true);
  assert.equal(shouldAlertUnmatchedInput('/api/leads/submiit', 'GET'), false);
});

test('order enrichment returns only bounded follow-up fields', () => {
  const followUp = checkoutAlertFollowUpFromOrder({
    customer_name: 'Test Customer',
    customer_email: 'test@example.com',
    email: 'fallback@example.com',
    phone: '623-555-0100',
    pickup_scheduled_at: '2026-08-08T18:56:02.670Z',
    pickup_location: 'Phoenix yard',
    delivery_address: 'must not be copied',
    stripe_payment_intent_id: 'must not be copied',
    card_number: 'must not be copied',
  });

  assert.deepEqual(followUp, {
    customerName: 'Test Customer',
    customerEmail: 'test@example.com',
    customerPhone: '623-555-0100',
    pickupScheduledAt: '2026-08-08T18:56:02.670Z',
    pickupLocation: 'Phoenix yard',
  });
});

test('payment alert wording is explicit and follow-up data stays privacy-minimal', () => {
  const html = buildCheckoutAlertHtml({
    heading: 'Customer payment declined — no charge, no fulfillment',
    stage: 'payment_failed',
    orderId: 85,
    fulfillment: 'pickup',
    itemCount: 2,
    cartValue: 40.08,
    message: 'The payment failed. The website and checkout remained available.',
    customerName: 'Test <Customer>',
    customerEmail: 'test@example.com',
    customerPhone: '623-555-0100',
    pickupScheduledAt: '2026-08-08T18:56:02.670Z',
    pickupLocation: 'Phoenix yard',
    deliveryAddress: 'must never render',
    cardNumber: '4242 4242 4242 4242',
    stripeSecret: 'must never render',
  });

  assert.match(html, /Customer payment declined — no charge, no fulfillment/);
  assert.match(html, /The website and checkout remained available/);
  assert.match(html, /Test &lt;Customer&gt;/);
  assert.match(html, /test@example\.com/);
  assert.match(html, /623-555-0100/);
  assert.match(html, /Phoenix yard/);
  assert.doesNotMatch(html, /must never render|4242 4242|deliveryAddress|cardNumber|stripeSecret/);
  assert.match(html, /No IP address, browser fingerprint, card data, Stripe secret, billing address, or delivery address is included/);
});
