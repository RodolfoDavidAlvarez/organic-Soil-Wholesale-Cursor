import { Resend } from 'resend';
import { supabase } from '../db/supabase.js';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY || 're_H3Q7nu34_QAFnBmaCJr7qBwpHU5pnKmSg');

// Email configuration
const FROM_EMAIL = 'Organic Soil Wholesale <ralvarez@bettersystems.ai>';
const COMPANY_NAME = 'Organic Soil Wholesale';
const COMPANY_PHONE = '(928) 550-1649';
const COMPANY_ADDRESS = 'Flagstaff, AZ';

// Get active admin emails for a specific notification type
async function getAdminEmailsForNotification(notificationType: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('admin_notifications')
      .select('email')
      .eq('active', true)
      .eq(notificationType, true);

    if (error) {
      console.error('Error fetching admin emails:', error);
      // Fallback to default admin
      return ['ralvarez@soilseedandwater.com'];
    }

    const emails = data?.map(admin => admin.email) || [];
    
    // If no admins found, use fallback
    if (emails.length === 0) {
      return ['ralvarez@soilseedandwater.com'];
    }

    return emails;
  } catch (error) {
    console.error('Error in getAdminEmailsForNotification:', error);
    // Fallback to default admin
    return ['ralvarez@soilseedandwater.com'];
  }
}

// Email templates
interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Send email helper
export async function sendEmail({ to, subject, html, text }: EmailOptions) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      text: text || '',
    });

    if (error) {
      console.error('Email send error:', error);
      throw error;
    }

    console.log('Email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

// Email verification template
export async function sendVerificationEmail(email: string, token: string) {
  const baseUrl = process.env.CLIENT_URL || (process.env.NODE_ENV === 'production' && process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  const verificationUrl = `${baseUrl}/verify-email/${token}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2c5530; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background-color: #f9f9f9; }
        .button { display: inline-block; padding: 12px 30px; background-color: #2c5530; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${COMPANY_NAME}</h1>
        </div>
        <div class="content">
          <h2>Verify Your Email Address</h2>
          <p>Thank you for creating an account with ${COMPANY_NAME}!</p>
          <p>Please click the button below to verify your email address and activate your account:</p>
          <center>
            <a href="${verificationUrl}" class="button">Verify Email</a>
          </center>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background-color: #eee; padding: 10px; border-radius: 5px;">
            ${verificationUrl}
          </p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create an account with us, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>${COMPANY_NAME} • ${COMPANY_ADDRESS} • ${COMPANY_PHONE}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Verify your email for ${COMPANY_NAME}`,
    html,
  });
}

// Password reset template
export async function sendPasswordResetEmail(email: string, token: string) {
  const baseUrl = process.env.CLIENT_URL || (process.env.NODE_ENV === 'production' && process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  const resetUrl = `${baseUrl}/reset-password/${token}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2c5530; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background-color: #f9f9f9; }
        .button { display: inline-block; padding: 12px 30px; background-color: #2c5530; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${COMPANY_NAME}</h1>
        </div>
        <div class="content">
          <h2>Reset Your Password</h2>
          <p>We received a request to reset your password for your ${COMPANY_NAME} account.</p>
          <p>Click the button below to create a new password:</p>
          <center>
            <a href="${resetUrl}" class="button">Reset Password</a>
          </center>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background-color: #eee; padding: 10px; border-radius: 5px;">
            ${resetUrl}
          </p>
          <p><strong>This link will expire in 1 hour for security reasons.</strong></p>
          <p>If you didn't request a password reset, please ignore this email. Your password won't be changed.</p>
        </div>
        <div class="footer">
          <p>${COMPANY_NAME} • ${COMPANY_ADDRESS} • ${COMPANY_PHONE}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Password Reset Request - ${COMPANY_NAME}`,
    html,
  });
}

