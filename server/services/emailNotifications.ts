import {
  CUSTOMER_SUPPORT_PHONE_DIGITS,
  CUSTOMER_SUPPORT_PHONE_DISPLAY,
} from "../config/contact.js";

// Admin notification for contact form submissions
export async function sendAdminContactFormNotification(contactDetails: {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  subject?: string;
  message: string;
  submittedAt: string;
}) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #1a1a1a;
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
        }
        .wrapper {
          background-color: #f5f5f5;
          padding: 40px 20px;
        }
        .container { 
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header { 
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          padding: 32px;
          text-align: center;
        }
        .alert-badge { 
          background-color: white;
          color: #2563eb;
          padding: 6px 16px;
          border-radius: 20px;
          display: inline-block;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          margin-bottom: 16px;
        }
        h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 300;
          letter-spacing: -0.5px;
        }
        .content { 
          padding: 40px 32px;
        }
        h2 {
          color: #1a1a1a;
          font-size: 22px;
          margin: 0 0 24px 0;
          font-weight: 600;
        }
        .contact-info { 
          background-color: #f9fafb;
          padding: 24px;
          border-radius: 8px;
          margin: 24px 0;
          border: 1px solid #e5e7eb;
        }
        .contact-info p {
          margin: 8px 0;
          color: #4b5563;
        }
        .contact-info strong {
          color: #1a1a1a;
          font-weight: 600;
        }
        .message-box {
          background-color: #f3f4f6;
          padding: 20px;
          border-radius: 8px;
          margin: 24px 0;
          border-left: 4px solid #3b82f6;
        }
        .reply-button {
          display: inline-block;
          background-color: #3b82f6;
          color: white;
          padding: 14px 32px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          margin: 24px 0;
        }
        .footer { 
          text-align: center;
          padding: 24px 32px;
          color: #9ca3af;
          font-size: 13px;
          background-color: #f9fafb;
          border-top: 1px solid #e5e7eb;
        }
        .footer p {
          margin: 4px 0;
        }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header">
            <div class="alert-badge">CONTACT FORM</div>
            <h1>Organic Soil Wholesale</h1>
          </div>
          <div class="content">
            <h2>New Contact Form Submission</h2>
            
            <div class="contact-info">
              <p><strong>Name:</strong> ${contactDetails.name}</p>
              <p><strong>Email:</strong> <a href="mailto:${contactDetails.email}">${contactDetails.email}</a></p>
              ${contactDetails.phone ? `<p><strong>Phone:</strong> <a href="tel:${contactDetails.phone}">${contactDetails.phone}</a></p>` : ""}
              ${contactDetails.company ? `<p><strong>Company:</strong> ${contactDetails.company}</p>` : ""}
              ${contactDetails.subject ? `<p><strong>Subject:</strong> ${contactDetails.subject}</p>` : ""}
              <p><strong>Submitted:</strong> ${new Date(contactDetails.submittedAt).toLocaleString()}</p>
            </div>
            
            <h3 style="color: #1a1a1a; font-size: 18px; margin: 32px 0 16px 0;">Message:</h3>
            <div class="message-box">
              <p style="margin: 0; white-space: pre-wrap;">${contactDetails.message}</p>
            </div>
            
            <p style="text-align: center;">
              <a href="mailto:${contactDetails.email}" class="reply-button">Reply to ${contactDetails.name}</a>
            </p>
          </div>
          <div class="footer">
            <p>Organic Soil Wholesale Contact Management</p>
            <p>This notification was sent to authorized administrators</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  // Import dependencies at the top of the function
  const { sendEmail } = require("./email");
  const { supabase } = require("../db/supabase");

  // Get active admin emails for contact forms
  const { data, error } = await supabase.from("admin_notifications").select("email").eq("active", true).eq("notify_contact_forms", true);

  const adminEmails = data?.map((admin: { email: string }) => admin.email) || ["ralvarez@soilseedandwater.com"];

  // Send to all admins
  const emailPromises = adminEmails.map((email: string) =>
    sendEmail({
      to: email,
      subject: `[CONTACT] ${contactDetails.subject || "New Contact Form"} - ${contactDetails.name}`,
      html,
    })
  );

  return Promise.all(emailPromises);
}

