/**
 * Fire-and-forget forwarder: every paid pickup order on OSW is POSTed to the
 * MyOrganicSoil sales platform so yard reps (Sabrina, Kash) get a push
 * notification with the full purchase detail.
 *
 * MOS endpoint:  POST https://myorganicsoil.com/api/pickup-orders
 * Auth header:   X-Lead-Source-Key: <MOS_LEAD_INGEST_SECRET> (same secret as leads)
 *
 * Failures are logged but never bubble up — OSW's own DB insert + customer
 * confirmation email are the source of truth; MOS is just a fan-out target.
 *
 * Until Phase B (MOS pickup ingestion endpoint), this will 404. The error log
 * is the queue — Phase B will replay any orders we missed.
 */

export interface MosPickupOrderItem {
  product_id: number;
  product_name: string;
  size_option: string;
  quantity: number;
  unit_price_cents: number;
  total_price_cents: number;
}

export interface MosPickupOrderPayload {
  osw_order_id: number;
  osw_order_number?: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  items: MosPickupOrderItem[];
  pickup_at: string; // ISO 8601
  slot_label?: string;
  total_cents: number;
  payment_status: 'paid';
  source: 'osw_pay_pickup';
}

const MOS_PICKUP_ENDPOINT =
  process.env.MOS_PICKUP_INGEST_URL || 'https://myorganicsoil.com/api/pickup-orders';

export function forwardPickupOrderToMos(payload: MosPickupOrderPayload): void {
  const secret = process.env.MOS_LEAD_INGEST_SECRET;
  if (!secret) {
    console.warn('[mos-pickup-forward] MOS_LEAD_INGEST_SECRET not set — skipping');
    return;
  }

  if (!payload.customer_name || !payload.customer_phone || !payload.items?.length) {
    console.warn('[mos-pickup-forward] missing required fields — skipping');
    return;
  }

  // Fire-and-forget. Do not await.
  fetch(MOS_PICKUP_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Lead-Source-Key': secret,
    },
    body: JSON.stringify(payload),
  })
    .then(async (res) => {
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.error(
          `[mos-pickup-forward] order ${payload.osw_order_id} → ${res.status}: ${text.slice(0, 200)}`
        );
      } else {
        console.log(`[mos-pickup-forward] order ${payload.osw_order_id} → OK`);
      }
    })
    .catch((err) => {
      console.error('[mos-pickup-forward] network error:', err?.message || err);
    });
}
