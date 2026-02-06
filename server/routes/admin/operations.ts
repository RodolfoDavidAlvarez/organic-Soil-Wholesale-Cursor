/**
 * Operations System - BOL Management API & COD (Certificate of Destruction)
 * Create, manage, and generate PDF BOLs/Weight Tickets and CODs
 */

import { Router } from "express";
import { supabase } from "../../supabaseClient.js";
import { adminAuthMiddleware, AdminRequest } from "../../middleware/adminAuth.js";
import puppeteer from "puppeteer";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
import workOrderRoutes from "./workOrders.js";

const router = Router();

// Mount work orders routes
router.use("/work-orders", workOrderRoutes);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Apply auth middleware to all routes except PDF endpoint (which handles auth separately)
router.use((req, res, next) => {
  if (req.path.includes('/pdf')) {
    return next(); // Skip middleware for PDF endpoint
  }
  return adminAuthMiddleware(req, res, next);
});

/**
 * Generate BOL number (BOL-YYYYMMDD-NNN)
 */
async function generateBOLNumber(): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD

  // Count existing BOLs today
  const { count, error } = await supabase
    .from('ops_bols')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', `${today.toISOString().split('T')[0]}T00:00:00`)
    .lte('created_at', `${today.toISOString().split('T')[0]}T23:59:59`);

  if (error) throw error;

  const sequence = ((count || 0) + 1).toString().padStart(3, '0');
  return `BOL-${dateStr}-${sequence}`;
}

/**
 * GET /api/admin/operations/recent-addresses
 * Returns unique recent destinations and carriers from past BOLs for autocomplete
 */
router.get("/recent-addresses", async (req: AdminRequest, res) => {
  try {
    // Fetch recent BOLs (last 200) for address suggestions
    const { data, error } = await supabase
      .from('ops_bols')
      .select('customer_name, destination_address, destination_city, destination_state, destination_zip, onsite_contact_name, onsite_contact_phone, carrier_name, driver_name, truck_number, license_plate, trailer_number, created_at')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) throw error;

    // Build unique destinations map (keyed by customer_name + destination_address)
    const destinationMap = new Map<string, any>();
    const carrierMap = new Map<string, any>();

    for (const bol of data || []) {
      // Destinations
      const destKey = `${bol.customer_name}|${bol.destination_address}`.toLowerCase();
      if (bol.customer_name && bol.destination_address && !destinationMap.has(destKey)) {
        destinationMap.set(destKey, {
          customerName: bol.customer_name,
          destinationAddress: bol.destination_address,
          destinationCity: bol.destination_city,
          destinationState: bol.destination_state,
          destinationZip: bol.destination_zip,
          onsiteContactName: bol.onsite_contact_name,
          onsiteContactPhone: bol.onsite_contact_phone,
          lastUsed: bol.created_at
        });
      }

      // Carriers
      if (bol.carrier_name) {
        const carrierKey = bol.carrier_name.toLowerCase();
        if (!carrierMap.has(carrierKey)) {
          carrierMap.set(carrierKey, {
            carrierName: bol.carrier_name,
            driverName: bol.driver_name,
            truckNumber: bol.truck_number,
            licensePlate: bol.license_plate,
            trailerNumber: bol.trailer_number,
            lastUsed: bol.created_at
          });
        }
      }
    }

    res.json({
      destinations: Array.from(destinationMap.values()),
      carriers: Array.from(carrierMap.values())
    });
  } catch (error: any) {
    console.error('Error fetching recent addresses:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch recent addresses' });
  }
});

/**
 * GET /api/admin/operations/bols
 * List all BOLs with filters
 */
router.get("/bols", async (req: AdminRequest, res) => {
  try {
    const { status, dateFilter } = req.query;

    let query = supabase
      .from('ops_bols')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply status filter
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Apply date filter
    if (dateFilter && dateFilter !== 'all') {
      const now = new Date();
      let startDate = new Date();

      switch (dateFilter) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case '3months':
          startDate.setMonth(now.getMonth() - 3);
          break;
      }

      query = query.gte('created_at', startDate.toISOString());
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    console.error('Error fetching BOLs:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch BOLs' });
  }
});

/**
 * POST /api/admin/operations/bols
 * Create a new BOL
 */