// Welcome email for approved wholesale accounts
export async function sendWholesaleApprovalEmail(email: string, companyName: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2c5530; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background-color: #f9f9f9; }
        .button { display: inline-block; padding: 12px 30px; background-color: #2c5530; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        .benefits { background-color: #e8f5e9; padding: 20px; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${COMPANY_NAME}</h1>
        </div>
        <div class="content">
          <h2>Welcome to Our Wholesale Program!</h2>
          <p>Dear ${companyName},</p>
          <p>Great news! Your wholesale account has been approved.</p>
          
          <div class="benefits">
            <h3>Your Wholesale Benefits:</h3>
            <ul>
              <li>Exclusive wholesale pricing</li>
              <li>Bulk order discounts</li>
              <li>Priority delivery scheduling</li>
              <li>Dedicated account support</li>
              <li>NET payment terms available</li>
            </ul>
          </div>
          
          <p>You can now log in to view wholesale pricing and place orders:</p>
          <center>
            <a href="${process.env.CLIENT_URL || (process.env.NODE_ENV === 'production' && process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')}/signin" class="button">Sign In to Your Account</a>
          </center>
          
          <p>If you have any questions, please don't hesitate to contact us at ${COMPANY_PHONE}.</p>
          <p>We look forward to working with you!</p>
        </div>
        <div class="footer">
          <p>${COMPANY_NAME} • ${COMPANY_ADDRESS} • ${COMPANY_PHONE}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Welcome to ${COMPANY_NAME} Wholesale Program`,
    html,
  });
}

// Order confirmation email
export async function sendOrderConfirmationEmail(
  email: string,
  orderDetails: {
    orderNumber: string;
    items: Array<{ name: string; quantity: number; price: number }>;
    subtotal: number;
    tax: number;
    total: number;
    deliveryMethod: string;
    estimatedDelivery?: string;
  }
) {
  const itemsHtml = orderDetails.items
    .map(
      (item) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toFixed(2)}</td>
        </tr>
      `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2c5530; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background-color: #f9f9f9; }
        .order-info { background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; padding: 10px; border-bottom: 2px solid #2c5530; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${COMPANY_NAME}</h1>
        </div>
        <div class="content">
          <h2>Order Confirmation</h2>
          <p>Thank you for your order!</p>
          
          <div class="order-info">
            <p><strong>Order Number:</strong> ${orderDetails.orderNumber}</p>
            <p><strong>Delivery Method:</strong> ${orderDetails.deliveryMethod}</p>
            ${orderDetails.estimatedDelivery ? `<p><strong>Estimated Delivery:</strong> ${orderDetails.estimatedDelivery}</p>` : ''}
          </div>
          
          <h3>Order Details</h3>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th style="text-align: center;">Quantity</th>
                <th style="text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
              <tr>
                <td colspan="2" style="padding: 10px; text-align: right;"><strong>Subtotal:</strong></td>
                <td style="padding: 10px; text-align: right;">$${orderDetails.subtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td colspan="2" style="padding: 10px; text-align: right;"><strong>Tax:</strong></td>
                <td style="padding: 10px; text-align: right;">$${orderDetails.tax.toFixed(2)}</td>
              </tr>
              <tr>
                <td colspan="2" style="padding: 10px; text-align: right;"><strong>Total:</strong></td>
                <td style="padding: 10px; text-align: right;"><strong>$${orderDetails.total.toFixed(2)}</strong></td>
              </tr>
            </tbody>
          </table>
          
          <p style="margin-top: 30px;">We'll send you an update when your order is ready for ${orderDetails.deliveryMethod.toLowerCase()}.</p>
          <p>Questions? Call us at ${COMPANY_PHONE}</p>
        </div>
        <div class="footer">
          <p>${COMPANY_NAME} • ${COMPANY_ADDRESS} • ${COMPANY_PHONE}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Order Confirmation #${orderDetails.orderNumber} - ${COMPANY_NAME}`,
    html,
  });
}

// Order ready for pickup notification
export async function sendOrderReadyEmail(email: string, orderNumber: string, pickupLocation: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2c5530; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background-color: #f9f9f9; }
        .button { display: inline-block; padding: 12px 30px; background-color: #2c5530; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .pickup-info { background-color: #e8f5e9; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${COMPANY_NAME}</h1>
        </div>
        <div class="content">
          <h2>Your Order is Ready for Pickup!</h2>
          <p>Good news! Order #${orderNumber} is ready for pickup.</p>
          
          <div class="pickup-info">
            <h3>Pickup Information:</h3>
            <p><strong>Location:</strong> ${pickupLocation}</p>
            <p><strong>Hours:</strong> Monday-Saturday, 7:00 AM - 5:00 PM</p>
            <p><strong>Order Number:</strong> ${orderNumber}</p>
            <p>Please bring this order number and a valid ID for pickup.</p>
          </div>
          
          <p>Your order will be held for 7 days. Please pick up at your earliest convenience.</p>
          
          <center>
            <a href="tel:${COMPANY_PHONE.replace(/[^\d]/g, '')}" class="button">Call Us: ${COMPANY_PHONE}</a>
          </center>
          
          <p>Thank you for your business!</p>
        </div>
        <div class="footer">
          <p>${COMPANY_NAME} • ${COMPANY_ADDRESS} • ${COMPANY_PHONE}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Order #${orderNumber} Ready for Pickup - ${COMPANY_NAME}`,
    html,
  });
}

