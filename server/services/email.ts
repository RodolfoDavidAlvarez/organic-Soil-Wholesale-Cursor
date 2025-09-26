import { Resend } from 'resend';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY || 're_3NwHmEhS_LufEzsb6iCtrdzZd7d3zLFDi');

// Email configuration
const FROM_EMAIL = 'Organic Soil Wholesale <ralvarez@bettersystems.ai>';
const COMPANY_NAME = 'Organic Soil Wholesale';
const COMPANY_PHONE = '(928) 550-1649';
const COMPANY_ADDRESS = 'Flagstaff, AZ';

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