router.post("/bols", async (req: AdminRequest, res) => {
  try {
    const {
      date,
      originLocation,
      originAddress,
      originCity,
      originState,
      originZip,
      customerName,
      destinationAddress,
      destinationCity,
      destinationState,
      destinationZip,
      onsiteContactName,
      onsiteContactPhone,
      materialType,
      materialDescription,
      grossWeight,
      tareWeight,
      netWeight,
      netWeightTons,
      carrierName,
      driverName,
      truckNumber,
      licensePlate,
      trailerNumber,
      notes,
      referenceNumber,
      timeIn,
      timeOut,
      scaleOperatorInitials,
      loadType
    } = req.body;

    // Validation
    if (!customerName || !destinationAddress || !materialType) {
      return res.status(400).json({ message: 'Missing required fields: customerName, destinationAddress, materialType' });
    }

    // Weight is optional - check hasWeight flag from frontend
    const hasWeight = req.body.hasWeight !== false && (grossWeight > 0 || tareWeight > 0);

    // Generate BOL number
    const bolNumber = await generateBOLNumber();

    // Get admin email from token
    const createdBy = req.admin?.email || 'admin@ssw.com';

    // Insert BOL
    const { data, error } = await supabase
      .from('ops_bols')
      .insert({
        bol_number: bolNumber,
        date: date || new Date().toISOString(),
        origin_location: originLocation,
        origin_address: originAddress,
        origin_city: originCity,
        origin_state: originState,
        origin_zip: originZip,
        customer_name: customerName,
        destination_address: destinationAddress,
        destination_city: destinationCity,
        destination_state: destinationState,
        destination_zip: destinationZip,
        onsite_contact_name: onsiteContactName,
        onsite_contact_phone: onsiteContactPhone,
        material_type: materialType,
        material_description: materialDescription,
        gross_weight: hasWeight ? parseInt(grossWeight) : 0,
        tare_weight: hasWeight ? parseInt(tareWeight) : 0,
        net_weight: hasWeight ? parseInt(netWeight) : 0,
        net_weight_tons: hasWeight ? netWeightTons : '0.00',
        carrier_name: carrierName || 'James Bond Trucking',
        driver_name: driverName,
        truck_number: truckNumber,
        license_plate: licensePlate,
        trailer_number: trailerNumber,
        notes,
        reference_number: referenceNumber,
        time_in: timeIn,
        time_out: timeOut,
        scale_operator_initials: scaleOperatorInitials,
        load_type: loadType || 'Outbound',
        status: 'completed',
        created_by: createdBy
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error: any) {
    console.error('Error creating BOL:', error);
    res.status(500).json({ message: error.message || 'Failed to create BOL' });
  }
});

/**
 * GET /api/admin/operations/bols/:id
 * Get a single BOL by ID
 */
router.get("/bols/:id", async (req: AdminRequest, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('ops_bols')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ message: 'BOL not found' });
    }

    res.json(data);
  } catch (error: any) {
    console.error('Error fetching BOL:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch BOL' });
  }
});

/**
 * POST /api/admin/operations/bols/delete
 * Delete one or more BOLs
 */
router.post("/bols/delete", async (req: AdminRequest, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No IDs provided' });
    }

    const { error } = await supabase
      .from('ops_bols')
      .delete()
      .in('id', ids);

    if (error) throw error;

    res.json({ success: true, deleted: ids.length });
  } catch (error: any) {
    console.error('Error deleting BOLs:', error);
    res.status(500).json({ message: error.message || 'Failed to delete BOLs' });
  }
});

/**
 * PATCH /api/admin/operations/bols/:id
 * Update an existing BOL
 */
router.patch("/bols/:id", async (req: AdminRequest, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Convert camelCase to snake_case
    const snakeCaseUpdates: Record<string, any> = {};
    const fieldMap: Record<string, string> = {
      date: "date",
      originLocation: "origin_location",
      originAddress: "origin_address",
      originCity: "origin_city",
      originState: "origin_state",
      originZip: "origin_zip",
      customerName: "customer_name",
      destinationAddress: "destination_address",
      destinationCity: "destination_city",
      destinationState: "destination_state",
      destinationZip: "destination_zip",
      onsiteContactName: "onsite_contact_name",
      onsiteContactPhone: "onsite_contact_phone",
      materialType: "material_type",
      materialDescription: "material_description",
      grossWeight: "gross_weight",
      tareWeight: "tare_weight",
      netWeight: "net_weight",
      netWeightTons: "net_weight_tons",
      carrierName: "carrier_name",
      driverName: "driver_name",
      truckNumber: "truck_number",
      licensePlate: "license_plate",
      trailerNumber: "trailer_number",
      notes: "notes",
      referenceNumber: "reference_number",
      timeIn: "time_in",
      timeOut: "time_out",
      scaleOperatorInitials: "scale_operator_initials",
      loadType: "load_type",
      status: "status",
      orderId: "order_id"
    };

    for (const [key, value] of Object.entries(updates)) {
      const snakeKey = fieldMap[key] || key;
      // Don't include the key if it's not in the field map (avoid unknown columns)
      if (fieldMap[key] || key === 'status') {
        snakeCaseUpdates[snakeKey] = value;
      }
    }

    snakeCaseUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('ops_bols')
      .update(snakeCaseUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ message: 'BOL not found' });
    }

    res.json(data);
  } catch (error: any) {
    console.error('Error updating BOL:', error);
    res.status(500).json({ message: error.message || 'Failed to update BOL' });
  }
});

/**
 * POST /api/admin/operations/bols/:id/email
 * Send BOL via email with PDF attachment
 */