// Admin notification for quote requests
export async function sendAdminQuoteRequestNotification(quoteDetails: {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  products: string;
  quantities: string;
  deliveryLocation?: string;
  notes?: string;
  submittedAt: string;
}) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #1a1a1a;
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
        }
        .wrapper {
          background-color: #f5f5f5;
          padding: 40px 20px;
        }
        .container { 
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header { 
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 32px;
          text-align: center;
        }
        .alert-badge { 
          background-color: white;
          color: #059669;
          padding: 6px 16px;
          border-radius: 20px;
          display: inline-block;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          margin-bottom: 16px;
        }
        h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 300;
          letter-spacing: -0.5px;
        }
        .content { 
          padding: 40px 32px;
        }
        h2 {
          color: #1a1a1a;
          font-size: 22px;
          margin: 0 0 24px 0;
          font-weight: 600;
        }
        .quote-info { 
          background-color: #f9fafb;
          padding: 24px;
          border-radius: 8px;
          margin: 24px 0;
          border: 1px solid #e5e7eb;
        }
        .quote-info p {
          margin: 8px 0;
          color: #4b5563;
        }
        .quote-info strong {
          color: #1a1a1a;
          font-weight: 600;
        }
        .request-box {
          background-color: #ecfdf5;
          padding: 20px;
          border-radius: 8px;
          margin: 24px 0;
          border: 1px solid #86efac;
        }
        .notes-box {
          background-color: #fef3c7;
          padding: 20px;
          border-radius: 8px;
          margin: 24px 0;
          border-left: 4px solid #f59e0b;
        }
        .action-button {
          display: inline-block;
          background-color: #10b981;
          color: white;
          padding: 14px 32px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          margin: 24px 0;
        }
        .footer { 
          text-align: center;
          padding: 24px 32px;
          color: #9ca3af;
          font-size: 13px;
          background-color: #f9fafb;
          border-top: 1px solid #e5e7eb;
        }
        .footer p {
          margin: 4px 0;
        }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header">
            <div class="alert-badge">QUOTE REQUEST</div>
            <h1>Organic Soil Wholesale</h1>
          </div>
          <div class="content">
            <h2>New Quote Request</h2>
            
            <div class="quote-info">
              <p><strong>Name:</strong> ${quoteDetails.name}</p>
              <p><strong>Email:</strong> <a href="mailto:${quoteDetails.email}">${quoteDetails.email}</a></p>
              ${quoteDetails.phone ? `<p><strong>Phone:</strong> <a href="tel:${quoteDetails.phone}">${quoteDetails.phone}</a></p>` : ""}
              ${quoteDetails.company ? `<p><strong>Company:</strong> ${quoteDetails.company}</p>` : ""}
              ${quoteDetails.deliveryLocation ? `<p><strong>Delivery Location:</strong> ${quoteDetails.deliveryLocation}</p>` : ""}
              <p><strong>Submitted:</strong> ${new Date(quoteDetails.submittedAt).toLocaleString()}</p>
            </div>
            
            <h3 style="color: #1a1a1a; font-size: 18px; margin: 32px 0 16px 0;">Requested Products:</h3>
            <div class="request-box">
              <p style="margin: 0 0 8px 0;"><strong>Products:</strong></p>
              <p style="margin: 0; white-space: pre-wrap;">${quoteDetails.products}</p>
              <p style="margin: 16px 0 8px 0;"><strong>Quantities:</strong></p>
              <p style="margin: 0; white-space: pre-wrap;">${quoteDetails.quantities}</p>
            </div>
            
            ${
              quoteDetails.notes
                ? `
            <h3 style="color: #1a1a1a; font-size: 18px; margin: 32px 0 16px 0;">Additional Notes:</h3>
            <div class="notes-box">
              <p style="margin: 0; white-space: pre-wrap;">${quoteDetails.notes}</p>
            </div>
            `
                : ""
            }
            
            <p style="text-align: center;">
              <a href="mailto:${quoteDetails.email}" class="action-button">Prepare Quote</a>
            </p>
          </div>
          <div class="footer">
            <p>Organic Soil Wholesale Quote Management</p>
            <p>This notification was sent to authorized administrators</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  // Import dependencies at the top of the function
  const { sendEmail } = require("./email");
  const { supabase } = require("../db/supabase");

  // Get active admin emails for quote requests
  const { data, error } = await supabase.from("admin_notifications").select("email").eq("active", true).eq("notify_quote_requests", true);

  const adminEmails = data?.map((admin: { email: string }) => admin.email) || ["ralvarez@soilseedandwater.com"];

  // Send to all admins
  const emailPromises = adminEmails.map((email: string) =>
    sendEmail({
      to: email,
      subject: `[QUOTE REQUEST] ${quoteDetails.company || quoteDetails.name} - ${quoteDetails.products.split("\n")[0].substring(0, 50)}...`,
      html,
    })
  );

  return Promise.all(emailPromises);
}

