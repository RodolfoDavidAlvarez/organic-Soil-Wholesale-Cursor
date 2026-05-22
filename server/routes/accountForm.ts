import { Router } from "express";
import { supabase } from "../db/supabase.js";
import { sendEmail } from "../services/email.js";
import { adminAuthMiddleware } from "../middleware/adminAuth.js";

const router = Router();

interface AccountFormPayload {
  full_legal_business_name?: string;
  company_address?: string;
  ein_tax_id?: string;
  business_registration_number?: string;
  arizona_tpt_license?: string;
  preferred_payment_method?: string;
  billing_contact_name?: string;
  billing_contact_email?: string;
  preferred_payment_terms?: string;
  sales_tax_exemption_status?: string;
  operations_contact_name?: string;
  operations_contact_phone?: string;
  submitted_by_name?: string;
  signature_data?: string;
  certification_accepted?: boolean;
  signed_date?: string;
  source?: string;
}

router.post("/submit", async (req, res) => {
  try {
    const payload = req.body as AccountFormPayload;

    if (!payload.full_legal_business_name || !payload.full_legal_business_name.trim()) {
      return res.status(400).json({ error: "Full legal business name is required" });
    }
    if (!payload.submitted_by_name || !payload.submitted_by_name.trim()) {
      return res.status(400).json({ error: "Submitter name is required" });
    }
    if (!payload.certification_accepted) {
      return res.status(400).json({ error: "You must accept the certification" });
    }
    if (!payload.signature_data) {
      return res.status(400).json({ error: "Signature is required" });
    }

    if (payload.billing_contact_email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(payload.billing_contact_email)) {
        return res.status(400).json({ error: "Invalid billing contact email" });
      }
    }

    const ipAddress =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      null;
    const userAgent = req.headers["user-agent"] || null;

    const insertRow = {
      full_legal_business_name: payload.full_legal_business_name.trim(),
      company_address: payload.company_address?.trim() || null,
      ein_tax_id: payload.ein_tax_id?.trim() || null,
      business_registration_number: payload.business_registration_number?.trim() || null,
      arizona_tpt_license: payload.arizona_tpt_license?.trim() || null,
      preferred_payment_method: payload.preferred_payment_method?.trim() || null,
      billing_contact_name: payload.billing_contact_name?.trim() || null,
      billing_contact_email: payload.billing_contact_email?.trim().toLowerCase() || null,
      preferred_payment_terms: payload.preferred_payment_terms?.trim() || null,
      sales_tax_exemption_status: payload.sales_tax_exemption_status?.trim() || null,
      operations_contact_name: payload.operations_contact_name?.trim() || null,
      operations_contact_phone: payload.operations_contact_phone?.trim() || null,
      submitted_by_name: payload.submitted_by_name.trim(),
      signature_data: payload.signature_data,
      certification_accepted: !!payload.certification_accepted,
      signed_date: payload.signed_date || new Date().toISOString().slice(0, 10),
      status: "submitted",
      source: payload.source?.trim() || "web",
      ip_address: ipAddress,
      user_agent: userAgent,
    };

    const { data, error } = await supabase
      .from("client_account_forms")
      .insert(insertRow)
      .select()
      .single();

    if (error) {
      console.error("Account form insert error:", error);
      return res.status(500).json({ error: "Failed to save submission" });
    }

    try {
      await sendAccountFormNotifications(data);
    } catch (emailErr) {
      console.error("Account form email failed (continuing):", emailErr);
    }

    res.json({ success: true, submissionId: data.id });
  } catch (err) {
    console.error("Account form submit error:", err);
    res.status(500).json({ error: "Failed to process submission" });
  }
});

router.get("/list", adminAuthMiddleware, async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("client_account_forms")
      .select(
        "id, full_legal_business_name, submitted_by_name, billing_contact_email, status, signed_date, created_at"
      )
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error("Account form list error:", err);
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
});

router.get("/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("client_account_forms")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (error) {
      return res.status(404).json({ error: "Submission not found" });
    }
    res.json(data);
  } catch (err) {
    console.error("Account form get error:", err);
    res.status(500).json({ error: "Failed to fetch submission" });
  }
});