router.post("/bols/:id/email", async (req: AdminRequest, res) => {
  try {
    const { id } = req.params;
    const { recipientEmail, recipientName, customMessage } = req.body;

    if (!recipientEmail) {
      return res.status(400).json({ message: 'Recipient email is required' });
    }

    // Fetch BOL data
    const { data: bol, error: fetchError } = await supabase
      .from('ops_bols')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    if (!bol) {
      return res.status(404).json({ message: 'BOL not found' });
    }

    // Generate PDF using Puppeteer
    const html = generateBOLHTML(bol);
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: {
        top: '0.3in',
        right: '0.3in',
        bottom: '0.3in',
        left: '0.3in'
      }
    });

    await browser.close();

    // Send email via Resend API
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      throw new Error('Resend API key not configured');
    }

    const deliveryDate = new Date(bol.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const destination = [bol.destination_address, bol.destination_city, bol.destination_state, bol.destination_zip].filter(Boolean).join(', ');
    const greeting = recipientName ? `Hi ${recipientName},` : 'Hello,';
    const hasWeight = bol.gross_weight > 0 && bol.tare_weight > 0;

    const customSection = customMessage
      ? `<p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #333;">${customMessage.replace(/\n/g, '<br>')}</p>`
      : '';

    const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 30px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background-color: #264027; padding: 28px 40px;">
              <h1 style="margin: 0; font-size: 22px; color: #ffffff; font-weight: 700;">Soil Seed &amp; Water</h1>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #a8c5a0;">Regenerative Soil Solutions</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 36px 40px 24px 40px;">
              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #333;">${greeting}</p>
              ${customSection || `<p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #333;">Please find attached the Bill of Lading for your delivery. The PDF document is attached to this email for your records.</p>`}
            </td>
          </tr>

          <!-- BOL Details Card -->
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8faf8; border: 1px solid #e0e8e0; border-radius: 8px; overflow: hidden;">
                <tr>
                  <td style="background-color: #264027; padding: 14px 20px;">
                    <span style="font-size: 16px; font-weight: 700; color: #ffffff;">${bol.bol_number}</span>
                    <span style="font-size: 12px; color: #a8c5a0; margin-left: 12px;">Bill of Lading</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #666; width: 130px;">Delivery Date</td>
                        <td style="padding: 6px 0; font-size: 14px; color: #111; font-weight: 600;">${deliveryDate}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #666;">Customer</td>
                        <td style="padding: 6px 0; font-size: 14px; color: #111; font-weight: 600;">${bol.customer_name}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #666;">Destination</td>
                        <td style="padding: 6px 0; font-size: 14px; color: #111;">${destination}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #666;">Material</td>
                        <td style="padding: 6px 0; font-size: 14px; color: #111;">${bol.material_type}</td>
                      </tr>
                      ${hasWeight ? `
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #666;">Net Weight</td>
                        <td style="padding: 6px 0; font-size: 14px; color: #111; font-weight: 600;">${parseInt(bol.net_weight).toLocaleString()} lbs (${bol.net_weight_tons} tons)</td>
                      </tr>
                      ` : ''}
                      ${bol.carrier_name ? `
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #666;">Carrier</td>
                        <td style="padding: 6px 0; font-size: 14px; color: #111;">${bol.carrier_name}</td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #555;">If you have any questions about this delivery, don't hesitate to reach out.</p>
            </td>
          </tr>

          <!-- Signature -->
          <tr>
            <td style="padding: 0 40px 36px 40px; border-top: 1px solid #eee; padding-top: 24px;">
              <p style="margin: 0 0 2px 0; font-size: 14px; color: #333; font-weight: 600;">Rodolfo Alvarez</p>
              <p style="margin: 0 0 2px 0; font-size: 13px; color: #666;">Soil Seed &amp; Water</p>
              <p style="margin: 0 0 2px 0; font-size: 13px; color: #666;">(928) 632-7125</p>
              <p style="margin: 0; font-size: 13px; color: #264027;">operations@soilseedandwater.com</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f8f8; padding: 16px 40px; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #999;">Soil Seed &amp; Water &bull; 1634 N 19th Ave, Phoenix, AZ 85009 &bull; soilseedandwater.com</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const plainText = customMessage || `${greeting}\n\nPlease find attached the Bill of Lading (${bol.bol_number}) for your delivery.\n\nMaterial: ${bol.material_type}\nDelivery Date: ${deliveryDate}\nDestination: ${destination}${hasWeight ? `\nNet Weight: ${parseInt(bol.net_weight).toLocaleString()} lbs (${bol.net_weight_tons} tons)` : ''}\n\nIf you have any questions, please don't hesitate to contact us.\n\nRodolfo Alvarez\nSoil Seed & Water\n(928) 632-7125\noperations@soilseedandwater.com`;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'SSW Operations <operations@soilseedandwater.com>',
        to: [recipientEmail],
        subject: `Bill of Lading - ${bol.bol_number} | ${bol.customer_name}`,
        html: emailHtml,
        text: plainText,
        attachments: [
          {
            filename: `${bol.bol_number}.pdf`,
            content: Buffer.from(pdfBuffer).toString('base64')
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to send email');
    }

    // Update BOL with sent info
    await supabase
      .from('ops_bols')
      .update({
        sent_to_email: recipientEmail,
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    res.json({
      success: true,
      message: `BOL sent successfully to ${recipientEmail}`,
      sentTo: recipientEmail
    });
  } catch (error: any) {
    console.error('Error sending BOL email:', error);
    res.status(500).json({ message: error.message || 'Failed to send BOL email' });
  }
});

/**
 * GET /api/admin/operations/bols/:id/pdf
 * Generate and download BOL PDF
 * Auth: Token can be provided via query param for direct browser access
 */
router.get("/bols/:id/pdf", async (req: AdminRequest, res) => {
  try {
    // Verify token from query param (for direct browser PDF access)
    const token = req.query.token as string;
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    try {
      jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const { id } = req.params;

    // Fetch BOL data
    const { data: bol, error } = await supabase
      .from('ops_bols')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!bol) {
      return res.status(404).json({ message: 'BOL not found' });
    }

    // Generate HTML for PDF
    const html = generateBOLHTML(bol);

    // Generate PDF using Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: {
        top: '0.3in',
        right: '0.3in',
        bottom: '0.3in',
        left: '0.3in'
      }
    });

    await browser.close();

    // Send PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${bol.bol_number}.pdf"`);
    res.end(pdfBuffer);

  } catch (error: any) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ message: error.message || 'Failed to generate PDF' });
  }
});

