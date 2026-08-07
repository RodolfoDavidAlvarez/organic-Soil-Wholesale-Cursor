const VALID_SESSION_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const CHECKOUT_ALERT_TO = process.env.CHECKOUT_ALERT_TO || 'developer@bettersystems.ai';

export const CHECKOUT_EVENT_STATE = {
  checkout_entered: { status: 'active', stage: 'checkout_entered' },
  fulfillment: { status: 'active', stage: 'fulfillment' },
  timing: { status: 'active', stage: 'timing' },
  customer: { status: 'active', stage: 'customer' },
  review: { status: 'active', stage: 'review' },
  payment_requested: { status: 'payment_pending', stage: 'payment_requested' },
  stripe_redirect: { status: 'redirected', stage: 'stripe_redirect' },
  stripe_canceled: { status: 'canceled', stage: 'stripe_canceled' },
  checkout_error: { status: 'failed', stage: 'checkout_error' },
  payment_failed: { status: 'failed', stage: 'payment_failed' },
  payment_completed: { status: 'completed', stage: 'payment_completed' },
};

export function isCheckoutMonitorSessionId(value) {
  return typeof value === 'string' && VALID_SESSION_ID.test(value);
}

function cleanMessage(value, max = 300) {
  return typeof value === 'string' ? value.trim().slice(0, max) : null;
}

export async function recordCheckoutEvent(db, input) {
  if (!isCheckoutMonitorSessionId(input?.sessionId)) {
    throw new Error('Invalid checkout monitor session');
  }
  const state = CHECKOUT_EVENT_STATE[input.event];
  if (!state) throw new Error('Invalid checkout monitor event');

  const now = new Date().toISOString();
  const patch = {
    status: state.status,
    stage: state.stage,
    last_seen_at: now,
    updated_at: now,
  };
  if (input.fulfillment === 'pickup' || input.fulfillment === 'delivery') {
    patch.fulfillment_type = input.fulfillment;
  }
  if (Number.isFinite(Number(input.itemCount))) patch.item_count = Math.min(1000, Math.max(0, Math.round(Number(input.itemCount))));
  if (Number.isFinite(Number(input.cartValue))) patch.cart_value = Math.min(10000000, Math.max(0, Number(input.cartValue)));
  if (Number.isInteger(Number(input.orderId)) && Number(input.orderId) > 0) patch.order_id = Number(input.orderId);
  if (cleanMessage(input.stripeSessionId, 255)) patch.stripe_checkout_session_id = cleanMessage(input.stripeSessionId, 255);
  if (cleanMessage(input.errorCode, 80)) patch.error_code = cleanMessage(input.errorCode, 80);
  if (cleanMessage(input.errorMessage)) patch.error_message = cleanMessage(input.errorMessage);
  if (state.status === 'completed') patch.completed_at = now;

  const { data: updated, error: updateError } = await db
    .from('checkout_monitor_sessions')
    .update(patch)
    .eq('session_id', input.sessionId)
    .select('*')
    .maybeSingle();
  if (updateError) throw updateError;
  if (updated) return updated;

  const { data: inserted, error: insertError } = await db
    .from('checkout_monitor_sessions')
    .insert({ session_id: input.sessionId, ...patch, entered_at: now, created_at: now })
    .select('*')
    .single();
  if (insertError?.code === '23505') {
    return recordCheckoutEvent(db, input);
  }
  if (insertError) throw insertError;
  return inserted;
}

export async function sendCheckoutAlert(resendClient, {
  subject,
  heading,
  sessionId,
  stage,
  orderId,
  fulfillment,
  itemCount,
  cartValue,
  message,
}) {
  const safe = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
  const result = await resendClient.emails.send({
    from: process.env.CHECKOUT_ALERT_FROM || 'OSW Alerts <info@soilseedandwater.com>',
    replyTo: 'developer@bettersystems.ai',
    to: [CHECKOUT_ALERT_TO],
    subject: `[OSW checkout] ${subject}`,
    html: `<h2>${safe(heading)}</h2>
      <p><strong>Stage:</strong> ${safe(stage || 'unknown')}<br>
      <strong>Order:</strong> ${safe(orderId || 'not created')}<br>
      <strong>Fulfillment:</strong> ${safe(fulfillment || 'not selected')}<br>
      <strong>Cart:</strong> ${safe(itemCount || 0)} item(s), $${safe(Number(cartValue || 0).toFixed(2))}<br>
      <strong>Monitor ID:</strong> ${safe(sessionId || 'unknown')}</p>
      ${message ? `<p><strong>Details:</strong> ${safe(message)}</p>` : ''}
      <p>No IP address, browser fingerprint, email, phone, or address was collected by this monitor.</p>`,
  });
  if (result?.error) throw new Error(result.error.message || 'Checkout alert email failed');
  return result?.data?.id || null;
}
