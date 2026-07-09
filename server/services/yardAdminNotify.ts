/**
 * Yard rep alerts for walk-in / "notify rep" check-ins at the Phoenix gate.
 *
 * Recipients (SMS): Sabrina, Kash, Rodolfo — configured via YARD_ADMIN_PHONES
 *   (comma-separated E.164). Falls back to RODO_PHONE.
 *
 * Push notifications: fan-out to myorganicsoil.com so the Expo iOS app fires
 *   via distributeLeadToReps() on the MOS backend.
 *
 * Email: handled separately by sendAdminArrivalNotification().
 */

import { sendSms } from "./twilioSms.js";

export type YardArrivalDetails = {
  customerName: string;
  customerPhone: string;
  vehicleInfo?: string | null;
  notificationId?: number | null;
};

/** Yard admins who get SMS: Sabrina, Kash, Rodolfo (via env). */
export function getYardAdminPhones(): string[] {
  const raw =
    process.env.YARD_ADMIN_PHONES ||
    process.env.INTAKE_NOTIFY_PHONES ||
    process.env.RODO_PHONE ||
    "";
  return [...new Set(raw.split(",").map((s) => s.trim()).filter(Boolean))];
}

export function formatYardArrivalSms(details: YardArrivalDetails): string {
  const lines = [
    "CUSTOMER AT YARD — needs rep",
    details.customerName,
    details.customerPhone,
  ];
  if (details.vehicleInfo) {
    lines.push(details.vehicleInfo);
  }
  lines.push("", "Congress Processing Plant, 18980 Stanton Rd · go meet them at the scale");
  return lines.join("\n");
}

export async function sendYardArrivalSms(
  details: YardArrivalDetails,
): Promise<{ sent: number; failed: number }> {
  const phones = getYardAdminPhones();
  if (!phones.length) {
    console.warn("[yardAdminNotify] No YARD_ADMIN_PHONES configured — skipping SMS");
    return { sent: 0, failed: 0 };
  }

  const body = formatYardArrivalSms(details);
  const results = await Promise.all(
    phones.map(async (phone) => {
      const result = await sendSms({ to: phone, body });
      return result.ok;
    }),
  );

  const sent = results.filter(Boolean).length;
  const failed = results.length - sent;
  console.log(`[yardAdminNotify] SMS sent=${sent} failed=${failed} phones=${phones.length}`);
  return { sent, failed };
}

const MOS_LEADS_ENDPOINT =
  process.env.MOS_LEAD_INTAKE_URL || "https://myorganicsoil.com/api/leads";

/** Fire-and-forget: MOS fans out Expo push to yard reps in the iOS app. */
export function forwardYardArrivalToMos(details: YardArrivalDetails): void {
  const secret = process.env.MOS_LEAD_INGEST_SECRET;
  if (!secret) {
    console.warn("[yardAdminNotify] MOS_LEAD_INGEST_SECRET not set — skipping push fan-out");
    return;
  }

  const phoneDigits = details.customerPhone.replace(/\D/g, "").slice(-10);
  const payload = {
    full_name: details.customerName,
    email: `yard+${phoneDigits || "walkin"}@organicsoilwholesale.com`,
    phone: details.customerPhone,
    company: "Yard walk-in",
    message: [
      "Customer at the OSW yard gate — needs a representative.",
      details.vehicleInfo ? `Notes: ${details.vehicleInfo}` : null,
      details.notificationId ? `OSW notification #${details.notificationId}` : null,
    ]
      .filter(Boolean)
      .join(" "),
    source: "osw_yard_walkin",
    source_url: "https://organicsoilwholesale.com/qr",
    source_data: {
      notification_id: details.notificationId ?? null,
      vehicle_info: details.vehicleInfo ?? null,
    },
  };

  fetch(MOS_LEADS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Lead-Source-Key": secret,
    },
    body: JSON.stringify(payload),
  })
    .then(async (res) => {
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error(`[yardAdminNotify] MOS push fan-out → ${res.status}: ${text.slice(0, 200)}`);
      } else {
        console.log("[yardAdminNotify] MOS push fan-out → OK");
      }
    })
    .catch((err) => {
      console.error("[yardAdminNotify] MOS push fan-out network error:", err?.message || err);
    });
}

/** SMS + MOS push. Email is sent by the caller. */
export async function notifyYardTeamOfArrival(
  details: YardArrivalDetails,
): Promise<{ sms: { sent: number; failed: number } }> {
  forwardYardArrivalToMos(details);
  const sms = await sendYardArrivalSms(details);
  return { sms };
}