/**
 * Generate HTML for BOL PDF
 */
function generateBOLHTML(bol: any): string {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  // Check if weight information is provided (non-zero values)
  const hasWeight = bol.gross_weight > 0 && bol.tare_weight > 0;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${bol.bol_number} - Soil Seed and Water</title>
  <style>
    @page {
      size: letter;
      margin: 0.3in;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.4;
      color: #000;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 3px solid #264027;
    }
    .logo-section {
      flex: 1;
    }
    .company-name {
      font-size: 22pt;
      font-weight: bold;
      color: #264027;
      margin-bottom: 4px;
    }
    .tagline {
      font-size: 10pt;
      color: #6f732f;
      margin-bottom: 8px;
    }
    .contact-info {
      font-size: 9pt;
      color: #333;
    }
    .doc-title {
      text-align: right;
      flex: 1;
    }
    .doc-title h1 {
      font-size: 20pt;
      color: #264027;
      margin-bottom: 8px;
    }
    .bol-number {
      font-size: 12pt;
      font-weight: bold;
      color: #000;
      margin-bottom: 4px;
    }
    .doc-date {
      font-size: 10pt;
      color: #666;
    }
    .section {
      margin-bottom: 18px;
    }
    .section-title {
      font-size: 11pt;
      font-weight: bold;
      color: #264027;
      background: #f8f9f8;
      padding: 6px 10px;
      border-left: 4px solid #264027;
      margin-bottom: 8px;
    }
    .two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    .info-row {
      display: flex;
      margin-bottom: 6px;
      font-size: 10pt;
    }
    .label {
      font-weight: bold;
      width: 140px;
      color: #333;
    }
    .value {
      flex: 1;
      color: #000;
    }
    .weight-summary {
      background: #e8f5e9;
      border: 2px solid #264027;
      padding: 15px;
      margin: 15px 0;
      border-radius: 4px;
    }
    .weight-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 11pt;
    }
    .weight-row.total {
      border-top: 2px solid #264027;
      margin-top: 8px;
      padding-top: 10px;
      font-weight: bold;
      font-size: 13pt;
    }
    .signature-section {
      margin-top: 30px;
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 20px;
    }
    .signature-box {
      border-top: 1px solid #000;
      padding-top: 6px;
      min-height: 50px;
    }
    .signature-label {
      font-size: 9pt;
      color: #666;
      margin-top: 4px;
    }
    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #ccc;
      font-size: 8pt;
      color: #666;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-section">
      <div class="company-name">Soil Seed and Water</div>
      <div class="tagline">Regenerative Soil Solutions</div>
      <div class="contact-info">
        18980 Stanton Rd, Congress, AZ 85332<br>
        Phone: (928) 632-7125<br>
        Email: info@soilseedandwater.com
      </div>
    </div>
    <div class="doc-title">
      <h1>Bill of Lading / Weight Ticket</h1>
      <div class="bol-number">BOL #: ${bol.bol_number}</div>
      <div class="doc-date">Date: ${formatDate(bol.date)}</div>
      ${bol.reference_number ? `<div class="doc-date">Reference: ${bol.reference_number}</div>` : ''}
    </div>
  </div>

  <div class="two-col">
    <div>
      <div class="section">
        <div class="section-title">Origin</div>
        <div class="info-row">
          <span class="label">From:</span>
          <span class="value">${bol.origin_location || 'SSW BioSoils'}</span>
        </div>
        <div class="info-row">
          <span class="label">Address:</span>
          <span class="value">${bol.origin_address}</span>
        </div>
        ${bol.origin_city || bol.origin_state || bol.origin_zip ? `
        <div class="info-row">
          <span class="label">City, State ZIP:</span>
          <span class="value">${[bol.origin_city, bol.origin_state, bol.origin_zip].filter(Boolean).join(', ')}</span>
        </div>
        ` : ''}
        <div class="info-row">
          <span class="label">Phone:</span>
          <span class="value">(928) 632-7125</span>
        </div>
      </div>
    </div>

    <div>
      <div class="section">
        <div class="section-title">Destination</div>
        <div class="info-row">
          <span class="label">Customer:</span>
          <span class="value">${bol.customer_name}</span>
        </div>
        <div class="info-row">
          <span class="label">Address:</span>
          <span class="value">${bol.destination_address}</span>
        </div>
        ${bol.destination_city || bol.destination_state || bol.destination_zip ? `
        <div class="info-row">
          <span class="label">City, State ZIP:</span>
          <span class="value">${[bol.destination_city, bol.destination_state, bol.destination_zip].filter(Boolean).join(', ')}</span>
        </div>
        ` : ''}
        ${bol.onsite_contact_name ? `
        <div class="info-row">
          <span class="label">On-Site Contact:</span>
          <span class="value">${bol.onsite_contact_name}${bol.onsite_contact_phone ? ` - ${bol.onsite_contact_phone}` : ''}</span>
        </div>
        ` : ''}
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Material / Load Information</div>
    <div class="info-row">
      <span class="label">Material Type:</span>
      <span class="value">${bol.material_type}</span>
    </div>
    ${bol.material_description ? `
    <div class="info-row">
      <span class="label">Description:</span>
      <span class="value">${bol.material_description}</span>
    </div>
    ` : ''}
    <div class="info-row">
      <span class="label">Load Type:</span>
      <span class="value">${bol.load_type}</span>
    </div>
  </div>

  ${hasWeight ? `
  <div class="weight-summary">
    <div class="weight-row">
      <span>Gross Weight:</span>
      <span>${parseInt(bol.gross_weight).toLocaleString()} lbs</span>
    </div>
    <div class="weight-row">
      <span>Tare Weight:</span>
      <span>${parseInt(bol.tare_weight).toLocaleString()} lbs</span>
    </div>
    <div class="weight-row total">
      <span>Net Weight:</span>
      <span>${parseInt(bol.net_weight).toLocaleString()} lbs (${bol.net_weight_tons} tons)</span>
    </div>
  </div>
  ` : ''}

  <div class="two-col">
    <div class="section">
      <div class="section-title">Carrier Information</div>
      <div class="info-row">
        <span class="label">Carrier/Company:</span>
        <span class="value">${bol.carrier_name || '_______________________'}</span>
      </div>
      <div class="info-row">
        <span class="label">Driver Name:</span>
        <span class="value">${bol.driver_name || '_______________________'}</span>
      </div>
      <div class="info-row">
        <span class="label">Truck #:</span>
        <span class="value">${bol.truck_number || '___________'}</span>
      </div>
      <div class="info-row">
        <span class="label">License Plate:</span>
        <span class="value">${bol.license_plate || '___________'}</span>
      </div>
      <div class="info-row">
        <span class="label">Trailer #:</span>
        <span class="value">${bol.trailer_number || '___________'}</span>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Timing</div>
      <div class="info-row">
        <span class="label">Time In:</span>
        <span class="value">${bol.time_in || '_______________________'}</span>
      </div>
      <div class="info-row">
        <span class="label">Time Out:</span>
        <span class="value">${bol.time_out || '_______________________'}</span>
      </div>
      <div class="info-row">
        <span class="label">Scale Operator:</span>
        <span class="value">${bol.scale_operator_initials || '_______________________'}</span>
      </div>
    </div>
  </div>

  ${bol.notes ? `
  <div class="section">
    <div class="section-title">Notes</div>
    <div style="padding: 8px 10px; background: #fafafa; border-radius: 4px; font-size: 10pt;">
      ${bol.notes}
    </div>
  </div>
  ` : ''}

  <div class="signature-section">
    <div class="signature-box">
      <div class="signature-label">Driver Signature</div>
    </div>
    <div class="signature-box">
      <div class="signature-label">SSW Representative</div>
    </div>
    <div class="signature-box">
      <div class="signature-label">Receiver Signature</div>
    </div>
  </div>

  <div class="footer">
    This document serves as a Bill of Lading${hasWeight ? ' and Weight Ticket' : ''} for the delivery of materials from Soil Seed and Water.
  </div>
