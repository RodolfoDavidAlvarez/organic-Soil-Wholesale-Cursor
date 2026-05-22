import { supabase } from "../db/supabase.js";
import { sendAdminLeadNotification, sendCustomerQuoteConfirmation } from "./emailNotifications.js";
import { forwardToMosLeads } from "./forwardToMosLeads.js";
import { sendLeadSmsAlert } from "./smsNotifications.js";
import { forwardToMosLeads } from "./forwardToMosLeads.js";

export interface LeadSubmissionPayload {
  name?: string;
  email?: string;
  phone?: string;
  notes?: string;
  preferred_date?: string;
}

export interface LeadSubmissionResult {
  leadId: number;
  message: string;
  submittedAt: string;
}

export class LeadSubmissionError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

export async function processLeadSubmission(
  payload: LeadSubmissionPayload
): Promise<LeadSubmissionResult> {
  const { name, email, phone, notes, preferred_date } = payload;

  if (!name || !email || !phone) {
    throw new LeadSubmissionError("Name, email, and phone are required", 400);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new LeadSubmissionError("Invalid email format", 400);
  }

  const submittedAt = new Date().toISOString();

  const insertData: any = {
    name,
    email,
    subject: "Lead Form Submission",
    message: `Phone: ${phone}\n\nNotes: ${notes || "No additional notes"}`,
    created_at: submittedAt,
  };
  if (preferred_date) insertData.preferred_date = preferred_date;

  const { data, error } = await supabase
    .from("contact_messages")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    throw new LeadSubmissionError(
      error.message || "Failed to submit lead",
      500
    );
  }

  try {
    await Promise.all([
      sendAdminLeadNotification({
        name,
        email,
        phone,
        notes,
        submittedAt,
      }),
      sendCustomerQuoteConfirmation({
        name,
        email,
        phone,
        notes,
        submittedAt,
      }),
      sendLeadSmsAlert({ name, phone, notes }),
    ]);
  } catch (notificationError) {
    console.error("Failed to send notifications:", notificationError);
  }

  forwardToMosLeads({
    full_name: name,
    email,
    phone,
    message: notes || undefined,
    source: 'osw_lead_form',
    source_url: 'https://organicsoilwholesale.com/',
    source_data: { osw_contact_message_id: data.id },
  });

  return {
    leadId: data.id,
    message: "Thank you! We'll contact you shortly.",
    submittedAt,
  };
}