router.patch("/:id/status", adminAuthMiddleware, async (req, res) => {
  try {
    const { status, notes } = req.body || {};
    if (!status || !["submitted", "approved", "rejected", "needs_info"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const { data, error } = await supabase
      .from("client_account_forms")
      .update({
        status,
        notes: notes || null,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("Account form status update error:", err);
    res.status(500).json({ error: "Failed to update status" });
  }
});

async function sendAccountFormNotifications(record: any) {
  const adminHtml = buildAdminEmailHtml(record);
  await sendEmail({
    to: "ralvarez@soilseedandwater.com",
    subject: `[Account Form] New submission: ${record.full_legal_business_name}`,
    html: adminHtml,
  });

  if (record.billing_contact_email) {
    const clientHtml = buildClientCopyHtml(record);
    await sendEmail({
      to: record.billing_contact_email,
      subject: "Your Soil Seed & Water Account Form Submission",
      html: clientHtml,
    });
  }
}

function row(label: string, value: string | null | undefined): string {
  if (!value) return "";
  return `<tr><td style="padding:6px 12px;color:#264027;font-weight:600;width:40%;">${label}</td><td style="padding:6px 12px;">${escapeHtml(
    value
  )}</td></tr>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildAdminEmailHtml(r: any): string {
  return `<!DOCTYPE html><html><body style="font-family:Helvetica,Arial,sans-serif;color:#1a2a1a;background:#f5f5f5;padding:24px;">
  <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;">
    <div style="background:#264027;color:#fff;padding:24px;">
      <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;">Soil Seed &amp; Water</div>
      <h1 style="margin:6px 0 0;font-size:22px;">New Account Form Submission</h1>
    </div>
    <div style="padding:24px;">
      <h2 style="color:#264027;font-size:14px;border-bottom:1px solid #b38a58;padding-bottom:4px;">Company</h2>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        ${row("Legal business name", r.full_legal_business_name)}
        ${row("Company address", r.company_address)}
        ${row("Tax ID / EIN", r.ein_tax_id)}
        ${row("Business registration", r.business_registration_number)}
        ${row("Arizona TPT license", r.arizona_tpt_license)}
      </table>
      <h2 style="color:#264027;font-size:14px;border-bottom:1px solid #b38a58;padding-bottom:4px;margin-top:16px;">Billing</h2>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        ${row("Preferred payment method", r.preferred_payment_method)}
        ${row("Billing contact name", r.billing_contact_name)}
        ${row("Billing contact email", r.billing_contact_email)}
        ${row("Preferred payment terms", r.preferred_payment_terms)}
        ${row("Sales tax exemption", r.sales_tax_exemption_status)}
      </table>
      <h2 style="color:#264027;font-size:14px;border-bottom:1px solid #b38a58;padding-bottom:4px;margin-top:16px;">Operations contact</h2>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        ${row("Name", r.operations_contact_name)}
        ${row("Phone", r.operations_contact_phone)}
      </table>
      <h2 style="color:#264027;font-size:14px;border-bottom:1px solid #b38a58;padding-bottom:4px;margin-top:16px;">Signature</h2>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        ${row("Submitted by", r.submitted_by_name)}
        ${row("Signed date", r.signed_date)}
        ${row("Submission ID", r.id)}
      </table>
      ${
        r.signature_data
          ? `<div style="margin-top:12px;"><img src="${r.signature_data}" alt="signature" style="max-width:300px;border:1px solid #ccc;background:#fff;"/></div>`
          : ""
      }
    </div>
  </div>
  </body></html>`;
}

function buildClientCopyHtml(r: any): string {
  return `<!DOCTYPE html><html><body style="font-family:Helvetica,Arial,sans-serif;color:#1a2a1a;background:#f5f5f5;padding:24px;">
  <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;">
    <div style="background:#264027;color:#fff;padding:24px;">
      <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;">Soil Seed &amp; Water</div>
      <h1 style="margin:6px 0 0;font-size:22px;">Account Form Received</h1>
    </div>
    <div style="padding:24px;font-size:14px;line-height:1.5;">
      <p>Hi ${escapeHtml(r.submitted_by_name || "there")},</p>
      <p>Thanks for submitting your account form for <strong>${escapeHtml(
        r.full_legal_business_name
      )}</strong>. Here is a copy of what you sent us:</p>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        ${row("Legal business name", r.full_legal_business_name)}
        ${row("Company address", r.company_address)}
        ${row("Tax ID / EIN", r.ein_tax_id)}
        ${row("Arizona TPT license", r.arizona_tpt_license)}
        ${row("Preferred payment method", r.preferred_payment_method)}
        ${row("Billing contact", r.billing_contact_name)}
        ${row("Operations contact", r.operations_contact_name)}
        ${row("Operations phone", r.operations_contact_phone)}
        ${row("Signed date", r.signed_date)}
      </table>
      <p style="margin-top:16px;">We will review and follow up shortly.</p>
      <p>Rodo Alvarez<br/>Soil Seed &amp; Water</p>
    </div>
  </div>
  </body></html>`;
}

export default router;