</body>
</html>
  `;
}

// ============================================
// CERTIFICATE OF DESTRUCTION (COD) Routes
// ============================================

/**
 * Generate COD number (COD-YYYYMMDD-NNN)
 */
async function generateCODNumber(): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD

  // Count existing CODs today
  const { count, error } = await supabase
    .from('ops_cods')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', `${today.toISOString().split('T')[0]}T00:00:00`)
    .lte('created_at', `${today.toISOString().split('T')[0]}T23:59:59`);

  if (error) throw error;

  const sequence = ((count || 0) + 1).toString().padStart(3, '0');
  return `COD-${dateStr}-${sequence}`;
}

/**
 * GET /api/admin/operations/cods
 * List all CODs with filters
 */
router.get("/cods", async (req: AdminRequest, res) => {
  try {
    const { status, dateFilter } = req.query;

    let query = supabase
      .from('ops_cods')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply status filter
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Apply date filter
    if (dateFilter && dateFilter !== 'all') {
      const now = new Date();
      let startDate = new Date();

      switch (dateFilter) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case '3months':
          startDate.setMonth(now.getMonth() - 3);
          break;
      }

      query = query.gte('created_at', startDate.toISOString());
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    console.error('Error fetching CODs:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch CODs' });
  }
});

/**
 * POST /api/admin/operations/cods
 * Create a new COD (Certificate of Destruction)
 */
router.post("/cods", async (req: AdminRequest, res) => {
  try {
    const {
      dateReceived,
      receivedFrom,
      salesOrder,
      freightOrder,
      vanguardWorkOrder,
      destructionLocation,
      materials, // Array of { material: string, quantity: number, uom: string }
      authorizedByName,
      authorizedByTitle,
      authorizedDate,
      notes
    } = req.body;

    // Validation
    if (!receivedFrom || !destructionLocation || !materials || materials.length === 0) {
      return res.status(400).json({
        message: 'Missing required fields: receivedFrom, destructionLocation, and at least one material'
      });
    }

    // Generate COD number
    const codNumber = await generateCODNumber();

    // Get admin email from token
    const createdBy = req.admin?.email || 'admin@ssw.com';

    // Insert COD
    const { data, error } = await supabase
      .from('ops_cods')
      .insert({
        cod_number: codNumber,
        date_received: dateReceived || new Date().toISOString(),
        received_from: receivedFrom,
        sales_order: salesOrder,
        freight_order: freightOrder,
        vanguard_work_order: vanguardWorkOrder,
        destruction_location: destructionLocation,
        materials: materials, // JSONB field
        authorized_by_name: authorizedByName,
        authorized_by_title: authorizedByTitle,
        authorized_date: authorizedDate,
        notes,
        status: 'completed',
        created_by: createdBy
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error: any) {
    console.error('Error creating COD:', error);
    res.status(500).json({ message: error.message || 'Failed to create COD' });
  }
});

/**
 * GET /api/admin/operations/cods/:id
 * Get a single COD by ID
 */
router.get("/cods/:id", async (req: AdminRequest, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('ops_cods')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ message: 'COD not found' });
    }

    res.json(data);
  } catch (error: any) {
    console.error('Error fetching COD:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch COD' });
  }
});

/**
 * POST /api/admin/operations/cods/delete
 * Delete one or more CODs
 */
router.post("/cods/delete", async (req: AdminRequest, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No IDs provided' });
    }

    const { error } = await supabase
      .from('ops_cods')
      .delete()
      .in('id', ids);

    if (error) throw error;

    res.json({ success: true, deleted: ids.length });
  } catch (error: any) {
    console.error('Error deleting CODs:', error);
    res.status(500).json({ message: error.message || 'Failed to delete CODs' });
  }
});

/**
 * PATCH /api/admin/operations/cods/:id
 * Update an existing COD
 */
router.patch("/cods/:id", async (req: AdminRequest, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Convert camelCase to snake_case
    const snakeCaseUpdates: Record<string, any> = {};
    const fieldMap: Record<string, string> = {
      dateReceived: "date_received",
      receivedFrom: "received_from",
      salesOrder: "sales_order",
      freightOrder: "freight_order",
      vanguardWorkOrder: "vanguard_work_order",
      destructionLocation: "destruction_location",
      materials: "materials",
      authorizedByName: "authorized_by_name",
      authorizedByTitle: "authorized_by_title",
      authorizedDate: "authorized_date",
      notes: "notes",
      status: "status"
    };

    for (const [key, value] of Object.entries(updates)) {
      const snakeKey = fieldMap[key] || key;
      if (fieldMap[key] || key === 'status') {
        snakeCaseUpdates[snakeKey] = value;
      }
    }

    snakeCaseUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('ops_cods')
      .update(snakeCaseUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ message: 'COD not found' });
    }

    res.json(data);
  } catch (error: any) {
    console.error('Error updating COD:', error);
    res.status(500).json({ message: error.message || 'Failed to update COD' });
  }
});

/**
 * GET /api/admin/operations/cods/:id/pdf
 * Generate and download COD PDF
 * Auth: Token can be provided via query param for direct browser access
 */
router.get("/cods/:id/pdf", async (req: AdminRequest, res) => {
  try {
    // Verify token from query param (for direct browser PDF access)
    const token = req.query.token as string;
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    try {
      jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const { id } = req.params;

    // Fetch COD data
    const { data: cod, error } = await supabase
      .from('ops_cods')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!cod) {
      return res.status(404).json({ message: 'COD not found' });
    }

    // Generate HTML for PDF
    const html = generateCODHTML(cod);

    // Generate PDF using Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: {
        top: '0.4in',
        right: '0.4in',
        bottom: '0.4in',
        left: '0.4in'
      }
    });

    await browser.close();

    // Send PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${cod.cod_number}.pdf"`);
    res.end(pdfBuffer);

  } catch (error: any) {
    console.error('Error generating COD PDF:', error);
    res.status(500).json({ message: error.message || 'Failed to generate PDF' });
  }
});