// Admin notification for special requests
export async function sendAdminSpecialRequestNotification(requestDetails: {
  name: string;
  email: string;
  phone?: string;
  zipCode?: string;
  message: string;
  submittedAt: string;
}) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #1a1a1a;
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
        }
        .wrapper {
          background-color: #f5f5f5;
          padding: 40px 20px;
        }
        .container { 
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header { 
          background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
          color: white;
          padding: 32px;
          text-align: center;
        }
        .alert-badge { 
          background-color: white;
          color: #f97316;
          padding: 6px 16px;
          border-radius: 20px;
          display: inline-block;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          margin-bottom: 16px;
        }
        h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 300;
          letter-spacing: -0.5px;
        }
        .content { 
          padding: 40px 32px;
        }
        h2 {
          color: #1a1a1a;
          font-size: 22px;
          margin: 0 0 24px 0;
          font-weight: 600;
        }
        .request-info { 
          background-color: #f9fafb;
          padding: 24px;
          border-radius: 8px;
          margin: 24px 0;
          border: 1px solid #e5e7eb;
        }
        .request-info p {
          margin: 8px 0;
          color: #4b5563;
        }
        .request-info strong {
          color: #1a1a1a;
          font-weight: 600;
        }
        .message-box {
          background-color: #fffbeb;
          padding: 20px;
          border-radius: 8px;
          margin: 24px 0;
          border: 1px solid #fcd34d;
        }
        .action-button {
          display: inline-block;
          background-color: #f59e0b;
          color: white;
          padding: 14px 32px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          margin: 24px 0;
        }
        .footer { 
          text-align: center;
          padding: 24px 32px;
          color: #9ca3af;
          font-size: 13px;
          background-color: #f9fafb;
          border-top: 1px solid #e5e7eb;
        }
        .footer p {
          margin: 4px 0;
        }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header">
            <div class="alert-badge">SPECIAL REQUEST</div>
            <h1>Organic Soil Wholesale</h1>
          </div>
          <div class="content">
            <h2>New Special Request</h2>
            
            <div class="request-info">
              <p><strong>Name:</strong> ${requestDetails.name}</p>
              <p><strong>Email:</strong> <a href="mailto:${requestDetails.email}">${requestDetails.email}</a></p>
              ${requestDetails.phone ? `<p><strong>Phone:</strong> <a href="tel:${requestDetails.phone}">${requestDetails.phone}</a></p>` : ""}
              ${requestDetails.zipCode ? `<p><strong>ZIP Code:</strong> ${requestDetails.zipCode}</p>` : ""}
              <p><strong>Submitted:</strong> ${new Date(requestDetails.submittedAt).toLocaleString()}</p>
            </div>
            
            <h3 style="color: #1a1a1a; font-size: 18px; margin: 32px 0 16px 0;">Request Details:</h3>
            <div class="message-box">
              <p style="margin: 0; white-space: pre-wrap;">${requestDetails.message}</p>
            </div>
            
            <p style="text-align: center;">
              <a href="mailto:${requestDetails.email}" class="action-button">Respond to Request</a>
            </p>
          </div>
          <div class="footer">
            <p>Organic Soil Wholesale Special Request Management</p>
            <p>This notification was sent to authorized administrators</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  // Import dependencies at the top of the function
  const { sendEmail } = require("./email");
  const { supabase } = require("../db/supabase");

  // Get active admin emails for special requests
  const { data, error } = await supabase.from("admin_notifications").select("email").eq("active", true).eq("notify_special_requests", true);

  const adminEmails = data?.map((admin: { email: string }) => admin.email) || ["ralvarez@soilseedandwater.com"];

  // Send to all admins
  const emailPromises = adminEmails.map((email: string) =>
    sendEmail({
      to: email,
      subject: `[SPECIAL REQUEST] ${requestDetails.name} - ${requestDetails.message.substring(0, 50)}...`,
      html,
    })
  );

  return Promise.all(emailPromises);
}

