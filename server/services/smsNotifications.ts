/**
 * SMS Notifications via Twilio
 * Sends instant SMS to Rodo when wholesale leads/orders come in.
 */

const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM = process.env.TWILIO_PHONE_NUMBER;
const RODO_PHONE = process.env.RODO_PHONE;

export async function sendSmsNotification(message: string, to: string = RODO_PHONE || ""): Promise<boolean> {
  if (!to) {
    console.warn("No SMS recipient configured, skipping SMS");
    return false;
  }

  if (!TWILIO_SID || !TWILIO_AUTH || !TWILIO_FROM) {
    console.warn("Twilio not configured, skipping SMS");
    return false;
  }

  try {
    const params = new URLSearchParams({
      To: to,
      From: TWILIO_FROM,
      Body: message.substring(0, 1600), // Twilio limit
    });

    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: "Basic " + Buffer.from(`${TWILIO_SID}:${TWILIO_AUTH}`).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      }
    );

    if (!res.ok) {
      const error = await res.text();
      console.error("Twilio SMS failed:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("SMS notification error:", err);
    return false;
  }
}

export async function sendLeadSmsAlert(leadDetails: {
  name: string;
  phone: string;
  notes?: string;
}) {
  // Extract interest from notes
  const interestMatch = leadDetails.notes?.match(/Interested in: (.+)/);
  const interest = interestMatch ? interestMatch[1].split("\n")[0] : "Wholesale";

  const companyMatch = leadDetails.notes?.match(/Company: (.+)/);
  const company = companyMatch ? companyMatch[1].split("\n")[0] : "";

  const message = [
    `NEW WHOLESALE LEAD`,
    `${leadDetails.name}${company ? ` - ${company}` : ""}`,
    `${leadDetails.phone}`,
    `Wants: ${interest}`,
    `Call them back ASAP!`,
  ].join("\n");

  return sendSmsNotification(message);
}

export async function sendOrderSmsAlert(orderDetails: {
  name: string;
  phone?: string;
  products: string;
  total?: string;
}) {
  const message = [
    `NEW ORDER`,
    `${orderDetails.name}`,
    orderDetails.phone ? `${orderDetails.phone}` : "",
    `Products: ${orderDetails.products}`,
    orderDetails.total ? `Total: ${orderDetails.total}` : "",
  ].filter(Boolean).join("\n");

  return sendSmsNotification(message);
}