// Admin notification for new orders
export async function sendAdminOrderNotification(orderDetails: {
  orderNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  orderType: string;
  items: Array<{ name: string; quantity: number; price: number; size?: string }>;
  subtotal: number;
  tax: number;
  total: number;
  deliveryMethod: string;
  pickupLocation?: string;
  estimatedReadyTime?: string;
  notes?: string;
  paymentMethod?: string;
  paymentStatus?: string;
}) {
  const itemsHtml = orderDetails.items
    .map(
      (item) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}${item.size ? ` (${item.size})` : ''}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toFixed(2)}</td>
        </tr>
      `
    )
    .join('');

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
          background: linear-gradient(135deg, #2c5530 0%, #1e3a21 100%);
          color: white;
          padding: 32px;
          text-align: center;
        }
        .alert-badge { 
          background-color: #ef4444;
          color: white;
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
          color: #2c5530;
          font-size: 22px;
          margin: 0 0 24px 0;
          font-weight: 600;
        }
        .order-info { 
          background-color: #f9fafb;
          padding: 24px;
          border-radius: 8px;
          margin: 24px 0;
          border: 1px solid #e5e7eb;
        }
        .order-info p {
          margin: 8px 0;
          color: #4b5563;
        }
        .order-info strong {
          color: #1a1a1a;
          font-weight: 600;
        }
        .highlight { 
          background-color: #fef3c7;
          padding: 20px;
          border-left: 4px solid #f59e0b;
          margin: 24px 0;
          border-radius: 4px;
        }
        h3 {
          color: #2c5530;
          font-size: 18px;
          margin: 32px 0 16px 0;
          font-weight: 600;
        }
        table { 
          width: 100%;
          border-collapse: collapse;
          margin: 16px 0;
        }
        th { 
          text-align: left;
          padding: 12px;
          border-bottom: 2px solid #e5e7eb;
          color: #6b7280;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
        }
        td {
          padding: 16px 12px;
          border-bottom: 1px solid #f3f4f6;
          color: #374151;
        }
        .total-row td {
          border-top: 2px solid #e5e7eb;
          border-bottom: none;
          padding-top: 16px;
          font-size: 18px;
          font-weight: 600;
          color: #1a1a1a;
        }
        .action-required {
          background-color: #2c5530;
          color: white;
          padding: 24px;
          border-radius: 8px;
          margin: 32px 0 0 0;
          text-align: center;
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
            <div class="alert-badge">NEW ORDER</div>
            <h1>${COMPANY_NAME}</h1>
          </div>
          <div class="content">
            <h2>New ${orderDetails.orderType === 'pay_and_pickup' ? 'Pay & Pickup' : 'Order'} Received</h2>
            
            <div class="order-info">
              <p><strong>Order Number:</strong> ${orderDetails.orderNumber}</p>
              <p><strong>Customer:</strong> ${orderDetails.customerName}</p>
              ${orderDetails.customerEmail ? `<p><strong>Email:</strong> ${orderDetails.customerEmail}</p>` : ''}
              <p><strong>Phone:</strong> ${orderDetails.customerPhone}</p>
              <p><strong>Order Type:</strong> ${orderDetails.orderType === 'pay_and_pickup' ? 'Pay & Pickup' : orderDetails.orderType}</p>
              <p><strong>Delivery Method:</strong> ${orderDetails.deliveryMethod}</p>
              ${orderDetails.paymentMethod ? `<p><strong>Payment Method:</strong> ${orderDetails.paymentMethod}</p>` : ''}
              ${orderDetails.paymentStatus ? `<p><strong>Payment Status:</strong> ${orderDetails.paymentStatus}</p>` : ''}
              ${orderDetails.pickupLocation ? `<p><strong>Pickup Location:</strong> ${orderDetails.pickupLocation}</p>` : ''}
              ${orderDetails.estimatedReadyTime ? `<p><strong>Estimated Ready:</strong> ${new Date(orderDetails.estimatedReadyTime).toLocaleString()}</p>` : ''}
            </div>
            
            ${orderDetails.notes ? `
            <div class="highlight">
              <strong>Customer Notes:</strong><br>
              ${orderDetails.notes}
            </div>
            ` : ''}
            
            <h3>Order Items</h3>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th style="text-align: center;">QTY</th>
                  <th style="text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
                <tr>
                  <td colspan="2" style="padding: 12px; text-align: right;"><strong>Subtotal:</strong></td>
                  <td style="padding: 12px; text-align: right;">$${orderDetails.subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding: 12px; text-align: right;"><strong>Tax:</strong></td>
                  <td style="padding: 12px; text-align: right;">$${orderDetails.tax.toFixed(2)}</td>
                </tr>
                <tr class="total-row">
                  <td colspan="2" style="text-align: right;"><strong>Total:</strong></td>
                  <td style="text-align: right;"><strong>$${orderDetails.total.toFixed(2)}</strong></td>
                </tr>
              </tbody>
            </table>
            
            <div class="action-required">
              <strong>ACTION REQUIRED</strong><br>
              Please prepare this order for ${orderDetails.deliveryMethod.toLowerCase()}.
            </div>
          </div>
          <div class="footer">
            <p>${COMPANY_NAME} Order Management System</p>
            <p>This notification was sent to authorized administrators</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  // Get all admins who want order notifications
  const adminEmails = await getAdminEmailsForNotification('notify_new_orders');
  
  // Send to all admins
  const emailPromises = adminEmails.map(email => 
    sendEmail({
      to: email,
      subject: `[NEW ORDER] ${orderDetails.paymentStatus === 'paid' ? '[PAID] ' : ''}#${orderDetails.orderNumber} - $${orderDetails.total.toFixed(2)} - ${orderDetails.customerName}`,
      html,
    })
  );

  return Promise.all(emailPromises);
}