/**
 * Generate HTML for COD PDF
 * Based on the SSW/Vanguard COD template
 */
function generateCODHTML(cod: any): string {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const materials = cod.materials || [];

  // Build materials table rows
  const materialRows = materials.map((m: any, idx: number) => `
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e5e5; font-size: 10pt;">${m.material || ''}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e5e5; font-size: 10pt; text-align: center;">${m.quantity || ''}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e5e5; font-size: 10pt; text-align: center;">${m.uom || ''}</td>
    </tr>
  `).join('');

  // Add empty rows if fewer than 5 materials for consistent PDF layout
  const emptyRows = Math.max(0, 5 - materials.length);
  const emptyRowsHtml = Array(emptyRows).fill(`
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e5e5;">&nbsp;</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e5e5;">&nbsp;</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e5e5;">&nbsp;</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${cod.cod_number} - Certificate of Destruction</title>
  <style>
    @page {
      size: letter;
      margin: 0.4in;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.5;
      color: #000;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 25px;
      padding-bottom: 15px;
      border-bottom: 3px solid #264027;
    }
    .logo-section {
      flex: 1;
    }
    .company-name {
      font-size: 20pt;
      font-weight: bold;
      color: #264027;
      margin-bottom: 4px;
    }
    .tagline {
      font-size: 9pt;
      color: #6f732f;
      margin-bottom: 6px;
    }
    .contact-info {
      font-size: 8pt;
      color: #333;
    }
    .doc-title {
      text-align: right;
      flex: 1;
    }
    .doc-title h1 {
      font-size: 18pt;
      color: #264027;
      margin-bottom: 8px;
    }
    .cod-number {
      font-size: 11pt;
      font-weight: bold;
      color: #000;
    }
    .section {
      margin-bottom: 20px;
    }
    .section-title {
      font-size: 10pt;
      font-weight: bold;
      color: #264027;
      background: #f5f5f5;
      padding: 6px 10px;
      border-left: 4px solid #264027;
      margin-bottom: 10px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
    }
    .info-row {
      display: flex;
      margin-bottom: 8px;
      font-size: 10pt;
    }
    .label {
      font-weight: bold;
      min-width: 150px;
      color: #333;
    }
    .value {
      flex: 1;
      color: #000;
    }
    .materials-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    .materials-table th {
      background: #264027;
      color: white;
      padding: 10px 12px;
      text-align: left;
      font-size: 10pt;
      font-weight: 600;
    }
    .materials-table th:nth-child(2),
    .materials-table th:nth-child(3) {
      text-align: center;
      width: 100px;
    }
    .signature-section {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ccc;
    }
    .signature-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-bottom: 20px;
    }
    .signature-box {
      border-bottom: 1px solid #000;
      padding-top: 30px;
      padding-bottom: 5px;
      min-height: 50px;
    }
    .signature-label {
      font-size: 8pt;
      color: #666;
      margin-top: 4px;
    }
    .disclaimer {
      margin-top: 30px;
      padding: 15px;
      background: #f9f9f9;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      font-size: 9pt;
      color: #444;
      line-height: 1.6;
    }
    .footer {
      margin-top: 25px;
      padding-top: 15px;
      border-top: 1px solid #ccc;
      font-size: 8pt;
      color: #666;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-section">
      <div class="company-name">Soil Seed and Water</div>
      <div class="tagline">Regenerative Soil Solutions</div>
      <div class="contact-info">
        18980 Stanton Rd, Congress, AZ 85332<br>
        Phone: (928) 632-7125<br>
        Email: info@soilseedandwater.com
      </div>
    </div>
    <div class="doc-title">
      <h1>Certificate of Destruction</h1>
      <div class="cod-number">COD #: ${cod.cod_number}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Receipt Information</div>
    <div class="info-grid">
      <div>
        <div class="info-row">
          <span class="label">Received From:</span>
          <span class="value">${cod.received_from || ''}</span>
        </div>
        <div class="info-row">
          <span class="label">Date Received:</span>
          <span class="value">${formatDate(cod.date_received)}</span>
        </div>
      </div>
      <div>
        <div class="info-row">
          <span class="label">Destruction Location:</span>
          <span class="value">${cod.destruction_location || ''}</span>
        </div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Customer Reference Numbers</div>
    <div class="info-grid">
      <div>
        <div class="info-row">
          <span class="label">Sales Order:</span>
          <span class="value">${cod.sales_order || '—'}</span>
        </div>
        <div class="info-row">
          <span class="label">Freight Order:</span>
          <span class="value">${cod.freight_order || '—'}</span>
        </div>
      </div>
      <div>
        <div class="info-row">
          <span class="label">Vanguard Work Order #:</span>
          <span class="value">${cod.vanguard_work_order || '—'}</span>
        </div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Materials Destroyed</div>
    <table class="materials-table">
      <thead>
        <tr>
          <th>Material</th>
          <th>Quantity</th>
          <th>UOM</th>
        </tr>
      </thead>
      <tbody>
        ${materialRows}
        ${emptyRowsHtml}
      </tbody>
    </table>
  </div>

  <div class="signature-section">
    <div class="section-title">Authorization</div>
    <div class="signature-row">
      <div>
        <div class="info-row">
          <span class="label">Authorized By:</span>
          <span class="value">${cod.authorized_by_name || ''}</span>
        </div>
        <div class="info-row">
          <span class="label">Title:</span>
          <span class="value">${cod.authorized_by_title || ''}</span>
        </div>
      </div>
      <div>
        <div class="info-row">
          <span class="label">Date:</span>
          <span class="value">${formatDate(cod.authorized_date)}</span>
        </div>
      </div>
    </div>
    <div class="signature-row">
      <div>
        <div class="signature-box"></div>
        <div class="signature-label">Authorized Signature</div>
      </div>
      <div>
        <div class="signature-box"></div>
        <div class="signature-label">SSW Representative Signature</div>
      </div>
    </div>
  </div>

  <div class="disclaimer">
    <strong>Certification:</strong> Vanguard warrants that all organic materials listed above were presented and have been destroyed for the purpose of the recycling of organic materials into soil amendments and compost products. The destruction was performed in accordance with applicable regulations and industry standards.
  </div>

  ${cod.notes ? `
  <div class="section" style="margin-top: 15px;">
    <div class="section-title">Notes</div>
    <div style="padding: 8px 10px; background: #fafafa; border-radius: 4px; font-size: 9pt;">
      ${cod.notes}
    </div>
  </div>
  ` : ''}

  <div class="footer">
    Certificate of Destruction - ${cod.cod_number} | Generated by Soil Seed and Water Operations System
  </div>
</body>
</html>
  `;
}

// ============================================
// SCHEDULED LOADS (Logistics Calendar) Routes
// ============================================

/**
 * GET /api/admin/operations/scheduled-loads
 * List scheduled loads with optional week filter
 */
router.get("/scheduled-loads", async (req: AdminRequest, res) => {
  try {
    const { weekStart, weekEnd } = req.query;

    let query = supabase
      .from('scheduled_loads')
      .select('*')
      .order('date', { ascending: true });

    // Apply date range filter if provided
    if (weekStart) {
      query = query.gte('date', weekStart as string);
    }
    if (weekEnd) {
      query = query.lte('date', weekEnd as string);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    console.error('Error fetching scheduled loads:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch scheduled loads' });
  }
});

/**
 * POST /api/admin/operations/scheduled-loads
 * Create a new scheduled load
 */
router.post("/scheduled-loads", async (req: AdminRequest, res) => {
  try {
    const {
      date,
      timeSlot,
      routeType,
      customer,
      destination,
      material,
      quantity,
      driver,
      carrierName,
      truckNumber,
      status,
      deal,
      contactName,
      contactPhone,
      notes
    } = req.body;

    // Validation
    if (!date || !routeType || !customer || !destination || !material) {
      return res.status(400).json({
        message: 'Missing required fields: date, routeType, customer, destination, material'
      });
    }

    // Get admin email from token
    const createdBy = req.admin?.email || 'admin@ssw.com';

    // Insert scheduled load
    const { data, error } = await supabase
      .from('scheduled_loads')
      .insert({
        date,
        time_slot: timeSlot,
        route_type: routeType,
        customer,
        destination,
        material,
        quantity,
        driver,
        carrier_name: carrierName,
        truck_number: truckNumber,
        status: status || 'scheduled',
        deal,
        contact_name: contactName,
        contact_phone: contactPhone,
        notes,
        created_by: createdBy
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error: any) {
    console.error('Error creating scheduled load:', error);
    res.status(500).json({ message: error.message || 'Failed to create scheduled load' });
  }
});

/**
 * GET /api/admin/operations/scheduled-loads/:id
 * Get a single scheduled load by ID
 */
router.get("/scheduled-loads/:id", async (req: AdminRequest, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('scheduled_loads')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ message: 'Scheduled load not found' });
    }

    res.json(data);
  } catch (error: any) {
    console.error('Error fetching scheduled load:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch scheduled load' });
  }
});

