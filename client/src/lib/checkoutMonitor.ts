export type CheckoutMonitorEvent =
  | "checkout_entered"
  | "fulfillment"
  | "timing"
  | "customer"
  | "review"
  | "payment_requested"
  | "stripe_redirect"
  | "stripe_canceled"
  | "checkout_error"
  | "payment_failed"
  | "payment_completed";

const STORAGE_KEY = "osw-checkout-monitor-id";

export function getCheckoutMonitorId(): string {
  const existing = sessionStorage.getItem(STORAGE_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  sessionStorage.setItem(STORAGE_KEY, id);
  return id;
}

export function recordCheckoutMonitorEvent(
  event: CheckoutMonitorEvent,
  details: Record<string, unknown> = {},
) {
  const sessionId = getCheckoutMonitorId();
  fetch("/api/checkout/monitor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, event, ...details }),
    keepalive: true,
  }).catch(() => {});
  return sessionId;
}
