import { CUSTOMER_SUPPORT_PHONE_PLAIN } from "../config/contact.js";

const TWILIO_BASE = "https://api.twilio.com/2010-04-01";

export type SendSmsArgs = {
  to: string;
  body: string;
};

export type SendSmsResult =
  | { ok: true; sid: string }
  | { ok: false; error: string; status?: number };

function normalizePhone(raw: string): string | null {
  if (!raw) return null;
  const digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits.length >= 9 ? digits : null;
  const ten = digits.replace(/\D/g, "");
  if (ten.length === 10) return `+1${ten}`;
  if (ten.length === 11 && ten.startsWith("1")) return `+${ten}`;
  return null;
}

export async function sendSms({ to, body }: SendSmsArgs): Promise<SendSmsResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!sid || !token || !from) {
    return { ok: false, error: "twilio_not_configured" };
  }
  const normalized = normalizePhone(to);
  if (!normalized) {
    return { ok: false, error: "invalid_phone" };
  }
  const params = new URLSearchParams({ To: normalized, From: from, Body: body });
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  try {
    const res = await fetch(`${TWILIO_BASE}/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    const text = await res.text();
    if (!res.ok) {
      console.error("[twilio] send failed", res.status, text);
      return { ok: false, error: "twilio_send_failed", status: res.status };
    }
    let data: any = {};
    try { data = JSON.parse(text); } catch {}
    return { ok: true, sid: data.sid || "unknown" };
  } catch (err) {
    console.error("[twilio] network error", err);
    return { ok: false, error: "twilio_network_error" };
  }
}

export const PICKUP_ADDRESS_LINES = [
  "1634 N 19th Ave",
  "Phoenix, AZ 85009",
  "Enter through 19th Avenue gate",
];

export function formatPickupConfirmationSms(args: {
  customerName: string | null;
  orderNumber: string;
  itemSummary: string;
  pickupLabel: string | null;
  totalDollars: number;
  isCoordinated: boolean;
  receiptUrl?: string;
}): string {
  const name = args.customerName || "there";
  const lines: string[] = [
    `Hey ${name}, your OSW order ${args.orderNumber} is paid.`,
    args.itemSummary,
    `Total: $${args.totalDollars.toFixed(2)}`,
    "",
    "Pickup:",
    ...PICKUP_ADDRESS_LINES,
  ];
  if (args.isCoordinated) {
    lines.push("", "Large order — our team will reach out to confirm a pickup window.");
  } else if (args.pickupLabel) {
    lines.push("", `Scheduled: ${args.pickupLabel}`);
  }
  if (args.receiptUrl) {
    lines.push("", `Receipt + QR: ${args.receiptUrl}`);
  }
  lines.push("", `Questions? Reply here or call ${CUSTOMER_SUPPORT_PHONE_PLAIN}.`);
  return lines.join("\n");
}