/**
 * PATCH /api/admin/operations/scheduled-loads/:id
 * Update an existing scheduled load
 */
router.patch("/scheduled-loads/:id", async (req: AdminRequest, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Convert camelCase to snake_case
    const snakeCaseUpdates: Record<string, any> = {};
    const fieldMap: Record<string, string> = {
      date: "date",
      timeSlot: "time_slot",
      routeType: "route_type",
      customer: "customer",
      destination: "destination",
      material: "material",
      quantity: "quantity",
      driver: "driver",
      carrierName: "carrier_name",
      truckNumber: "truck_number",
      status: "status",
      deal: "deal",
      contactName: "contact_name",
      contactPhone: "contact_phone",
      notes: "notes"
    };

    for (const [key, value] of Object.entries(updates)) {
      const snakeKey = fieldMap[key] || key;
      if (fieldMap[key]) {
        snakeCaseUpdates[snakeKey] = value;
      }
    }

    snakeCaseUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('scheduled_loads')
      .update(snakeCaseUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ message: 'Scheduled load not found' });
    }

    res.json(data);
  } catch (error: any) {
    console.error('Error updating scheduled load:', error);
    res.status(500).json({ message: error.message || 'Failed to update scheduled load' });
  }
});

/**
 * DELETE /api/admin/operations/scheduled-loads/:id
 * Delete a scheduled load
 */
router.delete("/scheduled-loads/:id", async (req: AdminRequest, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('scheduled_loads')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true, deleted: id });
  } catch (error: any) {
    console.error('Error deleting scheduled load:', error);
    res.status(500).json({ message: error.message || 'Failed to delete scheduled load' });
  }
});

/**
 * POST /api/admin/operations/scheduled-loads/bulk-delete
 * Delete multiple scheduled loads
 */
router.post("/scheduled-loads/bulk-delete", async (req: AdminRequest, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No IDs provided' });
    }

    const { error } = await supabase
      .from('scheduled_loads')
      .delete()
      .in('id', ids);

    if (error) throw error;

    res.json({ success: true, deleted: ids.length });
  } catch (error: any) {
    console.error('Error deleting scheduled loads:', error);
    res.status(500).json({ message: error.message || 'Failed to delete scheduled loads' });
  }
});

export default router;