// Admin notification for customer arrival
export async function sendAdminArrivalNotification(arrivalDetails: {
  customerName: string;
  customerPhone: string;
  vehicleInfo?: string;
  arrivalTime: string;
  notificationId: number;
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
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          color: white;
          padding: 32px;
          text-align: center;
        }
        h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
          letter-spacing: -0.5px;
          text-transform: uppercase;
        }
        .content { 
          padding: 40px 32px;
        }
        .action-required { 
          background-color: #fee2e2;
          color: #991b1b;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
          font-weight: 700;
          font-size: 18px;
          margin: 0 0 24px 0;
          border: 2px solid #fca5a5;
        }
        .arrival-info { 
          background-color: #ffffff;
          padding: 32px;
          border-radius: 12px;
          margin: 24px 0;
          border: 2px solid #dc2626;
          box-shadow: 0 4px 6px rgba(220, 38, 38, 0.1);
        }
        .arrival-info h2 {
          color: #1a1a1a;
          font-size: 20px;
          margin: 0 0 20px 0;
          font-weight: 600;
        }
        .info-row {
          display: flex;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #f3f4f6;
        }
        .info-row:last-child {
          border-bottom: none;
        }
        .info-label {
          font-weight: 600;
          color: #4b5563;
          width: 140px;
        }
        .info-value {
          color: #1a1a1a;
          flex: 1;
        }
        .info-value a {
          color: #2563eb;
          text-decoration: none;
          font-weight: 600;
        }
        .time-stamp {
          background-color: #f3f4f6;
          padding: 16px;
          border-radius: 8px;
          text-align: center;
          margin: 24px 0;
        }
        .time-stamp strong {
          color: #dc2626;
          font-size: 18px;
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
        .call-button {
          display: inline-block;
          background-color: #2563eb;
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          margin: 16px 0;
        }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header">
            <h1>Customer Arrival Alert</h1>
          </div>
          <div class="content">
            <div class="action-required">
              IMMEDIATE ACTION REQUIRED - Customer is waiting at pickup location
            </div>
            
            <div class="arrival-info">
              <h2>Customer Information</h2>
              <div class="info-row">
                <span class="info-label">Name:</span>
                <span class="info-value">${arrivalDetails.customerName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Phone:</span>
                <span class="info-value">
                  <a href="tel:${arrivalDetails.customerPhone}">${arrivalDetails.customerPhone}</a>
                </span>
              </div>
              ${arrivalDetails.vehicleInfo ? `
              <div class="info-row">
                <span class="info-label">Vehicle:</span>
                <span class="info-value">${arrivalDetails.vehicleInfo}</span>
              </div>
              ` : ''}
              <div class="info-row">
                <span class="info-label">Notification ID:</span>
                <span class="info-value">#${arrivalDetails.notificationId}</span>
              </div>
            </div>

            <div class="time-stamp">
              <p style="margin: 0; color: #6b7280;">Customer arrived at</p>
              <strong>${new Date(arrivalDetails.arrivalTime).toLocaleString()}</strong>
            </div>
            
            <p style="text-align: center; margin: 32px 0;">
              <a href="tel:${arrivalDetails.customerPhone}" class="call-button">
                Call Customer
              </a>
            </p>
          </div>
          <div class="footer">
            <p>${COMPANY_NAME} Pickup Alert System</p>
            <p>Urgent notification sent to authorized administrators</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  // Get all admins who want arrival notifications
  const adminEmails = await getAdminEmailsForNotification('notify_arrivals');
  
  // Send to all admins
  const emailPromises = adminEmails.map(email => 
    sendEmail({
      to: email,
      subject: `[URGENT] Customer Arrival: ${arrivalDetails.customerName} - ${arrivalDetails.vehicleInfo || 'Vehicle Info Not Provided'}`,
      html,
    })
  );

  return Promise.all(emailPromises);
}

// Admin notification for trivia leads
export async function sendAdminTriviaLeadNotification(leadDetails: {
  name: string;
  email: string;
  interests: string[];
  score: number;
  answers: any;
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
          background: linear-gradient(135deg, #16a34a 0%, #059669 100%);
          color: white;
          padding: 32px;
          text-align: center;
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
        .lead-info { 
          background-color: #f9fafb;
          padding: 24px;
          border-radius: 8px;
          margin: 24px 0;
          border: 1px solid #e5e7eb;
        }
        .lead-info p {
          margin: 12px 0;
          color: #4b5563;
        }
        .lead-info strong {
          color: #1a1a1a;
          font-weight: 600;
        }
        .lead-info a {
          color: #2563eb;
          text-decoration: none;
        }
        h3 {
          color: #2c5530;
          font-size: 18px;
          margin: 32px 0 16px 0;
          font-weight: 600;
        }
        .score-badge { 
          display: inline-block;
          background: #059669;
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 13px;
          margin-left: 8px;
          vertical-align: middle;
        }
        .interests-container {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin: 16px 0;
        }
        .interest-tag { 
          background: #e0f2fe;
          color: #0369a1;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
          border: 1px solid #bae6fd;
        }
        .quality-indicator { 
          padding: 20px;
          border-radius: 8px;
          margin: 24px 0;
          border: 2px solid;
          text-align: center;
        }
        .hot-lead { 
          background-color: #fef2f2;
          border-color: #f87171;
          color: #991b1b;
        }
        .warm-lead { 
          background-color: #fffbeb;
          border-color: #fbbf24;
          color: #92400e;
        }
        .cold-lead { 
          background-color: #eff6ff;
          border-color: #93c5fd;
          color: #1e40af;
        }
        .quality-metric {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
        }
        .cta-button {
          display: inline-block;
          background-color: #059669;
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
            <h1>Trade Show Lead Notification</h1>
          </div>
          <div class="content">
            <h2 style="margin: 0 0 24px 0; color: #1a1a1a; font-size: 22px;">New Lead Captured</h2>
            
            <div class="lead-info">
              <p><strong>Name:</strong> ${leadDetails.name}</p>
              <p><strong>Email:</strong> <a href="mailto:${leadDetails.email}">${leadDetails.email}</a></p>
              <p><strong>Quiz Score:</strong> ${leadDetails.score}/5 
                <span class="score-badge">${leadDetails.score === 5 ? 'PERFECT SCORE' : leadDetails.score >= 4 ? 'HIGH SCORE' : leadDetails.score >= 3 ? 'GOOD SCORE' : 'PARTICIPATED'}</span>
              </p>
              <p><strong>Submitted:</strong> ${new Date(leadDetails.submittedAt).toLocaleString()}</p>
            </div>
            
            <h3>Growing Interests</h3>
            <div class="interests-container">
              ${leadDetails.interests.map(interest => `<span class="interest-tag">${interest}</span>`).join('')}
            </div>
            
            <div class="quality-indicator ${leadDetails.score >= 4 ? 'hot-lead' : leadDetails.score >= 3 ? 'warm-lead' : 'cold-lead'}">
              <div class="quality-metric">
                <strong>Lead Quality:</strong>
                <span>${leadDetails.score >= 4 ? 'HOT LEAD' : leadDetails.score >= 3 ? 'WARM LEAD' : 'COLD LEAD'}</span>
              </div>
              <div class="quality-metric">
                <strong>Engagement Level:</strong>
                <span>${leadDetails.interests.length > 3 ? 'HIGH' : leadDetails.interests.length > 1 ? 'MEDIUM' : 'LOW'}</span>
              </div>
            </div>
            
            <p style="text-align: center;">
              <a href="mailto:${leadDetails.email}" class="cta-button">Contact This Lead</a>
            </p>
          </div>
          <div class="footer">
            <p>Lead captured at Trade Show 2025</p>
            <p>${COMPANY_NAME} Lead Management System</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  // Get all admins who want trivia lead notifications
  const adminEmails = await getAdminEmailsForNotification('notify_trivia_leads');
  
  // Send to all admins
  const emailPromises = adminEmails.map(email => 
    sendEmail({
      to: email,
      subject: `[TRIVIA LEAD] ${leadDetails.name} - Score: ${leadDetails.score}/5 - ${leadDetails.interests.length} interests`,
      html,
    })
  );

  return Promise.all(emailPromises);
}

// Re-export additional notification functions
export { sendAdminContactFormNotification, sendAdminQuoteRequestNotification, sendAdminSpecialRequestNotification } from './emailNotifications.js';