// Parse cart items from notes field (format: "--- QUOTE CART ---\n1x Format — Product (Price)\n...")
function parseCartFromNotes(notes?: string): { cartItems: { qty: string; format: string; product: string; price: string }[]; estimatedTotal: string; customerNotes: string } {
  if (!notes) return { cartItems: [], estimatedTotal: "", customerNotes: "" };
  const cartMatch = notes.match(/--- QUOTE CART ---\n([\s\S]*?)--- END CART ---/);
  if (!cartMatch) return { cartItems: [], estimatedTotal: "", customerNotes: notes };
  const cartBlock = cartMatch[1].trim();
  const lines = cartBlock.split("\n");
  const cartItems: { qty: string; format: string; product: string; price: string }[] = [];
  let estimatedTotal = "";
  for (const line of lines) {
    const totalMatch = line.match(/Estimated Total:\s*(.+)/);
    if (totalMatch) { estimatedTotal = totalMatch[1].trim(); continue; }
    const itemMatch = line.match(/^(\d+)x\s+(.+?)\s+—\s+(.+?)\s+\((.+?)\)$/);
    if (itemMatch) {
      cartItems.push({ qty: itemMatch[1], format: itemMatch[2], product: itemMatch[3], price: itemMatch[4] });
    }
  }
  const customerNotes = notes.replace(/--- QUOTE CART ---[\s\S]*?--- END CART ---\s*/, "").trim();
  return { cartItems, estimatedTotal, customerNotes };
}

function buildCartTableHtml(cartItems: { qty: string; format: string; product: string; price: string }[], estimatedTotal: string): string {
  if (cartItems.length === 0) return "";
  const rows = cartItems.map(item => `
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #1a1a1a;">${item.product}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; color: #4b5563;">${item.qty}x ${item.format}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #059669;">${item.price}</td>
    </tr>`).join("");
  return `
    <h3 style="color: #1a1a1a; font-size: 18px; margin: 32px 0 16px 0;">Requested Products:</h3>
    <table style="width: 100%; border-collapse: collapse; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
      <thead>
        <tr style="background-color: #f9fafb;">
          <th style="padding: 10px 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280; font-weight: 600;">Product</th>
          <th style="padding: 10px 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280; font-weight: 600;">Format</th>
          <th style="padding: 10px 12px; text-align: right; font-size: 12px; text-transform: uppercase; color: #6b7280; font-weight: 600;">Price</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      ${estimatedTotal ? `<tfoot>
        <tr style="background-color: #ecfdf5;">
          <td colspan="2" style="padding: 12px; font-weight: 600; color: #1a1a1a;">Estimated Total</td>
          <td style="padding: 12px; text-align: right; font-weight: 700; font-size: 16px; color: #059669;">${estimatedTotal}</td>
        </tr>
      </tfoot>` : ""}
    </table>`;
}

// Admin notification for lead submissions (with cart items support)
export async function sendAdminLeadNotification(leadDetails: { name: string; email: string; phone: string; notes?: string; submittedAt: string }) {
  const { cartItems, estimatedTotal, customerNotes } = parseCartFromNotes(leadDetails.notes);
  const hasCart = cartItems.length > 0;
  const badgeText = hasCart ? "QUOTE REQUEST" : "NEW LEAD";
  const headerGradient = hasCart ? "linear-gradient(135deg, #059669 0%, #047857 100%)" : "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)";
  const badgeColor = hasCart ? "#059669" : "#7c3aed";
  const accentColor = hasCart ? "#059669" : "#8b5cf6";
  const subjectPrefix = hasCart ? "[QUOTE]" : "[LEAD]";
  const cartTableHtml = buildCartTableHtml(cartItems, estimatedTotal);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background-color: #f5f5f5;">
      <div style="background-color: #f5f5f5; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
          <div style="background: ${headerGradient}; color: white; padding: 32px; text-align: center;">
            <div style="background-color: white; color: ${badgeColor}; padding: 6px 16px; border-radius: 20px; display: inline-block; font-size: 12px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 16px;">${badgeText}</div>
            <h1 style="margin: 0; font-size: 24px; font-weight: 300;">Organic Soil Wholesale</h1>
          </div>
          <div style="padding: 40px 32px;">
            <h2 style="color: #1a1a1a; font-size: 22px; margin: 0 0 24px 0; font-weight: 600;">${hasCart ? "New Quote Request" : "New Lead Submission"}</h2>

            <div style="background-color: #f9fafb; padding: 24px; border-radius: 8px; margin: 24px 0; border: 1px solid #e5e7eb;">
              <p style="margin: 8px 0; color: #4b5563;"><strong style="color: #1a1a1a;">Name:</strong> ${leadDetails.name}</p>
              <p style="margin: 8px 0; color: #4b5563;"><strong style="color: #1a1a1a;">Email:</strong> <a href="mailto:${leadDetails.email}">${leadDetails.email}</a></p>
              <p style="margin: 8px 0; color: #4b5563;"><strong style="color: #1a1a1a;">Phone:</strong> <a href="tel:${leadDetails.phone}">${leadDetails.phone}</a></p>
              <p style="margin: 8px 0; color: #4b5563;"><strong style="color: #1a1a1a;">Submitted:</strong> ${new Date(leadDetails.submittedAt).toLocaleString()}</p>
            </div>

            ${cartTableHtml}

            ${customerNotes ? `
            <h3 style="color: #1a1a1a; font-size: 18px; margin: 32px 0 16px 0;">Additional Notes:</h3>
            <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #f59e0b;">
              <p style="margin: 0; white-space: pre-wrap;">${customerNotes}</p>
            </div>` : ""}

            <p style="text-align: center;">
              <a href="mailto:${leadDetails.email}" style="display: inline-block; background-color: ${accentColor}; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 24px 0;">Contact ${leadDetails.name}</a>
            </p>
          </div>
          <div style="text-align: center; padding: 24px 32px; color: #9ca3af; font-size: 13px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
            <p style="margin: 4px 0;">Organic Soil Wholesale Lead Management</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const { sendEmail } = await import("./email.js");
  const { supabase } = await import("../db/supabase.js");

  const { data, error } = await supabase.from("admin_notifications").select("email").eq("active", true).eq("notify_new_orders", true);
  const adminEmails = data?.map((admin: any) => admin.email) || ["ralvarez@soilseedandwater.com"];

  const emailPromises = adminEmails.map((email: string) =>
    sendEmail({
      to: email,
      subject: `${subjectPrefix} ${leadDetails.name}${hasCart ? ` — ${cartItems.length} product${cartItems.length > 1 ? "s" : ""} (${estimatedTotal})` : " — New Lead"}`,
      html,
    })
  );

  return Promise.all(emailPromises);
}

