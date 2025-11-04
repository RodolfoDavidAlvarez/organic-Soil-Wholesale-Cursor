import { supabase } from "../db/supabase.js";
import { sendAdminLeadNotification } from "./emailNotifications.js";

export interface LeadSubmissionPayload {
  name?: string;
  email?: string;
  phone?: string;
  notes?: string;
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
  const { name, email, phone, notes } = payload;

  if (!name || !email || !phone) {
    throw new LeadSubmissionError("Name, email, and phone are required", 400);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new LeadSubmissionError("Invalid email format", 400);
  }

  const submittedAt = new Date().toISOString();

  const { data, error } = await supabase
    .from("contact_messages")
    .insert({
      name,
      email,
      subject: "Lead Form Submission",
      message: `Phone: ${phone}\n\nNotes: ${notes || "No additional notes"}`,
      created_at: submittedAt,
    })
    .select()
    .single();

  if (error) {
    throw new LeadSubmissionError(
      error.message || "Failed to submit lead",
      500
    );
  }

  try {
    await sendAdminLeadNotification({
      name,
      email,
      phone,
      notes,
      submittedAt,
    });
  } catch (notificationError) {
    console.error("Failed to send admin notification:", notificationError);
  }

  return {
    leadId: data.id,
    message: "Thank you! We'll contact you shortly.",
    submittedAt,
  };
}
