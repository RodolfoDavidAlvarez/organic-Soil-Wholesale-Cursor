/**
 * Operations System - BOL Management API
 * Create, manage, and generate PDF BOLs/Weight Tickets
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

    const emailBody = customMessage || `Please find attached the Bill of Lading (${bol.bol_number}) for your delivery.

Material: ${bol.material_type}
Delivery Date: ${new Date(bol.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
Destination: ${bol.destination_address}, ${bol.destination_city}, ${bol.destination_state} ${bol.destination_zip}

If you have any questions, please don't hesitate to contact us.

Best regards,
Soil Seed and Water
(928) 632-7125`;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Soil Seed and Water <info@soilseedandwater.com>',
        to: [recipientEmail],
        subject: `Bill of Lading - ${bol.bol_number}`,
        text: emailBody,
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
