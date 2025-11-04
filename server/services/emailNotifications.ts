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

  const adminEmails = data?.map((admin) => admin.email) || ["ralvarez@soilseedandwater.com"];

  // Send to all admins
  const emailPromises = adminEmails.map((email) =>
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

  const adminEmails = data?.map((admin) => admin.email) || ["ralvarez@soilseedandwater.com"];

  // Send to all admins
  const emailPromises = adminEmails.map((email) =>
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

  const adminEmails = data?.map((admin) => admin.email) || ["ralvarez@soilseedandwater.com"];

  // Send to all admins
  const emailPromises = adminEmails.map((email) =>
    sendEmail({
      to: email,
      subject: `[SPECIAL REQUEST] ${requestDetails.name} - ${requestDetails.message.substring(0, 50)}...`,
      html,
    })
  );

  return Promise.all(emailPromises);
}

// Admin notification for lead submissions
export async function sendAdminLeadNotification(leadDetails: { name: string; email: string; phone: string; notes?: string; submittedAt: string }) {
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
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: white;
          padding: 32px;
          text-align: center;
        }
        .alert-badge { 
          background-color: white;
          color: #7c3aed;
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
        .lead-info { 
          background-color: #f9fafb;
          padding: 24px;
          border-radius: 8px;
          margin: 24px 0;
          border: 1px solid #e5e7eb;
        }
        .lead-info p {
          margin: 8px 0;
          color: #4b5563;
        }
        .lead-info strong {
          color: #1a1a1a;
          font-weight: 600;
        }
        .notes-box {
          background-color: #f3f4f6;
          padding: 20px;
          border-radius: 8px;
          margin: 24px 0;
          border-left: 4px solid #8b5cf6;
        }
        .action-button {
          display: inline-block;
          background-color: #8b5cf6;
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
            <div class="alert-badge">NEW LEAD</div>
            <h1>Organic Soil Wholesale</h1>
          </div>
          <div class="content">
            <h2>New Lead Submission</h2>
            
            <div class="lead-info">
              <p><strong>Name:</strong> ${leadDetails.name}</p>
              <p><strong>Email:</strong> <a href="mailto:${leadDetails.email}">${leadDetails.email}</a></p>
              <p><strong>Phone:</strong> <a href="tel:${leadDetails.phone}">${leadDetails.phone}</a></p>
              <p><strong>Submitted:</strong> ${new Date(leadDetails.submittedAt).toLocaleString()}</p>
            </div>
            
            ${
              leadDetails.notes
                ? `
            <h3 style="color: #1a1a1a; font-size: 18px; margin: 32px 0 16px 0;">Additional Notes:</h3>
            <div class="notes-box">
              <p style="margin: 0; white-space: pre-wrap;">${leadDetails.notes}</p>
            </div>
            `
                : ""
            }
            
            <p style="text-align: center;">
              <a href="mailto:${leadDetails.email}" class="action-button">Contact Lead</a>
            </p>
          </div>
          <div class="footer">
            <p>Organic Soil Wholesale Lead Management</p>
            <p>This notification was sent to authorized administrators</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  // Import dependencies
  const { sendEmail } = await import("./email.js");
  const { supabase } = await import("../db/supabase.js");

  // Get active admin emails for leads
  const { data, error } = await supabase.from("admin_notifications").select("email").eq("active", true).eq("notify_orders", true); // Using notify_orders for leads as well

  const adminEmails = data?.map((admin) => admin.email) || ["ralvarez@soilseedandwater.com"];

  // Send to all admins
  const emailPromises = adminEmails.map((email) =>
    sendEmail({
      to: email,
      subject: `[LEAD] ${leadDetails.name} - New Lead Submission`,
      html,
    })
  );

  return Promise.all(emailPromises);
}
