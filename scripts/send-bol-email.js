import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function sendBOLEmail() {
  try {
    const bolId = 15; // BOL-20260127-001
    const recipientEmail = 'kcooper6119@gmail.com';
    const recipientName = 'Kerry Cooper';

    console.log(`Sending BOL to ${recipientName} (${recipientEmail})...\n`);

    // Get admin token (we need this for the API)
    // For now, let's use the API directly
    const response = await fetch(`http://localhost:3000/api/admin/operations/bols/${bolId}/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In production, you'd need proper authentication
      },
      body: JSON.stringify({
        recipientEmail: recipientEmail,
        recipientName: recipientName,
        customMessage: `Hi Kerry,

Please find attached the Bill of Lading (BOL-20260127-001) for today's dog food delivery.

Delivery Details:
- Customer: Jack Mendoza
- Material: Dog Food (Food Waste)
- Net Weight: 38,771 lbs (19.39 tons)
- Carrier: Total Way Trucking
- Driver: Emanuel
- Truck: 4UH3224 (CA)
- Date: January 27, 2026
- Time: 11:00 AM - 12:30 PM

Best regards,
Rodo Alvarez
Soil Seed & Water
(928) 632-7125`
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to send email: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Email sent successfully!');
    console.log(`Sent to: ${result.sentTo}`);

  } catch (err) {
    console.error('Error sending email:', err.message);
    throw err;
  }
}

sendBOLEmail();