// Customer confirmation email after quote submission
export async function sendCustomerQuoteConfirmation(leadDetails: { name: string; email: string; phone: string; notes?: string; submittedAt: string }) {
  const { cartItems, estimatedTotal } = parseCartFromNotes(leadDetails.notes);
  const hasCart = cartItems.length > 0;
  const cartTableHtml = hasCart ? buildCartTableHtml(cartItems, estimatedTotal) : "";
  const firstName = leadDetails.name.split(" ")[0];

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background-color: #f5f5f5;">
      <div style="background-color: #f5f5f5; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
          <div style="background: linear-gradient(135deg, #264027 0%, #3c5233 100%); color: white; padding: 32px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 600;">Organic <span style="color: #8fbc8f;">Soil</span> <span style="color: #c9a227; font-style: italic;">Wholesale</span></h1>
            <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">by Soil Seed & Water</p>
          </div>
          <div style="padding: 40px 32px;">
            <h2 style="color: #264027; font-size: 22px; margin: 0 0 16px 0; font-weight: 600;">Thanks, ${firstName}!</h2>
            <p style="color: #4b5563; margin: 0 0 24px 0;">We've received your ${hasCart ? "quote request" : "inquiry"} and will get back to you within 24 hours with pricing and availability.</p>

            ${cartTableHtml}

            <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 24px 0; border: 1px solid #bbf7d0;">
              <p style="margin: 0 0 4px 0; font-weight: 600; color: #264027;">What happens next?</p>
              <ol style="margin: 8px 0 0 0; padding-left: 20px; color: #4b5563;">
                <li style="margin-bottom: 6px;">Our team reviews your request</li>
                <li style="margin-bottom: 6px;">We'll confirm product availability and delivery options</li>
                <li>You'll receive a formal quote via email or phone</li>
              </ol>
            </div>

            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 24px 0; border: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0 0 8px 0; font-weight: 600; color: #1a1a1a;">Need something sooner?</p>
              <p style="margin: 0; color: #4b5563;">Call us directly at <a href="tel:${CUSTOMER_SUPPORT_PHONE_DIGITS}" style="color: #264027; font-weight: 600;">${CUSTOMER_SUPPORT_PHONE_DISPLAY}</a></p>
            </div>
          </div>
          <div style="text-align: center; padding: 24px 32px; color: #9ca3af; font-size: 13px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
            <p style="margin: 4px 0; font-weight: 600; color: #6b7280;">Soil Seed & Water</p>
            <p style="margin: 4px 0;">1634 N 19th Ave, Phoenix, AZ 85009</p>
            <p style="margin: 4px 0;"><a href="tel:${CUSTOMER_SUPPORT_PHONE_DIGITS}" style="color: #6b7280;">${CUSTOMER_SUPPORT_PHONE_DISPLAY}</a></p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const { sendEmail } = await import("./email.js");

  return sendEmail({
    to: leadDetails.email,
    subject: hasCart
      ? `Your Quote Request — ${cartItems.length} product${cartItems.length > 1 ? "s" : ""} | Organic Soil Wholesale`
      : `We received your inquiry | Organic Soil Wholesale`,
    html,
  });
}
