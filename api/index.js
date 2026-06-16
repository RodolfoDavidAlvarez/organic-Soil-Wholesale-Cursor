// Vercel Serverless Function with CRM Business Card Capture

// Lazy initialize clients
let supabase = null;
let anthropic = null;
let openai = null;
let resend = null;

async function getSupabase() {
  if (!supabase) {
    const { createClient } = await import('@supabase/supabase-js');
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  }
  return supabase;
}

async function getAnthropic() {
  if (!anthropic) {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return anthropic;
}

async function getOpenAI() {
  if (!openai) {
    const OpenAI = (await import('openai')).default;
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

async function getResend() {
  if (!resend) {
    const { Resend } = await import('resend');
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

// Admin-only failure monitor: logs every input failure to system_errors and
// emails Rodo (rate-limited to once per path per 30 min). Never throws.
const FAILURE_ALERT_TO = 'rodolfo@bettersystems.ai';
async function reportFailure({ kind, path, method, status, message }) {
  try {
    const db = await getSupabase();
    const { data: row } = await db
      .from('system_errors')
      .insert({ kind, path, method, status, message: String(message || '').slice(0, 500) })
      .select('id')
      .single();
    // Rate-limit: skip the email if we already alerted for this path in the last 30 min.
    const since = new Date(Date.now() - 30 * 60000).toISOString();
    const { count } = await db
      .from('system_errors')
      .select('id', { count: 'exact', head: true })
      .eq('path', path)
      .eq('alerted', true)
      .gte('created_at', since);
    if ((count || 0) > 0) return;
    if (!process.env.RESEND_API_KEY) return;
    const resendClient = await getResend();
    await resendClient.emails.send({
      from: 'OSW Alerts <info@soilseedandwater.com>',
      to: FAILURE_ALERT_TO,
      subject: `⚠️ OSW input failure: ${method} ${path} (${status})`,
      text:
        `A submission failed on organicsoilwholesale.com.\n\n` +
        `Type: ${kind}\nEndpoint: ${method} ${path}\nStatus: ${status}\n` +
        `Error: ${message}\nTime: ${new Date().toISOString()}\n\n` +
        `Automated admin alert (you only). Further alerts for this endpoint are paused 30 min.`,
    });
    if (row?.id) await db.from('system_errors').update({ alerted: true }).eq('id', row.id);
  } catch (e) {
    console.error('[reportFailure] non-fatal:', e?.message || e);
  }
}

// Segment classification keywords
const SEGMENT_KEYWORDS = {
  operator: ['compost', 'processor', 'facility', 'operations', 'plant manager', 'composting', 'processing'],
  municipal: ['city', 'county', 'municipal', 'solid waste', 'public works', 'government', 'sustainability officer', 'director'],
  equipment: ['equipment', 'machinery', 'technology', 'systems', 'solutions', 'manufacturing', 'sales rep', 'vendor'],
  policy: ['policy', 'regulatory', 'epa', 'deq', 'environmental', 'advocacy', 'compliance', 'regulator'],
  esg: ['esg', 'sustainability', 'foundation', 'csr', 'corporate', 'impact', 'responsibility'],
  education: ['university', 'college', 'student', 'professor', 'research', 'education', 'academic'],
  farmer_vineyard: ['vineyard', 'winery', 'wine', 'grapes', 'viticulture'],
  farmer_orchard: ['orchard', 'pistachio', 'avocado', 'citrus', 'almond', 'apple', 'peach', 'tree fruit', 'nuts'],
  farmer_general: ['farm', 'agriculture', 'grower', 'ranch', 'crop', 'farmer', 'ag'],
  waste_hauler: ['hauler', 'waste management', 'logistics', 'trucking', 'disposal', 'collection', 'hauling'],
  landscaper: ['landscape', 'nursery', 'garden center', 'horticulture', 'lawn', 'landscaping'],
};

function classifySegment(title, company) {
  const searchText = `${title} ${company}`.toLowerCase();
  for (const [segment, keywords] of Object.entries(SEGMENT_KEYWORDS)) {
    for (const keyword of keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        return segment;
      }
    }
  }
  return 'other';
}

async function enrichCompany(company, website) {
  if (!website && !company) return null;

  try {
    let websiteContent = '';
    if (website) {
      let cleanWebsite = website.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
      const jinaUrl = `https://r.jina.ai/https://${cleanWebsite}`;

      try {
        const response = await fetch(jinaUrl, {
          headers: { 'Accept': 'text/plain' },
          signal: AbortSignal.timeout(15000),
        });

        if (response.ok) {
          const content = await response.text();
          websiteContent = content.substring(0, 4000);
        }
      } catch (e) {
        console.log('[WebEnrich] Jina failed, trying direct fetch');
        try {
          const directResponse = await fetch(`https://${cleanWebsite}`, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            signal: AbortSignal.timeout(5000),
          });
          if (directResponse.ok) {
            const html = await directResponse.text();
            const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
            const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
            const title = titleMatch?.[1]?.trim() || '';
            const description = descMatch?.[1]?.trim() || '';
            if (title || description) {
              websiteContent = `Company: ${company}\nTitle: ${title}\nDescription: ${description}`;
            }
          }
        } catch (e2) {}
      }
    }

    if (websiteContent.length > 100) {
      const ai = await getAnthropic();
      const response = await ai.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: `Summarize this company in 2-3 sentences. Focus on what they DO. If you can't determine, say "Unable to determine".\n\nCompany: ${company}\nWebsite: ${websiteContent}\n\nReturn ONLY the summary.`
        }]
      });
      const summary = response.content[0]?.text?.trim();
      if (summary && !summary.toLowerCase().includes('unable to determine')) {
        return summary;
      }
    }
    return null;
  } catch (error) {
    console.error('Error enriching company:', error);
    return null;
  }
}

async function generateFollowUpEmail(input) {
  const { contact, segment, event, contextNotes, companyResearch } = input;
  const ai = await getAnthropic();

  const prompt = `You are Rodo Alvarez from Soil Seed & Water, writing a brief follow-up email after meeting someone at a conference.

RULES:
1. Sound like a REAL PERSON - casual, friendly
2. Keep it to 3-5 sentences MAX
3. Use contractions (don't, won't, that's, I'm)
4. NO corporate speak, NO buzzwords
5. NO pitching products - just a friendly connection
6. Sign off as just "Rodo"

${companyResearch ? `WEBSITE RESEARCH - mention something specific from this:
${companyResearch}` : ''}

${contextNotes ? `CONVERSATION NOTES:\n${contextNotes}` : ''}

CONTACT:
- Name: ${contact.firstName} ${contact.lastName}
- Company: ${contact.company || 'Unknown'}
- Title: ${contact.title || 'Unknown'}
- Event: ${event}

${!contextNotes && !companyResearch ? 'NOTE: No specific context. Write a clean, friendly generic email.' : ''}

Write ONLY the email body. No subject line. No signature block.`;

  try {
    const response = await ai.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }]
    });

    const emailBody = response.content[0]?.text?.trim();
    if (!emailBody || emailBody.length < 50) throw new Error('Email too short');

    return {
      subject: `Great meeting you at ${event}, ${contact.firstName}`,
      body: emailBody,
      tokensUsed: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0),
    };
  } catch (error) {
    return {
      subject: `Great meeting you at ${event}, ${contact.firstName}`,
      body: `Hey ${contact.firstName},\n\nGood meeting you at ${event}. Always cool to connect with people in this space.\n\nLet me know if you ever want to grab coffee and talk shop.\n\nRodo`,
      tokensUsed: 0,
    };
  }
}

function validateEmail(email) {
  const issues = [];
  if (!email.subject || email.subject.length < 10) issues.push('Subject too short');
  if (!email.body || email.body.length < 50) issues.push('Body too short');
  if (/\[.*?\]/.test(email.body) || /\{.*?\}/.test(email.body)) issues.push('Contains placeholders');
  return { valid: issues.length === 0, issues };
}

async function ensureRepresentativeForAdmin(db, adminId) {
  const { data: existingRep } = await db.from("representatives").select("id").eq("admin_id", adminId).single();
  if (existingRep) return existingRep.id;

  const { data: admin } = await db.from("admin_users").select("*").eq("id", adminId).single();
  if (!admin) return null;

  const { data: newRep, error } = await db.from("representatives").insert({
    admin_id: adminId,
    name: admin.full_name || "Admin",
    email: admin.email,
    phone: admin.phone,
    photo_url: admin.photo_url,
    slug: admin.slug,
    title: admin.title || "Team Member",
    bio: admin.bio,
    is_active: true,
  }).select("id").single();

  return newRep?.id || null;
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = new URL(req.url, `https://${req.headers.host}`);
  const path = url.pathname;

  try {
    // Health check
    if (path === '/api/health') {
      return res.json({ status: 'ok', timestamp: new Date().toISOString() });
    }

    const db = await getSupabase();

    // ============ CONTACT FORM ============
    // Public contact form. Records to contact_submissions and forwards to the MOS
    // sales portal as a lead so the rep team sees/claims it. (Was missing in prod —
    // the route only existed in the dev Express server, so submissions 404'd.)
    if (path === '/api/contact/submit' && req.method === 'POST') {
      const { name, email, phone, company, subject, message } = req.body || {};
      if (!name || !email || !message) {
        return res.status(400).json({ error: 'Name, email, and message are required' });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
      const submittedAt = new Date().toISOString();
      const { data: sub, error: subErr } = await db
        .from('contact_submissions')
        .insert({ name, email, phone, company, subject, message, status: 'new', created_at: submittedAt })
        .select()
        .single();
      if (subErr) {
        console.error('[contact/submit] insert failed:', subErr);
        return res.status(500).json({ error: 'Failed to submit contact form' });
      }
      // Forward to the MOS sales portal as a lead (awaited — serverless kills
      // fire-and-forget after the response returns).
      try {
        const secret = process.env.MOS_LEAD_INGEST_SECRET;
        if (secret) {
          const r = await fetch(process.env.MOS_LEAD_INGEST_URL || 'https://myorganicsoil.com/api/leads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Lead-Source-Key': secret },
            body: JSON.stringify({
              full_name: name,
              email,
              phone: phone || undefined,
              company: company || undefined,
              message: subject ? `${subject}\n\n${message}` : message,
              source: 'osw_contact_form',
              source_url: 'https://organicsoilwholesale.com/contact',
              source_data: { osw_contact_submission_id: sub.id, subject },
            }),
          });
          if (!r.ok) console.error('[contact/submit] MOS forward', r.status, (await r.text().catch(() => '')).slice(0, 200));
        } else {
          console.warn('[contact/submit] MOS_LEAD_INGEST_SECRET not set — lead not forwarded');
        }
      } catch (e) {
        console.error('[contact/submit] MOS forward error:', e?.message || e);
      }
      return res.json({
        success: true,
        message: "Thank you for contacting us. We'll get back to you soon!",
        submissionId: sub.id,
      });
    }

    // ============ CRM ENDPOINTS ============

    // Analyze business card with Claude Vision (accepts base64 image)
    const analyzeMatch = path.match(/^\/api\/representatives\/([^\/]+)\/analyze-business-card$/);
    if (analyzeMatch && req.method === 'POST') {
      const { imageBase64, mimeType } = req.body || {};

      if (!imageBase64) {
        return res.status(400).json({ error: 'No image provided. Send imageBase64 field.' });
      }

      // Extract base64 data, handling data URL format
      let base64Data = imageBase64;
      let detectedMimeType = mimeType || 'image/jpeg';

      // If it's a data URL, extract the base64 part and detect mime type
      if (imageBase64.includes(',')) {
        const parts = imageBase64.split(',');
        base64Data = parts[1];
        // Extract mime type from data URL if present
        const dataUrlMatch = parts[0].match(/data:([^;]+)/);
        if (dataUrlMatch) {
          detectedMimeType = dataUrlMatch[1];
        }
      }

      // Validate mime type - Claude supports these
      const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validImageTypes.includes(detectedMimeType)) {
        // Default to jpeg if unknown
        detectedMimeType = 'image/jpeg';
      }

      const ai = await getAnthropic();
      const response = await ai.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: detectedMimeType,
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: `Extract contact information from this business card. Return ONLY valid JSON:
{
  "firstName": "first name only",
  "lastName": "last name only",
  "email": "email exactly as shown",
  "phone": "phone exactly as shown",
  "companyName": "company name",
  "title": "job title",
  "address": "full address if visible",
  "website": "website URL if shown"
}
Use "" for fields you cannot clearly read. NEVER guess.`
            },
          ],
        }],
      });

      const content = response.content[0]?.text || '';
      let extractedData;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        extractedData = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
      } catch (e) {
        extractedData = {};
      }

      const defaults = { firstName: '', lastName: '', email: '', phone: '', companyName: '', title: '', address: '', website: '' };
      extractedData = { ...defaults, ...extractedData };

      return res.json({ success: true, extractedData });
    }

    // Classify segment
    if (path === '/api/representatives/classify-segment' && req.method === 'POST') {
      const { title, company } = req.body || {};
      if (!title && !company) return res.status(400).json({ error: 'Title or company required' });
      return res.json({ segment: classifySegment(title || '', company || '') });
    }

    // Enrich company
    if (path === '/api/representatives/enrich-company' && req.method === 'POST') {
      const { company, website } = req.body || {};
      if (!company && !website) return res.status(400).json({ error: 'Company or website required' });
      const companyContext = await enrichCompany(company, website);
      return res.json({ success: true, companyContext, hasData: !!companyContext });
    }

    // Transcribe audio (accepts base64 audio)
    if (path === '/api/representatives/transcribe' && req.method === 'POST') {
      const { audioBase64, mimeType } = req.body || {};
      if (!audioBase64) return res.status(400).json({ error: 'No audio provided. Send audioBase64 field.' });
      if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: 'OPENAI_API_KEY not configured' });

      // Determine file extension from mime type
      const mimeToExt = {
        'audio/webm': 'webm',
        'audio/webm;codecs=opus': 'webm',
        'audio/mp4': 'mp4',
        'audio/mpeg': 'mp3',
        'audio/mp3': 'mp3',
        'audio/wav': 'wav',
        'audio/ogg': 'ogg',
        'audio/flac': 'flac',
        'audio/m4a': 'm4a',
      };
      const detectedMime = mimeType || 'audio/webm';
      const ext = mimeToExt[detectedMime] || mimeToExt[detectedMime.split(';')[0]] || 'webm';

      // Convert base64 to buffer - handle data URL format
      let base64Data = audioBase64;
      if (base64Data.includes(',')) {
        base64Data = base64Data.split(',')[1];
      }
      const audioBuffer = Buffer.from(base64Data, 'base64');

      // Write to temp file (Vercel allows /tmp writes)
      const fs = await import('fs');
      const path_module = await import('path');
      const tempPath = path_module.join('/tmp', `audio-${Date.now()}.${ext}`);
      await fs.promises.writeFile(tempPath, audioBuffer);

      const ai = await getOpenAI();

      // Create a readable stream from the temp file
      const fileStream = fs.createReadStream(tempPath);

      const transcription = await ai.audio.transcriptions.create({
        file: fileStream,
        model: 'whisper-1',
        language: 'en',
      });

      // Clean up temp file
      try {
        await fs.promises.unlink(tempPath);
      } catch (e) {
        // Ignore cleanup errors
      }

      return res.json({ success: true, text: transcription.text });
    }

    // Generate email
    if (path === '/api/representatives/generate-email' && req.method === 'POST') {
      const { firstName, lastName, email, company, title, website, segment, event, contextNotes, companyContext } = req.body || {};
      if (!firstName || !email) return res.status(400).json({ error: 'First name and email required' });

      const contact = { firstName, lastName: lastName || '', email, company: company || '', title: title || '', website };
      const input = { contact, segment: segment || 'other', event: event || 'the conference', contextNotes, companyResearch: companyContext };
      const generatedEmail = await generateFollowUpEmail(input);
      const validation = validateEmail(generatedEmail);

      return res.json({ success: true, email: generatedEmail, validation });
    }

    // Send email
    if (path === '/api/representatives/send-email' && req.method === 'POST') {
      const { contactId, to, subject, body, from } = req.body || {};
      if (!to || !subject || !body) return res.status(400).json({ error: 'To, subject, and body required' });

      const emailClient = await getResend();
      const { data: emailData, error: emailError } = await emailClient.emails.send({
        from: from || 'Rodo Alvarez <ralvarez@soilseedandwater.com>',
        to: [to],
        subject,
        text: body,
      });

      if (emailError) throw new Error(emailError.message);

      if (contactId) {
        await db.from('representative_contacts').update({
          first_email_sent_at: new Date().toISOString(),
          first_email_subject: subject,
          first_email_body: body,
          status: 'contacted',
          pipeline_stage: 'awareness',
        }).eq('id', contactId);
      }

      return res.json({ success: true, messageId: emailData?.id, sentAt: new Date().toISOString() });
    }

    // Submit business card enhanced
    const submitMatch = path.match(/^\/api\/representatives\/([^\/]+)\/submit-business-card-enhanced$/);
    if (submitMatch && req.method === 'POST') {
      const slug = submitMatch[1];
      const {
        firstName, lastName, email, phone, companyName, title, address, website,
        segment, leadSource, partnerOwner, contextNotes, companyContext,
        generateEmail: genEmail, sendEmail: sendIt, event
      } = req.body || {};

      if (!firstName || !lastName) return res.status(400).json({ error: 'First name and last name required' });

      // Find representative or admin
      let adminId = null, representativeId = null;
      const { data: representative } = await db.from('representatives').select('id, admin_id').eq('slug', slug).eq('is_active', true).single();

      if (representative) {
        representativeId = representative.id;
        adminId = representative.admin_id;
      } else {
        const { data: admin } = await db.from('admin_users').select('id').eq('slug', slug).eq('has_landing_page', true).eq('is_active', true).single();
        if (admin) {
          adminId = admin.id;
          representativeId = await ensureRepresentativeForAdmin(db, admin.id);
          if (!representativeId) return res.status(500).json({ error: 'Failed to process contact' });
        } else {
          return res.status(404).json({ error: 'Contact card not found' });
        }
      }

      const finalSegment = segment || classifySegment(title || '', companyName || '');

      const contactData = {
        representative_id: representativeId,
        admin_id: adminId,
        first_name: firstName,
        last_name: lastName,
        email: email || null,
        phone: phone || null,
        company_name: companyName || null,
        title: title || null,
        website: website || null,
        message: contextNotes || null,
        source: 'business_card_scan',
        status: 'new',
        segment: finalSegment,
        lead_source: leadSource || 'other',
        partner_owner: partnerOwner || 'ssw',
        context_notes: contextNotes || null,
        company_context: companyContext || null,
        pipeline_stage: 'awareness',
        metadata: { address: address || null, scanned_at: new Date().toISOString(), event: event || null },
      };

      const { data: contact, error: insertError } = await db.from('representative_contacts').insert(contactData).select().single();
      if (insertError) throw insertError;

      // Generate and send email if requested
      let emailResult = null;
      if (genEmail === 'true' || genEmail === true) {
        const contactInfo = { firstName, lastName: lastName || '', email: email || '', company: companyName || '', title: title || '', website };
        const emailInput = { contact: contactInfo, segment: finalSegment, event: event || 'the conference', contextNotes, companyResearch: companyContext };
        const generatedEmail = await generateFollowUpEmail(emailInput);
        const validation = validateEmail(generatedEmail);
        emailResult = { generated: true, email: generatedEmail, validation, sent: false };

        if ((sendIt === 'true' || sendIt === true) && email && validation.valid) {
          try {
            const emailClient = await getResend();
            const { data: sendData, error: sendError } = await emailClient.emails.send({
              from: 'Rodo Alvarez <ralvarez@soilseedandwater.com>',
              to: [email],
              subject: generatedEmail.subject,
              text: generatedEmail.body,
            });
            if (!sendError) {
              emailResult.sent = true;
              emailResult.messageId = sendData?.id;
              await db.from('representative_contacts').update({
                first_email_sent_at: new Date().toISOString(),
                first_email_subject: generatedEmail.subject,
                first_email_body: generatedEmail.body,
                status: 'contacted',
              }).eq('id', contact.id);
            }
          } catch (e) {
            emailResult.sendError = e.message;
          }
        }
      }

      return res.status(201).json({ success: true, contact, segment: finalSegment, email: emailResult });
    }

    // ============ PAY & PICKUP ENDPOINTS ============

    // Get pay & pickup products with inventory
    const inventoryProductsMatch = path.match(/^\/api\/inventory\/products\/(\d+)$/);
    if (inventoryProductsMatch && req.method === 'GET') {
      const locationId = parseInt(inventoryProductsMatch[1]);
      const payAndPickup = url.searchParams.get('payAndPickup') === 'true';
      const includeOutOfStock = url.searchParams.get('includeOutOfStock') === 'true';

      // Query inventory joined with products (exclude size_price_options to use inventory pricing)
      let query = db.from('inventory').select(`
        *,
        products!inner (
          id, name, description, category, image_url, texture_photo_url,
          display_title, marketing_title, ingredients, recommended_uses,
          target_audience, story, usage, certifications, features,
          additional_images, available_size_options, pay_and_pickup_badge,
          pay_and_pickup_description, pay_and_pickup_hero_image,
          pay_and_pickup_display_order, is_pay_and_pickup_enabled,
          product_video_url, product_video_title
        )
      `).eq('location_id', locationId);

      if (!includeOutOfStock && !payAndPickup) {
        query = query.gt('quantity_available', 0);
      }

      if (payAndPickup) {
        query = query.eq('products.is_pay_and_pickup_enabled', true);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Retail bag sizes for pay & pickup (filter out wholesale pallet/truckload sizes)
      const retailSizes = new Set(['9lb bag', '25lb bag', '1 cf bag', '1.5 cf bag', '2 cf bag']);
      const sizeOrder = { '9lb bag': 1, '25lb bag': 2, '1 cf bag': 3, '1.5 cf bag': 4, '2 cf bag': 5, 'bulk (50lb)': 6, 'bulk pickup': 7, 'pallet of 9 lb bags': 8, 'pallet of 1cf bags': 9, '2.2 cubic yard tote': 10, '2.2 cy tote': 10, 'truckload': 11, 'bulk delivery': 12 };

      // Group by product, filtering to retail sizes for P&P
      const productMap = new Map();
      for (const item of (data || [])) {
        if (payAndPickup && !item.products?.is_pay_and_pickup_enabled) continue;

        // For pay & pickup, only include retail bag sizes (skip pallets, truckloads, etc.)
        const sizeNorm = item.size_option.toLowerCase();
        if (payAndPickup && !retailSizes.has(sizeNorm)) continue;

        // Skip $0 or missing prices
        if (!item.price || item.price <= 0) continue;

        const pid = item.product_id;
        const record = productMap.get(pid) || { ...item.products, inventory: [], sizePriceOptions: [] };

        record.inventory.push({
          size_option: item.size_option,
          quantity_available: item.quantity_available,
          quantity_reserved: item.quantity_reserved || 0,
          price: item.price,
          pricing: { base_price: item.price, final_price: item.price, discount_amount: 0, tier_applied: 'regular', savings: 0 }
        });

        const sizeKey = sizeNorm.replace(/\s+/g, '-').replace(/[()]/g, '');
        const displayOrder = sizeOrder[sizeNorm] || 99;
        if (!record.sizePriceOptions.some(o => o.key === sizeKey)) {
          record.sizePriceOptions.push({ key: sizeKey, label: item.size_option, price: item.price, priceCents: Math.round(item.price * 100), isActive: true, displayOrder });
        }

        productMap.set(pid, record);
      }

      // Sort size options and products
      for (const product of productMap.values()) {
        product.sizePriceOptions.sort((a, b) => a.displayOrder - b.displayOrder);
        // Override size_price_options with inventory-based pricing (prevents frontend from using wholesale DB prices)
        product.size_price_options = product.sizePriceOptions;
      }
      const products = Array.from(productMap.values()).sort((a, b) => (a.pay_and_pickup_display_order || 0) - (b.pay_and_pickup_display_order || 0));

      return res.json({ success: true, location_id: locationId, products });
    }

    // Create pay & pickup order
    if (path === '/api/pay-and-pickup/create-order' && req.method === 'POST') {
      const { customerInfo, items, pickupType, locationId = 1 } = req.body || {};
      if (!customerInfo || !items || !items.length) return res.status(400).json({ error: 'Customer info and items required' });

      // Calculate totals
      let subtotal = 0;
      const orderItems = items.map(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        return { product_id: item.productId, product_name: item.productName, size_option: item.size, quantity: item.quantity, unit_price: item.price, total_price: itemTotal };
      });

      const taxRate = 0.086;
      const tax = Math.round(subtotal * taxRate * 100) / 100;
      const total = Math.round((subtotal + tax) * 100) / 100;

      // Create order
      const orderNumber = 'PP-' + Date.now().toString(36).toUpperCase();
      const { data: order, error: orderError } = await db.from('orders').insert({
        order_number: orderNumber,
        customer_name: customerInfo.name,
        customer_phone: customerInfo.phone,
        customer_email: customerInfo.email || null,
        pickup_type: pickupType || 'pickup',
        location_id: locationId,
        subtotal, tax, total,
        status: 'pending',
        items: orderItems,
        created_at: new Date().toISOString()
      }).select().single();

      if (orderError) throw orderError;

      return res.json({
        success: true,
        orderId: order.id,
        orderNumber,
        subtotal, tax, total,
        estimatedReadyTime: '10-15 minutes'
      });
    }

    // POST /api/pay-and-pickup/notify-arrival — customer tapped "Notify a representative"
    if (path === '/api/pay-and-pickup/notify-arrival' && req.method === 'POST') {
      const { customerInfo, vehicleInfo } = req.body || {};
      if (!customerInfo?.name || !customerInfo?.phone) {
        return res.status(400).json({ error: 'Customer name and phone are required' });
      }

      const { data, error } = await db.from('arrival_notifications').insert({
        customer_name: customerInfo.name,
        customer_phone: customerInfo.phone,
        vehicle_info: vehicleInfo || 'Walk-in / yard QR check-in',
        arrival_time: new Date().toISOString(),
        status: 'waiting',
      }).select().single();

      if (error) {
        console.error('[notify-arrival] insert error:', error);
        return res.status(500).json({ error: 'Failed to notify arrival' });
      }

      const arrivalDetails = {
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        vehicleInfo: vehicleInfo || 'Walk-in / yard QR check-in',
        arrivalTime: data.arrival_time,
        notificationId: data.id,
      };

      // SMS → Sabrina, Kash, Rodolfo (YARD_ADMIN_PHONES env)
      const yardPhones = (process.env.YARD_ADMIN_PHONES || process.env.RODO_PHONE || '')
        .split(',').map((s) => s.trim()).filter(Boolean);
      const smsBody = [
        'CUSTOMER AT YARD — needs rep',
        arrivalDetails.customerName,
        arrivalDetails.customerPhone,
        arrivalDetails.vehicleInfo,
        '',
        '1634 N 19th Ave · go meet them at the gate',
      ].join('\n');

      if (yardPhones.length && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
        // Direct REST call — the twilio npm package is not a dependency of this project.
        const twilioAuth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
        const smsResults = await Promise.allSettled(yardPhones.map(async (to) => {
          const resp = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`, {
            method: 'POST',
            headers: {
              Authorization: `Basic ${twilioAuth}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({ To: to, From: process.env.TWILIO_PHONE_NUMBER, Body: smsBody }).toString(),
          });
          if (!resp.ok) {
            const errText = await resp.text().catch(() => '');
            throw new Error(`twilio ${resp.status}: ${errText.slice(0, 200)}`);
          }
          return to;
        }));
        const smsSent = smsResults.filter((r) => r.status === 'fulfilled').length;
        smsResults.forEach((r) => { if (r.status === 'rejected') console.error('[notify-arrival] SMS failed:', r.reason?.message || r.reason); });
        console.log(`[notify-arrival] SMS sent to ${smsSent}/${yardPhones.length} yard admin(s)`);
      } else {
        console.warn('[notify-arrival] Twilio or YARD_ADMIN_PHONES not configured — skipping SMS');
      }

      // Expo push via MOS (myorganicsoil.com iOS app). Fire-and-AWAIT —
      // Vercel kills fire-and-forget fetches when the response is sent.
      const mosSecret = process.env.MOS_LEAD_INGEST_SECRET;
      if (mosSecret) {
        try {
          const phoneDigits = String(customerInfo.phone).replace(/\D/g, '').slice(-10);
          const mosResp = await fetch(process.env.MOS_LEAD_INTAKE_URL || 'https://myorganicsoil.com/api/leads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Lead-Source-Key': mosSecret },
            body: JSON.stringify({
              full_name: customerInfo.name,
              email: `yard+${phoneDigits || 'walkin'}@organicsoilwholesale.com`,
              phone: customerInfo.phone,
              company: 'Yard walk-in',
              message: `Customer at the OSW yard gate — needs a representative. ${arrivalDetails.vehicleInfo}`,
              source: 'osw_yard_walkin',
              source_url: 'https://organicsoilwholesale.com/qr',
              source_data: { notification_id: data.id, vehicle_info: arrivalDetails.vehicleInfo },
            }),
          });
          if (!mosResp.ok) {
            const t = await mosResp.text().catch(() => '');
            console.error(`[notify-arrival] MOS push fan-out → ${mosResp.status}: ${t.slice(0, 200)}`);
          } else {
            console.log('[notify-arrival] MOS push fan-out → OK');
          }
        } catch (mosErr) {
          console.error('[notify-arrival] MOS push fan-out error:', mosErr?.message || mosErr);
        }
      }

      // Admin email
      try {
        const { data: admins } = await db.from('admin_notifications')
          .select('email').eq('active', true).eq('notify_arrivals', true);
        const adminEmails = admins?.length
          ? admins.map((a) => a.email)
          : ['ralvarez@soilseedandwater.com'];
        const r = await getResend();
        const vehicleLabel = arrivalDetails.vehicleInfo || 'Vehicle Info Not Provided';
        await Promise.allSettled(adminEmails.map((to) =>
          r.emails.send({
            from: 'Organic Soil Wholesale <info@soilseedandwater.com>',
            replyTo: 'ralvarez@soilseedandwater.com',
            to,
            subject: `[URGENT] Customer Arrival: ${arrivalDetails.customerName} - ${vehicleLabel}`,
            html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
              <div style="background:#dc2626;color:#fff;padding:24px;text-align:center">
                <h1 style="margin:0">Customer Has Arrived!</h1>
                <p style="margin:8px 0 0">Immediate action required</p>
              </div>
              <div style="padding:24px">
                <p><strong>Customer:</strong> ${arrivalDetails.customerName}</p>
                <p><strong>Phone:</strong> <a href="tel:${arrivalDetails.customerPhone}">${arrivalDetails.customerPhone}</a></p>
                <p><strong>Vehicle:</strong> ${vehicleLabel}</p>
                <p><strong>Arrival:</strong> ${new Date(arrivalDetails.arrivalTime).toLocaleString()}</p>
                <p><strong>Notification #:</strong> ${arrivalDetails.notificationId}</p>
              </div>
            </div>`,
          })
        ));
        console.log('[notify-arrival] admin email sent');
      } catch (emailErr) {
        console.error('[notify-arrival] email error:', emailErr);
      }

      return res.json({
        success: true,
        message: 'Staff has been notified of your arrival',
        notificationId: data.id,
      });
    }

    // Pay & pickup test endpoint
    if (path === '/api/pay-and-pickup/test' && req.method === 'GET') {
      const { data, error } = await db.from('products').select('id, name, is_pay_and_pickup_enabled').eq('is_pay_and_pickup_enabled', true);
      return res.json({ success: true, products: data || [], error: error?.message });
    }

    // ============ EXISTING ENDPOINTS ============

    // Normalize a single size_price_options entry. The DB rows store
    // {size, price, unit, msrp} but the client (PayPickupCard) expects
    // {key, label, price, priceCents, isActive, msrp, unit}. Without this,
    // size.key is undefined and PayPickupCard's .startsWith() throws.
    const normalizeSizeOption = (s) => {
      if (!s || typeof s !== 'object') return null;
      const rawKey =
        (typeof s.key === 'string' && s.key.trim()) ||
        (typeof s.size_key === 'string' && s.size_key.trim()) ||
        (typeof s.size === 'string' && s.size.trim()) ||
        (typeof s.label === 'string' && s.label.trim()) ||
        '';
      const rawLabel =
        (typeof s.label === 'string' && s.label.trim()) ||
        (typeof s.name === 'string' && s.name.trim()) ||
        (typeof s.size === 'string' && s.size.trim()) ||
        rawKey;
      if (!rawKey && !rawLabel) return null;
      const priceNum = typeof s.price === 'number'
        ? s.price
        : typeof s.priceCents === 'number'
          ? s.priceCents / 100
          : typeof s.price_cents === 'number'
            ? s.price_cents / 100
            : Number(String(s.price ?? '').replace(/[^0-9.]/g, '')) || 0;
      let isActive = true;
      if (typeof s.is_active === 'boolean') isActive = s.is_active;
      else if (typeof s.isActive === 'boolean') isActive = s.isActive;
      else if (typeof s.active === 'boolean') isActive = s.active;
      return {
        key: rawKey || rawLabel,
        label: rawLabel || rawKey,
        price: priceNum,
        priceCents: Math.round(priceNum * 100),
        unit: typeof s.unit === 'string' ? s.unit : undefined,
        msrp: typeof s.msrp === 'string' ? s.msrp : undefined,
        isActive,
      };
    };

    const normalizeProductRow = (p) => {
      if (!p) return p;
      const rawSizes = Array.isArray(p.size_price_options) ? p.size_price_options : [];
      const normalizedSizes = rawSizes.map(normalizeSizeOption).filter(Boolean);
      return {
        ...p,
        // Provide both camelCase and snake_case so existing clients keep working
        size_price_options: normalizedSizes,
        sizePriceOptions: normalizedSizes,
        imageUrl: p.image_url ?? p.imageUrl ?? null,
        texturePhotoUrl: p.texture_photo_url ?? p.texturePhotoUrl ?? null,
        productType: p.product_type ?? p.productType ?? p.name,
        displayTitle: p.display_title ?? p.displayTitle ?? p.name,
      };
    };

    // Products list — heavy free-text fields stripped (only the grid needs
    // {id, name, sizes, images}; the detail page hits the single-product
    // endpoint for the full record). Cached at the edge for 5 minutes with
    // stale-while-revalidate to keep TTFB <50ms after the first hit.
    if (path === '/api/public/products' && req.method === 'GET') {
      const slimColumns = [
        'id', 'name', 'slug', 'description', 'category', 'price',
        'image_url', 'texture_photo_url', 'product_type', 'display_title',
        'marketing_title', 'size_price_options', 'is_catalog_enabled',
        'catalog_display_order', 'is_pay_and_pickup_enabled',
        'pay_and_pickup_display_order', 'pay_and_pickup_hero_image',
        'product_status', 'npk', 'certifications',
      ].join(', ');
      const { data, error } = await db
        .from('products')
        .select(slimColumns)
        .eq('is_catalog_enabled', true)
        .eq('product_status', 'active')
        .order('catalog_display_order', { ascending: true, nullsFirst: false })
        .order('name', { ascending: true });
      if (error) throw error;
      const products = (data || []).map(normalizeProductRow).map((p) => {
        // Drop snake_case duplicate of sizePriceOptions to halve payload
        // (client reads sizePriceOptions ?? size_price_options, so removing
        // the snake form is safe).
        const { size_price_options, ...rest } = p;
        return rest;
      });
      res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
      return res.json({ products });
    }

    // Single product
    const productMatch = path.match(/^\/api\/public\/products\/(.+)$/);
    if (productMatch && req.method === 'GET') {
      const idOrSlug = productMatch[1];
      const numericId = Number(idOrSlug);
      let data = null, error = null;

      if (!Number.isNaN(numericId)) {
        const result = await db.from('products').select('*').eq('id', numericId).single();
        data = result.data;
        error = result.error;
      }
      if (!data || error?.code === 'PGRST116') {
        const result = await db.from('products').select('*').eq('slug', idOrSlug).single();
        data = result.data;
        error = result.error;
      }
      if (error) {
        if (error.code === 'PGRST116') return res.status(404).json({ error: 'Product not found' });
        throw error;
      }
      res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
      return res.json(normalizeProductRow(data));
    }

    // Representative by slug
    const repMatch = path.match(/^\/api\/representatives\/([^\/]+)$/);
    if (repMatch && req.method === 'GET') {
      const slug = repMatch[1];
      let { data, error } = await db.from('representatives').select('*').eq('slug', slug).eq('is_active', true).single();

      if (error && error.code === 'PGRST116') {
        const { data: adminData, error: adminError } = await db.from('admin_users').select('*').eq('slug', slug).eq('has_landing_page', true).eq('is_active', true).single();
        if (adminError) {
          if (adminError.code === 'PGRST116') return res.status(404).json({ error: 'Landing page not found' });
          throw adminError;
        }
        data = {
          id: adminData.id, slug: adminData.slug, name: adminData.full_name || adminData.email,
          email: adminData.email, phone: adminData.phone, website: adminData.website, bio: adminData.bio,
          photo_url: adminData.photo_url, banner_image_url: adminData.banner_image_url,
          gallery_images: adminData.gallery_images || [], video_urls: adminData.video_urls || [],
          company_name: adminData.company_name, title: adminData.title, address: adminData.address,
          city: adminData.city, state: adminData.state, zip_code: adminData.zip_code,
          social_links: adminData.social_links || {},
          contact_button_text: adminData.contact_button_text || 'Enter Your Contact Details',
          contact_card_button_text: adminData.contact_card_button_text || 'Download Contact Card',
          contact_form_title: adminData.contact_form_title || 'Get In Touch',
          contact_form_description: adminData.contact_form_description,
          is_active: adminData.is_active, source: 'admin',
        };
      } else if (error) {
        throw error;
      }
      return res.json(data);
    }

    // Contact submission
    const contactMatch = path.match(/^\/api\/representatives\/([^\/]+)\/contact$/);
    if (contactMatch && req.method === 'POST') {
      const slug = contactMatch[1];
      const { firstName, lastName, email, phone, companyName, message } = req.body || {};
      if (!firstName || !lastName || !email) return res.status(400).json({ error: 'First name, last name, and email required' });

      const { data: representative } = await db.from('representatives').select('id, admin_id').eq('slug', slug).eq('is_active', true).single();
      let contactData = { first_name: firstName, last_name: lastName, email, phone: phone || null, company_name: companyName || null, message: message || null, source: 'landing_page', status: 'new' };

      if (representative) {
        contactData.representative_id = representative.id;
        contactData.admin_id = representative.admin_id || null;
      } else {
        const { data: admin } = await db.from('admin_users').select('id').eq('slug', slug).eq('has_landing_page', true).eq('is_active', true).single();
        if (!admin) return res.status(404).json({ error: 'Landing page not found' });
        contactData.admin_id = admin.id;
        contactData.representative_id = null;
      }

      const { data, error } = await db.from('representative_contacts').insert(contactData).select().single();
      if (error) throw error;
      return res.status(201).json({ success: true, data });
    }

    // ============ ADMIN CRM ENDPOINTS ============

    // Admin auth helper
    const verifyAdminToken = async (req) => {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
      const token = authHeader.substring(7);
      try {
        const jwt = (await import('jsonwebtoken')).default;
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        return decoded;
      } catch (e) {
        return null;
      }
    };

    // GET /api/admin/representative-contacts
    if (path === '/api/admin/representative-contacts' && req.method === 'GET') {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });

      const { status, search, representativeId, segment, partner_owner, lead_source } = url.searchParams ?
        Object.fromEntries(url.searchParams) : {};

      let query = db.from('representative_contacts').select('*').order('created_at', { ascending: false });

      // Role-based filtering
      if (admin.role !== 'super_admin') {
        const { data: linkedReps } = await db.from('representatives').select('id').eq('admin_id', admin.id);
        const repIds = (linkedReps || []).map(r => r.id);
        if (repIds.length > 0) {
          const repIdFilter = repIds.map(id => `representative_id.eq.${id}`).join(',');
          query = query.or(`${repIdFilter},admin_id.eq.${admin.id}`);
        } else {
          query = query.eq('admin_id', admin.id);
        }
      }

      if (status) query = query.eq('status', status);
      if (segment) query = query.eq('segment', segment);
      if (partner_owner) query = query.eq('partner_owner', partner_owner);
      if (lead_source) query = query.eq('lead_source', lead_source);
      if (representativeId) query = query.eq('representative_id', representativeId);
      if (search) {
        const term = `%${search}%`;
        query = query.or(`first_name.ilike.${term},last_name.ilike.${term},email.ilike.${term},phone.ilike.${term}`);
      }

      const { data: contacts, error } = await query;
      if (error) throw error;

      // Enrich with representative info
      const repIds = [...new Set((contacts || []).map(c => c.representative_id).filter(Boolean))];
      let repsMap = {};
      if (repIds.length > 0) {
        const { data: reps } = await db.from('representatives').select('id, name, slug, email, phone, photo_url').in('id', repIds);
        repsMap = (reps || []).reduce((acc, r) => { acc[r.id] = r; return acc; }, {});
      }

      const enriched = (contacts || []).map(c => ({
        ...c,
        representative: c.representative_id ? repsMap[c.representative_id] || null : null,
      }));

      return res.json(enriched);
    }

    // PATCH /api/admin/representative-contacts/:id
    const patchContactMatch = path.match(/^\/api\/admin\/representative-contacts\/(\d+)$/);
    if (patchContactMatch && req.method === 'PATCH') {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });

      const contactId = patchContactMatch[1];
      const { status, notes } = req.body || {};

      const updateData = {};
      if (status !== undefined) updateData.status = status;
      if (notes !== undefined) updateData.notes = notes;

      const { data, error } = await db.from('representative_contacts').update(updateData).eq('id', contactId).select().single();
      if (error) throw error;

      return res.json(data);
    }

    // POST /api/admin/representative-contacts/bulk-delete
    if (path === '/api/admin/representative-contacts/bulk-delete' && req.method === 'POST') {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });
      if (!admin.role || !['super_admin', 'admin'].includes(admin.role)) {
        return res.status(403).json({ error: 'Admin access required to bulk delete' });
      }

      const { ids } = req.body || {};
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'No contact IDs provided' });
      }

      const { error } = await db.from('representative_contacts').delete().in('id', ids);
      if (error) throw error;

      return res.json({ success: true, deletedCount: ids.length });
    }

    // ============ ADMIN ANALYTICS ENDPOINTS ============

    // Helper functions for analytics
    const countBy = (items, field) => {
      if (!items) return {};
      return items.reduce((acc, item) => {
        const key = item[field] || 'unknown';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});
    };

    const calculateEmailMetrics = (contacts) => {
      if (!contacts) return { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, replied: 0 };
      const emailsSent = contacts.filter(c => c.first_email_sent_at);
      const metrics = {
        sent: emailsSent.length,
        delivered: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
        replied: 0,
        openRate: '0.0',
        clickRate: '0.0',
        replyRate: '0.0',
      };
      emailsSent.forEach(contact => {
        switch (contact.email_status) {
          case 'delivered': metrics.delivered++; break;
          case 'opened': metrics.opened++; metrics.delivered++; break;
          case 'clicked': metrics.clicked++; metrics.opened++; metrics.delivered++; break;
          case 'replied': metrics.replied++; metrics.opened++; metrics.delivered++; break;
          case 'bounced': metrics.bounced++; break;
        }
      });
      if (metrics.delivered > 0) {
        metrics.openRate = ((metrics.opened / metrics.delivered) * 100).toFixed(1);
        metrics.replyRate = ((metrics.replied / metrics.delivered) * 100).toFixed(1);
      }
      if (metrics.opened > 0) {
        metrics.clickRate = ((metrics.clicked / metrics.opened) * 100).toFixed(1);
      }
      return metrics;
    };

    const calculateCampaignPerformance = (contacts) => {
      if (!contacts) return [];
      const campaigns = {};
      contacts.forEach(contact => {
        const source = contact.lead_source || 'other';
        if (!campaigns[source]) {
          campaigns[source] = { name: source, total: 0, emailsSent: 0, opened: 0, replied: 0, converted: 0 };
        }
        campaigns[source].total++;
        if (contact.first_email_sent_at) campaigns[source].emailsSent++;
        if (['opened', 'clicked', 'replied'].includes(contact.email_status)) campaigns[source].opened++;
        if (contact.email_status === 'replied' || contact.status === 'replied') campaigns[source].replied++;
        if (contact.status === 'converted' || contact.pipeline_stage === 'conversion') campaigns[source].converted++;
      });
      return Object.values(campaigns)
        .map(campaign => ({
          ...campaign,
          openRate: campaign.emailsSent > 0 ? ((campaign.opened / campaign.emailsSent) * 100).toFixed(1) : '0.0',
          conversionRate: campaign.total > 0 ? ((campaign.converted / campaign.total) * 100).toFixed(1) : '0.0',
        }))
        .sort((a, b) => b.total - a.total);
    };

    const calculateDailyTrend = (contacts, startDate) => {
      if (!contacts) return [];
      const dailyCounts = {};
      const current = new Date(startDate);
      const end = new Date();
      while (current <= end) {
        const dateStr = current.toISOString().split('T')[0];
        dailyCounts[dateStr] = { date: dateStr, contacts: 0, emails: 0 };
        current.setDate(current.getDate() + 1);
      }
      contacts.forEach(contact => {
        const dateStr = new Date(contact.created_at).toISOString().split('T')[0];
        if (dailyCounts[dateStr]) {
          dailyCounts[dateStr].contacts++;
          if (contact.first_email_sent_at) dailyCounts[dateStr].emails++;
        }
      });
      return Object.values(dailyCounts).sort((a, b) => a.date.localeCompare(b.date));
    };

    const calculateConversionFunnel = (contacts) => {
      if (!contacts) return { awareness: 0, interest: 0, consideration: 0, conversion: 0 };
      const funnel = { awareness: 0, interest: 0, consideration: 0, conversion: 0 };
      contacts.forEach(contact => {
        const stage = contact.pipeline_stage || 'awareness';
        if (funnel[stage] !== undefined) funnel[stage]++;
      });
      return funnel;
    };

    const getTopItems = (counts, limit) => {
      return Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    };

    // GET /api/admin/analytics - Comprehensive CRM analytics
    if (path === '/api/admin/analytics' && req.method === 'GET') {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });

      const range = url.searchParams.get('range') || '30d';
      const now = new Date();
      let startDate = new Date();
      switch (range) {
        case '7d': startDate.setDate(now.getDate() - 7); break;
        case '30d': startDate.setDate(now.getDate() - 30); break;
        case '90d': startDate.setDate(now.getDate() - 90); break;
        case '1y': startDate.setFullYear(now.getFullYear() - 1); break;
        default: startDate.setDate(now.getDate() - 30);
      }

      const { data: contacts, error: contactsError } = await db
        .from('representative_contacts')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (contactsError) throw contactsError;

      const { data: allContacts, error: allError } = await db
        .from('representative_contacts')
        .select('*');

      if (allError) throw allError;

      const analytics = {
        totalContacts: contacts?.length || 0,
        totalAllTime: allContacts?.length || 0,
        byStatus: countBy(contacts, 'status'),
        bySegment: countBy(contacts, 'segment'),
        byLeadSource: countBy(contacts, 'lead_source'),
        byPartnerOwner: countBy(contacts, 'partner_owner'),
        byPipelineStage: countBy(contacts, 'pipeline_stage'),
        emailMetrics: calculateEmailMetrics(contacts),
        campaignPerformance: calculateCampaignPerformance(contacts),
        dailyTrend: calculateDailyTrend(contacts, startDate),
        conversionFunnel: calculateConversionFunnel(contacts),
        topSegments: getTopItems(countBy(contacts, 'segment'), 5),
        topSources: getTopItems(countBy(contacts, 'lead_source'), 5),
      };

      return res.json(analytics);
    }

    // GET /api/admin/analytics/email-campaigns - Detailed email campaign analytics
    if (path === '/api/admin/analytics/email-campaigns' && req.method === 'GET') {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });

      const { data: contacts, error } = await db
        .from('representative_contacts')
        .select('*')
        .not('first_email_sent_at', 'is', null);

      if (error) throw error;

      const campaigns = {};
      (contacts || []).forEach(contact => {
        const campaign = contact.lead_source || 'other';
        if (!campaigns[campaign]) {
          campaigns[campaign] = {
            name: campaign,
            sent: 0,
            delivered: 0,
            opened: 0,
            clicked: 0,
            bounced: 0,
            replied: 0,
            contacts: [],
          };
        }
        campaigns[campaign].sent++;
        campaigns[campaign].contacts.push({
          id: contact.id,
          name: `${contact.first_name} ${contact.last_name}`,
          email: contact.email,
          company: contact.company_name,
          status: contact.email_status,
          sentAt: contact.first_email_sent_at,
        });

        switch (contact.email_status) {
          case 'delivered': campaigns[campaign].delivered++; break;
          case 'opened': campaigns[campaign].opened++; campaigns[campaign].delivered++; break;
          case 'clicked': campaigns[campaign].clicked++; campaigns[campaign].opened++; campaigns[campaign].delivered++; break;
          case 'replied': campaigns[campaign].replied++; campaigns[campaign].opened++; campaigns[campaign].delivered++; break;
          case 'bounced': campaigns[campaign].bounced++; break;
        }
      });

      const campaignList = Object.values(campaigns).map(campaign => ({
        ...campaign,
        deliveryRate: campaign.sent > 0 ? ((campaign.delivered / campaign.sent) * 100).toFixed(1) : '0.0',
        openRate: campaign.delivered > 0 ? ((campaign.opened / campaign.delivered) * 100).toFixed(1) : '0.0',
        clickRate: campaign.opened > 0 ? ((campaign.clicked / campaign.opened) * 100).toFixed(1) : '0.0',
        replyRate: campaign.delivered > 0 ? ((campaign.replied / campaign.delivered) * 100).toFixed(1) : '0.0',
        bounceRate: campaign.sent > 0 ? ((campaign.bounced / campaign.sent) * 100).toFixed(1) : '0.0',
      }));

      return res.json({
        campaigns: campaignList.sort((a, b) => b.sent - a.sent),
        totals: {
          totalSent: contacts?.length || 0,
          totalOpened: campaignList.reduce((sum, c) => sum + c.opened, 0),
          totalClicked: campaignList.reduce((sum, c) => sum + c.clicked, 0),
          totalReplied: campaignList.reduce((sum, c) => sum + c.replied, 0),
          totalBounced: campaignList.reduce((sum, c) => sum + c.bounced, 0),
        },
      });
    }

    // ============ ADMIN AUTH ENDPOINTS ============

    // Admin login
    if (path === '/api/admin/auth/login' && req.method === 'POST') {
      const { email, password } = req.body || {};

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Check for hardcoded operations credentials
      if (email === 'operations@soilseedandwater.com' && password === 'ops2026') {
        const jwt = (await import('jsonwebtoken')).default;
        const token = jwt.sign(
          { id: 'ops-user', email, role: 'operations' },
          process.env.JWT_SECRET || 'your-secret-key',
          { expiresIn: '8h' }
        );
        return res.json({
          token,
          admin: { id: 'ops-user', email, full_name: 'Operations Team', role: 'operations' }
        });
      }

      // Check for super admin credentials
      if (email === 'ralvarez@soilseedandwater.com' && password === 'admin123') {
        const jwt = (await import('jsonwebtoken')).default;
        const token = jwt.sign(
          { id: 'super-admin', email, role: 'super_admin' },
          process.env.JWT_SECRET || 'your-secret-key',
          { expiresIn: '8h' }
        );
        return res.json({
          token,
          admin: { id: 'super-admin', email, full_name: 'Rodolfo Alvarez', role: 'super_admin' }
        });
      }

      // Check database for other users
      const { data: admin, error: adminError } = await db
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .single();

      if (adminError || !admin || !admin.password_hash) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const bcrypt = (await import('bcrypt')).default;
      const validPassword = await bcrypt.compare(password, admin.password_hash);

      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const jwt = (await import('jsonwebtoken')).default;
      const token = jwt.sign(
        { id: admin.id, email: admin.email, role: admin.role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '8h' }
      );

      return res.json({
        token,
        admin: { id: admin.id, email: admin.email, full_name: admin.full_name, role: admin.role }
      });
    }

    // Admin validate token
    if (path === '/api/admin/auth/validate' && req.method === 'GET') {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });

      // Handle hardcoded users
      if (admin.id === 'ops-user' || admin.id === 'super-admin') {
        return res.json({
          admin: {
            id: admin.id,
            email: admin.email,
            full_name: admin.id === 'ops-user' ? 'Operations Team' : 'Rodolfo Alvarez',
            role: admin.role,
            permissions: {}
          }
        });
      }

      // Get from database
      const { data: dbAdmin, error } = await db
        .from('admin_users')
        .select('id, email, full_name, role, permissions')
        .eq('id', admin.id)
        .single();

      if (error || !dbAdmin) {
        return res.status(401).json({ error: 'Admin not found' });
      }

      return res.json({ admin: dbAdmin });
    }

    // ============ DASHBOARD STATS ENDPOINT ============

    if (path === '/api/admin/dashboard/stats' && req.method === 'GET') {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });

      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get today's revenue from orders (if table exists)
        let todayRevenue = 0;
        let orderStats = [];
        let recentOrders = [];
        let lowStockProducts = [];
        let popularProducts = [];

        try {
          const { data: todayOrders } = await db
            .from('orders')
            .select('total')
            .gte('created_at', today.toISOString())
            .lt('created_at', tomorrow.toISOString());
          todayRevenue = todayOrders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;
        } catch (e) { /* orders table may not exist */ }

        try {
          const { data } = await db
            .from('orders')
            .select('status')
            .order('status');
          if (data) {
            const counts = {};
            data.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });
            orderStats = Object.entries(counts).map(([status, count]) => ({ status, count }));
          }
        } catch (e) { /* orders table may not exist */ }

        try {
          const { data } = await db
            .from('orders')
            .select('id, created_at, total, status')
            .order('created_at', { ascending: false })
            .limit(10);
          recentOrders = data || [];
        } catch (e) { /* orders table may not exist */ }

        try {
          const { data } = await db
            .from('products')
            .select('id, name, stock_quantity, min_stock_level')
            .eq('active', true)
            .order('stock_quantity', { ascending: true })
            .limit(10);
          lowStockProducts = (data || [])
            .filter(p => p.min_stock_level && p.stock_quantity < p.min_stock_level)
            .map(p => ({ id: p.id, name: p.name, stock: p.stock_quantity, min_stock_level: p.min_stock_level }));
        } catch (e) { /* products table may not have these columns */ }

        return res.json({
          todayRevenue,
          orderStats,
          lowStockProducts,
          popularProducts,
          recentOrders,
        });
      } catch (error) {
        console.error('Dashboard stats error:', error);
        return res.status(500).json({ error: 'Failed to fetch dashboard stats' });
      }
    }

    // ============ OPERATIONS BOL ENDPOINTS ============

    // Get all BOLs
    if (path === '/api/admin/operations/bols' && req.method === 'GET') {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });

      let query = db.from('ops_bols').select('*');
      const clientTag = url.searchParams.get('client_tag');
      if (clientTag) query = query.eq('client_tag', clientTag);
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return res.json(data || []);
    }

    // Get single BOL
    const bolDetailMatch = path.match(/^\/api\/admin\/operations\/bols\/(\d+)$/);
    if (bolDetailMatch && req.method === 'GET') {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });

      const bolId = bolDetailMatch[1];
      const { data, error } = await db
        .from('ops_bols')
        .select('*')
        .eq('id', bolId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return res.status(404).json({ error: 'BOL not found' });
        throw error;
      }
      return res.json(data);
    }

    // PATCH BOL
    if (bolDetailMatch && req.method === 'PATCH') {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });

      const bolId = bolDetailMatch[1];
      const updates = req.body;
      const fieldMap = {
        date: "date", originLocation: "origin_location", originAddress: "origin_address",
        originCity: "origin_city", originState: "origin_state", originZip: "origin_zip",
        customerName: "customer_name", destinationAddress: "destination_address",
        destinationCity: "destination_city", destinationState: "destination_state",
        destinationZip: "destination_zip", onsiteContactName: "onsite_contact_name",
        onsiteContactPhone: "onsite_contact_phone", materialType: "material_type",
        materialDescription: "material_description", grossWeight: "gross_weight",
        tareWeight: "tare_weight", netWeight: "net_weight", netWeightTons: "net_weight_tons",
        carrierName: "carrier_name", driverName: "driver_name", truckNumber: "truck_number",
        licensePlate: "license_plate", trailerNumber: "trailer_number", notes: "notes",
        referenceNumber: "reference_number", timeIn: "time_in", timeOut: "time_out",
        scaleOperatorInitials: "scale_operator_initials", loadType: "load_type",
        clientTag: "client_tag", status: "status", orderId: "order_id",
        billingStatus: "billing_status", invoiceId: "invoice_id",
        invoiceNumber: "invoice_number", invoiceAmount: "invoice_amount",
        invoiceDate: "invoice_date", billingNotes: "billing_notes"
      };

      const snakeCaseUpdates = {};
      for (const [key, value] of Object.entries(updates)) {
        const snakeKey = fieldMap[key] || key;
        if (fieldMap[key] || key === 'status') {
          snakeCaseUpdates[snakeKey] = value;
        }
      }
      snakeCaseUpdates.updated_at = new Date().toISOString();

      const { data, error } = await db.from('ops_bols').update(snakeCaseUpdates).eq('id', bolId).select().single();
      if (error) throw error;
      return res.json(data);
    }

    // Get linked CODs for a BOL
    const bolCodsMatch = path.match(/^\/api\/admin\/operations\/bols\/(\d+)\/cods$/);
    if (bolCodsMatch && req.method === 'GET') {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });

      const bolId = bolCodsMatch[1];

      // Get CODs linked by bol_id
      const { data: directLinked } = await db.from('ops_cods')
        .select('id, cod_number, date_received, status, received_from, client_tag')
        .eq('bol_id', bolId).order('created_at', { ascending: false });

      // Get the BOL's client_tag for related CODs
      const { data: bol } = await db.from('ops_bols').select('client_tag, date').eq('id', bolId).single();

      let tagLinked = [];
      if (bol && bol.client_tag) {
        const { data } = await db.from('ops_cods')
          .select('id, cod_number, date_received, status, received_from, client_tag')
          .eq('client_tag', bol.client_tag).is('bol_id', null)
          .order('created_at', { ascending: false }).limit(10);
        tagLinked = data || [];
      }

      // Merge and deduplicate
      const allCods = [...(directLinked || []), ...tagLinked];
      const seen = new Set();
      const unique = allCods.filter(c => { if (seen.has(c.id)) return false; seen.add(c.id); return true; });

      return res.json(unique);
    }

    // Create BOL
    if (path === '/api/admin/operations/bols' && req.method === 'POST') {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });

      const bolData = req.body;

      // Generate BOL number
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      const { count } = await db.from('ops_bols').select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString().slice(0, 10));
      const bolNumber = `BOL-${dateStr}-${String((count || 0) + 1).padStart(3, '0')}`;

      const insertData = {
        bol_number: bolNumber,
        date: bolData.date || today.toISOString().slice(0, 10),
        origin_location: bolData.originLocation,
        origin_address: bolData.originAddress,
        origin_city: bolData.originCity,
        origin_state: bolData.originState,
        origin_zip: bolData.originZip,
        customer_name: bolData.customerName,
        destination_address: bolData.destinationAddress,
        destination_city: bolData.destinationCity,
        destination_state: bolData.destinationState,
        destination_zip: bolData.destinationZip,
        onsite_contact_name: bolData.onsiteContactName || null,
        onsite_contact_phone: bolData.onsiteContactPhone || null,
        material_type: bolData.materialType,
        material_description: bolData.materialDescription || null,
        gross_weight: bolData.grossWeight || 0,
        tare_weight: bolData.tareWeight || 0,
        net_weight: bolData.netWeight || 0,
        net_weight_tons: bolData.netWeightTons || '0.00',
        carrier_name: bolData.carrierName,
        driver_name: bolData.driverName || null,
        truck_number: bolData.truckNumber || null,
        license_plate: bolData.licensePlate || null,
        trailer_number: bolData.trailerNumber || null,
        notes: bolData.notes || null,
        reference_number: bolData.referenceNumber || null,
        time_in: bolData.timeIn || null,
        time_out: bolData.timeOut || null,
        scale_operator_initials: bolData.scaleOperatorInitials || null,
        load_type: bolData.loadType || 'Outbound',
        client_tag: bolData.clientTag || null,
        status: 'completed',
        created_by: admin.id
      };

      const { data, error } = await db.from('ops_bols').insert(insertData).select().single();
      if (error) throw error;

      return res.status(201).json(data);
    }

    // Delete BOLs
    if (path === '/api/admin/operations/bols/delete' && req.method === 'POST') {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });

      const { ids } = req.body || {};
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: 'No IDs provided' });
      }

      const { error } = await db.from('ops_bols').delete().in('id', ids);
      if (error) throw error;

      return res.json({ success: true, deleted: ids.length });
    }

    // Generate BOL PDF
    const bolPdfMatch = path.match(/^\/api\/admin\/operations\/bols\/(\d+)\/pdf$/);
    if (bolPdfMatch && req.method === 'GET') {
      // Check token from query param or header
      const tokenFromQuery = url.searchParams.get('token');
      const tokenFromHeader = req.headers.authorization?.replace('Bearer ', '');
      const token = tokenFromQuery || tokenFromHeader;

      if (!token) return res.status(401).json({ error: 'Unauthorized' });

      try {
        const jwt = (await import('jsonwebtoken')).default;
        jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      } catch (e) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      const bolId = bolPdfMatch[1];
      const { data: bol, error } = await db.from('ops_bols').select('*').eq('id', bolId).single();

      if (error || !bol) return res.status(404).json({ error: 'BOL not found' });

      const hasWeight = bol.gross_weight > 0 && bol.tare_weight > 0;

      // Check if auto-print is requested (default: true)
      const autoPrint = url.searchParams.get('print') !== 'false';
      const printScript = autoPrint ? `<script>window.onload = function() { setTimeout(function() { window.print(); }, 500); }</script>` : '';

      const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>BOL ${bol.bol_number}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,sans-serif;font-size:12px;line-height:1.4;padding:20px;max-width:800px;margin:0 auto;color:#000}
.header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #000;padding-bottom:12px;margin-bottom:12px}
.logo-section h1{font-size:20px;font-weight:bold;margin-bottom:2px}
.logo-section p{font-size:9px;color:#333}
.bol-info{text-align:right}
.bol-number{font-size:18px;font-weight:bold;font-family:monospace}
.ref-number{font-size:14px;font-weight:bold;margin-top:4px;border:2px solid #000;padding:3px 8px;display:inline-block}
.date{font-size:11px;color:#333;margin-top:3px}
.section{margin-bottom:10px;border:1px solid #999;overflow:hidden}
.section-header{padding:5px 10px;font-weight:bold;font-size:11px;text-transform:uppercase;border-bottom:1px solid #999}
.section-content{padding:8px 10px}
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.field{margin-bottom:5px}
.field-label{font-size:9px;color:#333;text-transform:uppercase;margin-bottom:1px}
.field-value{font-size:12px;font-weight:bold}
.weight-table{width:100%;border-collapse:collapse;margin-top:8px}
.weight-table td{border:2px solid #000;padding:8px 12px;text-align:center}
.weight-table .wt-label{font-size:10px;font-weight:bold;text-transform:uppercase}
.weight-table .wt-value{font-size:22px;font-weight:bold;font-family:monospace}
.weight-table .wt-unit{font-size:11px;font-weight:bold}
.weight-table .wt-tons{font-size:16px;font-weight:bold;margin-top:2px}
.signature-section{display:grid;grid-template-columns:1fr 1fr 1fr;gap:15px;margin-top:20px;padding-top:12px;border-top:1px solid #999}
.signature-box{border-bottom:1px solid #000;padding-bottom:30px;margin-bottom:4px}
.signature-label{font-size:10px;font-weight:bold}
.footer{margin-top:15px;padding-top:8px;border-top:1px solid #999;font-size:8px;color:#333;text-align:center}
@media print{body{padding:0}}
</style>
${printScript}
</head><body>
<div class="header">
<div class="logo-section"><h1>Soil Seed and Water</h1><p>18980 Stanton Rd, Congress, AZ 85332 | (928) 632-7125 | info@soilseedandwater.com</p></div>
<div class="bol-info"><div class="bol-number">${bol.bol_number}</div><div class="date">${new Date(bol.date).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</div>${bol.reference_number?`<div class="ref-number">REF: ${bol.reference_number}</div>`:''}</div>
</div>
<div class="two-col">
<div class="section"><div class="section-header">Origin</div><div class="section-content">
<div class="field"><div class="field-label">Location</div><div class="field-value">${bol.origin_location || 'SSW BioSoils'}</div></div>
<div class="field"><div class="field-label">Address</div><div class="field-value">${bol.origin_address || ''}<br>${[bol.origin_city, bol.origin_state, bol.origin_zip].filter(Boolean).join(', ')}</div></div>
</div></div>
<div class="section"><div class="section-header">Destination</div><div class="section-content">
<div class="field"><div class="field-label">Customer</div><div class="field-value">${bol.customer_name}</div></div>
<div class="field"><div class="field-label">Address</div><div class="field-value">${bol.destination_address}<br>${[bol.destination_city, bol.destination_state, bol.destination_zip].filter(Boolean).join(', ')}</div></div>
${bol.onsite_contact_name?`<div class="field"><div class="field-label">Contact</div><div class="field-value">${bol.onsite_contact_name}${bol.onsite_contact_phone?' - '+bol.onsite_contact_phone:''}</div></div>`:''}
</div></div>
</div>
<div class="section"><div class="section-header">Material</div><div class="section-content">
<div class="field"><div class="field-label">Type</div><div class="field-value" style="font-size:14px">${bol.material_type}</div></div>
${bol.material_description?`<div class="field"><div class="field-label">Description</div><div class="field-value">${bol.material_description}</div></div>`:''}
${bol.load_type?`<div class="field"><div class="field-label">Load Type</div><div class="field-value">${bol.load_type}</div></div>`:''}
${hasWeight?`<table class="weight-table"><tr>
<td><div class="wt-label">Gross</div><div class="wt-value">${bol.gross_weight.toLocaleString()}</div><div class="wt-unit">lbs</div></td>
<td><div class="wt-label">Tare</div><div class="wt-value">${bol.tare_weight.toLocaleString()}</div><div class="wt-unit">lbs</div></td>
<td><div class="wt-label">Net Weight</div><div class="wt-value">${bol.net_weight.toLocaleString()}</div><div class="wt-unit">lbs</div><div class="wt-tons">${bol.net_weight_tons} TONS</div></td>
</tr></table>`:''}
</div></div>
<div class="section"><div class="section-header">Carrier & Transport</div><div class="section-content">
<div class="two-col">
<div><div class="field"><div class="field-label">Carrier</div><div class="field-value">${bol.carrier_name || '________________________'}</div></div>
${bol.driver_name?`<div class="field"><div class="field-label">Driver</div><div class="field-value">${bol.driver_name}</div></div>`:''}</div>
<div>${bol.truck_number?`<div class="field"><div class="field-label">Truck #</div><div class="field-value">${bol.truck_number}</div></div>`:''}
${bol.license_plate?`<div class="field"><div class="field-label">License Plate</div><div class="field-value">${bol.license_plate}</div></div>`:''}
${bol.trailer_number?`<div class="field"><div class="field-label">Trailer #</div><div class="field-value">${bol.trailer_number}</div></div>`:''}</div>
</div>
<div class="two-col" style="margin-top:6px">
<div class="field"><div class="field-label">Time In</div><div class="field-value">${bol.time_in || '________________________'}</div></div>
<div class="field"><div class="field-label">Time Out</div><div class="field-value">${bol.time_out || '________________________'}</div></div>
</div>
${bol.scale_operator_initials?`<div class="field" style="margin-top:4px"><div class="field-label">Scale Operator</div><div class="field-value">${bol.scale_operator_initials}</div></div>`:''}</div></div>
${bol.notes?`<div class="section"><div class="section-header">Notes</div><div class="section-content"><div class="field-value">${bol.notes}</div></div></div>`:''}
<div class="signature-section">
<div><div class="signature-box"></div><div class="signature-label">Shipper Signature / Date</div></div>
<div><div class="signature-box"></div><div class="signature-label">Driver Signature / Date</div></div>
<div><div class="signature-box"></div><div class="signature-label">Receiver Signature / Date</div></div>
</div>
<div class="footer">Bill of Lading${hasWeight?' / Weight Ticket':''} — Soil Seed and Water — ${bol.bol_number}</div>
</body></html>`;

      // Return HTML as PDF-ready content
      res.setHeader('Content-Type', 'text/html');
      return res.send(html);
    }

    // GET /api/admin/operations/recent-addresses
    if (path === '/api/admin/operations/recent-addresses' && req.method === 'GET') {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });

      try {
        const { data, error } = await db
          .from('ops_bols')
          .select('customer_name, destination_address, destination_city, destination_state, destination_zip, onsite_contact_name, onsite_contact_phone, carrier_name, driver_name, truck_number, license_plate, trailer_number, created_at')
          .order('created_at', { ascending: false })
          .limit(200);

        if (error) throw error;

        const destinationMap = new Map();
        const carrierMap = new Map();

        for (const bol of data || []) {
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

        return res.json({
          destinations: Array.from(destinationMap.values()),
          carriers: Array.from(carrierMap.values())
        });
      } catch (error) {
        console.error('Recent addresses error:', error);
        return res.status(500).json({ error: 'Failed to fetch recent addresses' });
      }
    }

    // POST /api/admin/operations/bols/:id/email
    const bolEmailMatch = path.match(/^\/api\/admin\/operations\/bols\/(\d+)\/email$/);
    if (bolEmailMatch && req.method === 'POST') {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });

      const bolId = bolEmailMatch[1];
      const { recipientEmail, recipientName, customMessage } = req.body || {};

      if (!recipientEmail) {
        return res.status(400).json({ error: 'Recipient email is required' });
      }

      try {
        const { data: bol, error: fetchError } = await db.from('ops_bols').select('*').eq('id', bolId).single();
        if (fetchError || !bol) return res.status(404).json({ error: 'BOL not found' });

        // Generate PDF HTML
        const hasWeight = bol.gross_weight > 0 && bol.tare_weight > 0;
        const pdfHtml = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>BOL ${bol.bol_number}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,sans-serif;font-size:12px;line-height:1.4;padding:20px;max-width:800px;margin:0 auto;color:#000}
.header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #000;padding-bottom:12px;margin-bottom:12px}
.logo-section h1{font-size:20px;font-weight:bold;margin-bottom:2px}
.logo-section p{font-size:9px;color:#333}
.bol-info{text-align:right}
.bol-number{font-size:18px;font-weight:bold;font-family:monospace}
.ref-number{font-size:14px;font-weight:bold;margin-top:4px;border:2px solid #000;padding:3px 8px;display:inline-block}
.date{font-size:11px;color:#333;margin-top:3px}
.section{margin-bottom:10px;border:1px solid #999;overflow:hidden}
.section-header{padding:5px 10px;font-weight:bold;font-size:11px;text-transform:uppercase;border-bottom:1px solid #999}
.section-content{padding:8px 10px}
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.field{margin-bottom:5px}
.field-label{font-size:9px;color:#333;text-transform:uppercase;margin-bottom:1px}
.field-value{font-size:12px;font-weight:bold}
.weight-table{width:100%;border-collapse:collapse;margin-top:8px}
.weight-table td{border:2px solid #000;padding:8px 12px;text-align:center}
.weight-table .wt-label{font-size:10px;font-weight:bold;text-transform:uppercase}
.weight-table .wt-value{font-size:22px;font-weight:bold;font-family:monospace}
.weight-table .wt-unit{font-size:11px;font-weight:bold}
.weight-table .wt-tons{font-size:16px;font-weight:bold;margin-top:2px}
.signature-section{display:grid;grid-template-columns:1fr 1fr 1fr;gap:15px;margin-top:20px;padding-top:12px;border-top:1px solid #999}
.signature-box{border-bottom:1px solid #000;padding-bottom:30px;margin-bottom:4px}
.signature-label{font-size:10px;font-weight:bold}
.footer{margin-top:15px;padding-top:8px;border-top:1px solid #999;font-size:8px;color:#333;text-align:center}
</style>
</head><body>
<div class="header">
<div class="logo-section"><h1>Soil Seed and Water</h1><p>18980 Stanton Rd, Congress, AZ 85332 | (928) 632-7125 | info@soilseedandwater.com</p></div>
<div class="bol-info"><div class="bol-number">${bol.bol_number}</div><div class="date">${new Date(bol.date).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</div>${bol.reference_number?`<div class="ref-number">REF: ${bol.reference_number}</div>`:''}</div>
</div>
<div class="two-col">
<div class="section"><div class="section-header">Origin</div><div class="section-content">
<div class="field"><div class="field-label">Location</div><div class="field-value">${bol.origin_location || 'SSW BioSoils'}</div></div>
<div class="field"><div class="field-label">Address</div><div class="field-value">${bol.origin_address || ''}<br>${[bol.origin_city, bol.origin_state, bol.origin_zip].filter(Boolean).join(', ')}</div></div>
</div></div>
<div class="section"><div class="section-header">Destination</div><div class="section-content">
<div class="field"><div class="field-label">Customer</div><div class="field-value">${bol.customer_name}</div></div>
<div class="field"><div class="field-label">Address</div><div class="field-value">${bol.destination_address}<br>${[bol.destination_city, bol.destination_state, bol.destination_zip].filter(Boolean).join(', ')}</div></div>
${bol.onsite_contact_name?`<div class="field"><div class="field-label">Contact</div><div class="field-value">${bol.onsite_contact_name}${bol.onsite_contact_phone?' - '+bol.onsite_contact_phone:''}</div></div>`:''}
</div></div>
</div>
<div class="section"><div class="section-header">Material</div><div class="section-content">
<div class="field"><div class="field-label">Type</div><div class="field-value" style="font-size:14px">${bol.material_type}</div></div>
${bol.material_description?`<div class="field"><div class="field-label">Description</div><div class="field-value">${bol.material_description}</div></div>`:''}
${bol.load_type?`<div class="field"><div class="field-label">Load Type</div><div class="field-value">${bol.load_type}</div></div>`:''}
${hasWeight?`<table class="weight-table"><tr>
<td><div class="wt-label">Gross</div><div class="wt-value">${bol.gross_weight.toLocaleString()}</div><div class="wt-unit">lbs</div></td>
<td><div class="wt-label">Tare</div><div class="wt-value">${bol.tare_weight.toLocaleString()}</div><div class="wt-unit">lbs</div></td>
<td><div class="wt-label">Net Weight</div><div class="wt-value">${bol.net_weight.toLocaleString()}</div><div class="wt-unit">lbs</div><div class="wt-tons">${bol.net_weight_tons} TONS</div></td>
</tr></table>`:''}
</div></div>
<div class="section"><div class="section-header">Carrier & Transport</div><div class="section-content">
<div class="two-col">
<div><div class="field"><div class="field-label">Carrier</div><div class="field-value">${bol.carrier_name || '________________________'}</div></div>
${bol.driver_name?`<div class="field"><div class="field-label">Driver</div><div class="field-value">${bol.driver_name}</div></div>`:''}</div>
<div>${bol.truck_number?`<div class="field"><div class="field-label">Truck #</div><div class="field-value">${bol.truck_number}</div></div>`:''}
${bol.license_plate?`<div class="field"><div class="field-label">License Plate</div><div class="field-value">${bol.license_plate}</div></div>`:''}
${bol.trailer_number?`<div class="field"><div class="field-label">Trailer #</div><div class="field-value">${bol.trailer_number}</div></div>`:''}</div>
</div>
<div class="two-col" style="margin-top:6px">
<div class="field"><div class="field-label">Time In</div><div class="field-value">${bol.time_in || '________________________'}</div></div>
<div class="field"><div class="field-label">Time Out</div><div class="field-value">${bol.time_out || '________________________'}</div></div>
</div>
${bol.scale_operator_initials?`<div class="field" style="margin-top:4px"><div class="field-label">Scale Operator</div><div class="field-value">${bol.scale_operator_initials}</div></div>`:''}</div></div>
${bol.notes?`<div class="section"><div class="section-header">Notes</div><div class="section-content"><div class="field-value">${bol.notes}</div></div></div>`:''}
<div class="signature-section">
<div><div class="signature-box"></div><div class="signature-label">Shipper Signature / Date</div></div>
<div><div class="signature-box"></div><div class="signature-label">Driver Signature / Date</div></div>
<div><div class="signature-box"></div><div class="signature-label">Receiver Signature / Date</div></div>
</div>
<div class="footer">Bill of Lading${hasWeight?' / Weight Ticket':''} — Soil Seed and Water — ${bol.bol_number}</div>
</body></html>`;

        // Use Puppeteer to generate PDF
        const puppeteer = (await import('puppeteer')).default;
        const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        await page.setContent(pdfHtml, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({ format: 'Letter', printBackground: true, margin: { top: '0.3in', right: '0.3in', bottom: '0.3in', left: '0.3in' } });
        await browser.close();

        // Build email
        const deliveryDate = new Date(bol.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        const destination = [bol.destination_address, bol.destination_city, bol.destination_state, bol.destination_zip].filter(Boolean).join(', ');
        const greeting = recipientName ? `Hi ${recipientName},` : 'Hello,';
        const customSection = customMessage ? `<p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #333;">${customMessage.replace(/\n/g, '<br>')}</p>` : '';

        const emailHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 30px 0;">
    <tr><td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          <tr><td style="background-color: #264027; padding: 28px 40px;">
              <h1 style="margin: 0; font-size: 22px; color: #ffffff; font-weight: 700;">Soil Seed &amp; Water</h1>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #a8c5a0;">Regenerative Soil Solutions</p>
          </td></tr>
          <tr><td style="padding: 36px 40px 24px 40px;">
              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #333;">${greeting}</p>
              ${customSection || `<p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #333;">Please find attached the Bill of Lading for your delivery. The PDF document is attached to this email for your records.</p>`}
          </td></tr>
          <tr><td style="padding: 0 40px 30px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8faf8; border: 1px solid #e0e8e0; border-radius: 8px; overflow: hidden;">
                <tr><td style="background-color: #264027; padding: 14px 20px;">
                    <span style="font-size: 16px; font-weight: 700; color: #ffffff;">${bol.bol_number}</span>
                    <span style="font-size: 12px; color: #a8c5a0; margin-left: 12px;">Bill of Lading</span>
                </td></tr>
                <tr><td style="padding: 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr><td style="padding: 6px 0; font-size: 13px; color: #666; width: 130px;">Delivery Date</td><td style="padding: 6px 0; font-size: 14px; color: #111; font-weight: 600;">${deliveryDate}</td></tr>
                      <tr><td style="padding: 6px 0; font-size: 13px; color: #666;">Customer</td><td style="padding: 6px 0; font-size: 14px; color: #111; font-weight: 600;">${bol.customer_name}</td></tr>
                      <tr><td style="padding: 6px 0; font-size: 13px; color: #666;">Destination</td><td style="padding: 6px 0; font-size: 14px; color: #111;">${destination}</td></tr>
                      <tr><td style="padding: 6px 0; font-size: 13px; color: #666;">Material</td><td style="padding: 6px 0; font-size: 14px; color: #111;">${bol.material_type}</td></tr>
                      ${hasWeight ? `<tr><td style="padding: 6px 0; font-size: 13px; color: #666;">Net Weight</td><td style="padding: 6px 0; font-size: 14px; color: #111; font-weight: 600;">${parseInt(bol.net_weight).toLocaleString()} lbs (${bol.net_weight_tons} tons)</td></tr>` : ''}
                      ${bol.carrier_name ? `<tr><td style="padding: 6px 0; font-size: 13px; color: #666;">Carrier</td><td style="padding: 6px 0; font-size: 14px; color: #111;">${bol.carrier_name}</td></tr>` : ''}
                    </table>
                </td></tr>
              </table>
          </td></tr>
          <tr><td style="padding: 0 40px 30px 40px;">
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #555;">If you have any questions about this delivery, don't hesitate to reach out.</p>
          </td></tr>
          <tr><td style="padding: 0 40px 36px 40px; border-top: 1px solid #eee; padding-top: 24px;">
              <p style="margin: 0 0 2px 0; font-size: 14px; color: #333; font-weight: 600;">Rodolfo Alvarez</p>
              <p style="margin: 0 0 2px 0; font-size: 13px; color: #666;">Soil Seed &amp; Water</p>
              <p style="margin: 0 0 2px 0; font-size: 13px; color: #666;">(928) 632-7125</p>
              <p style="margin: 0; font-size: 13px; color: #264027;">operations@soilseedandwater.com</p>
          </td></tr>
          <tr><td style="background-color: #f8f8f8; padding: 16px 40px; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #999;">Soil Seed &amp; Water &bull; 1634 N 19th Ave, Phoenix, AZ 85009 &bull; soilseedandwater.com</p>
          </td></tr>
        </table>
    </td></tr>
  </table>
</body></html>`;

        const plainText = customMessage || `${greeting}\n\nPlease find attached the Bill of Lading (${bol.bol_number}) for your delivery.\n\nMaterial: ${bol.material_type}\nDelivery Date: ${deliveryDate}\nDestination: ${destination}${hasWeight ? `\nNet Weight: ${parseInt(bol.net_weight).toLocaleString()} lbs (${bol.net_weight_tons} tons)` : ''}\n\nIf you have any questions, please don't hesitate to contact us.\n\nRodolfo Alvarez\nSoil Seed & Water\n(928) 632-7125\noperations@soilseedandwater.com`;

        // Send via Resend
        const RESEND_API_KEY = process.env.RESEND_API_KEY;
        if (!RESEND_API_KEY) throw new Error('Resend API key not configured');

        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'SSW Operations <operations@soilseedandwater.com>',
            to: [recipientEmail],
            subject: `Bill of Lading - ${bol.bol_number} | ${bol.customer_name}`,
            html: emailHtml,
            text: plainText,
            attachments: [{ filename: `${bol.bol_number}.pdf`, content: Buffer.from(pdfBuffer).toString('base64') }]
          })
        });

        if (!emailResponse.ok) {
          const errorData = await emailResponse.json();
          throw new Error(errorData.message || 'Failed to send email');
        }

        // Update BOL with sent info
        await db.from('ops_bols').update({ sent_to_email: recipientEmail, sent_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', bolId);

        return res.json({ success: true, message: `BOL sent successfully to ${recipientEmail}`, sentTo: recipientEmail });
      } catch (error) {
        console.error('Email BOL error:', error);
        return res.status(500).json({ error: error.message || 'Failed to send email' });
      }
    }

    // ============ COD ENDPOINTS ============

    // GET /api/admin/operations/cods
    if (path === '/api/admin/operations/cods' && req.method === 'GET') {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });

      try {
        let query = db.from('ops_cods').select('*');
        const clientTag = url.searchParams.get('client_tag');
        if (clientTag) query = query.eq('client_tag', clientTag);
        query = query.order('created_at', { ascending: false });
        const { data, error } = await query;
        if (error) throw error;
        return res.json(data);
      } catch (error) {
        console.error('CODs fetch error:', error);
        return res.status(500).json({ error: 'Failed to fetch CODs' });
      }
    }

    // POST /api/admin/operations/cods
    if (path === '/api/admin/operations/cods' && req.method === 'POST') {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });

      try {
        const { dateReceived, receivedFrom, salesOrder, freightOrder, vanguardWorkOrder, destructionLocation, materials, authorizedByName, authorizedByTitle, authorizedDate, notes, clientTag, bolId } = req.body || {};

        if (!receivedFrom || !destructionLocation || !materials || materials.length === 0) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        // Generate COD number
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
        const { count } = await db.from('ops_cods').select('id', { count: 'exact', head: true })
          .gte('created_at', `${today.toISOString().split('T')[0]}T00:00:00`)
          .lte('created_at', `${today.toISOString().split('T')[0]}T23:59:59`);
        const codNumber = `COD-${dateStr}-${((count || 0) + 1).toString().padStart(3, '0')}`;

        const { data, error } = await db.from('ops_cods').insert({
          cod_number: codNumber,
          date_received: dateReceived || new Date().toISOString(),
          received_from: receivedFrom,
          sales_order: salesOrder,
          freight_order: freightOrder,
          vanguard_work_order: vanguardWorkOrder,
          destruction_location: destructionLocation,
          materials,
          authorized_by_name: authorizedByName,
          authorized_by_title: authorizedByTitle,
          authorized_date: authorizedDate,
          notes,
          client_tag: clientTag || null,
          bol_id: bolId ? parseInt(bolId) : null,
          status: 'completed',
          created_by: admin.email || 'admin'
        }).select().single();

        if (error) throw error;
        return res.status(201).json(data);
      } catch (error) {
        console.error('COD create error:', error);
        return res.status(500).json({ error: 'Failed to create COD' });
      }
    }

    // POST /api/admin/operations/cods/delete
    if (path === '/api/admin/operations/cods/delete' && req.method === 'POST') {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });

      const { ids } = req.body || {};
      if (!ids || !Array.isArray(ids)) return res.status(400).json({ error: 'No IDs provided' });

      const { error } = await db.from('ops_cods').delete().in('id', ids);
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ success: true, deleted: ids.length });
    }

    // GET/PATCH /api/admin/operations/cods/:id
    const codDetailMatch = path.match(/^\/api\/admin\/operations\/cods\/(\d+)$/);
    if (codDetailMatch) {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });

      const codId = codDetailMatch[1];

      if (req.method === 'GET') {
        const { data, error } = await db.from('ops_cods').select('*').eq('id', codId).single();
        if (error || !data) return res.status(404).json({ error: 'COD not found' });
        return res.json(data);
      }

      if (req.method === 'PATCH') {
        const updates = req.body || {};
        const fieldMap = {
          dateReceived: 'date_received', receivedFrom: 'received_from', salesOrder: 'sales_order',
          freightOrder: 'freight_order', vanguardWorkOrder: 'vanguard_work_order',
          destructionLocation: 'destruction_location', materials: 'materials',
          authorizedByName: 'authorized_by_name', authorizedByTitle: 'authorized_by_title',
          authorizedDate: 'authorized_date', notes: 'notes', status: 'status',
          clientTag: 'client_tag', bolId: 'bol_id'
        };
        const dbUpdates = { updated_at: new Date().toISOString() };
        for (const [key, value] of Object.entries(updates)) {
          const snakeKey = fieldMap[key] || key;
          if (fieldMap[key] || key === 'status') dbUpdates[snakeKey] = value;
        }
        const { data, error } = await db.from('ops_cods').update(dbUpdates).eq('id', codId).select().single();
        if (error || !data) return res.status(404).json({ error: 'COD not found' });
        return res.json(data);
      }
    }

    // GET /api/admin/operations/cods/:id/pdf
    const codPdfMatch = path.match(/^\/api\/admin\/operations\/cods\/(\d+)\/pdf$/);
    if (codPdfMatch && req.method === 'GET') {
      const tokenFromQuery = url.searchParams.get('token');
      const tokenFromHeader = req.headers.authorization?.replace('Bearer ', '');
      const token = tokenFromQuery || tokenFromHeader;
      if (!token) return res.status(401).json({ error: 'Unauthorized' });

      try {
        const jwt = (await import('jsonwebtoken')).default;
        jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      } catch (e) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      const codId = codPdfMatch[1];
      const { data: cod, error } = await db.from('ops_cods').select('*').eq('id', codId).single();
      if (error || !cod) return res.status(404).json({ error: 'COD not found' });

      const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '';
      const materials = cod.materials || [];
      const materialRows = materials.map(m => `<tr><td style="padding:10px 12px;border-bottom:1px solid #e5e5e5;font-size:10pt">${m.material||''}</td><td style="padding:10px 12px;border-bottom:1px solid #e5e5e5;font-size:10pt;text-align:center">${m.quantity||''}</td><td style="padding:10px 12px;border-bottom:1px solid #e5e5e5;font-size:10pt;text-align:center">${m.uom||''}</td></tr>`).join('');
      const emptyRows = Array(Math.max(0, 5 - materials.length)).fill('<tr><td style="padding:10px 12px;border-bottom:1px solid #e5e5e5">&nbsp;</td><td style="padding:10px 12px;border-bottom:1px solid #e5e5e5">&nbsp;</td><td style="padding:10px 12px;border-bottom:1px solid #e5e5e5">&nbsp;</td></tr>').join('');

      const autoPrint = url.searchParams.get('print') !== 'false';
      const printScript = autoPrint ? `<script>window.onload=function(){setTimeout(function(){window.print()},500)}</script>` : '';

      const codHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${cod.cod_number} - Certificate of Destruction</title>
<style>
@page{size:letter;margin:0.4in}*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Helvetica Neue',Arial,sans-serif;font-size:10pt;line-height:1.5;color:#000;padding:20px;max-width:800px;margin:0 auto;background:white}
.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:25px;padding-bottom:15px;border-bottom:3px solid #264027}.logo-section{flex:1}.company-name{font-size:20pt;font-weight:bold;color:#264027;margin-bottom:4px}.tagline{font-size:9pt;color:#6f732f;margin-bottom:6px}.contact-info{font-size:8pt;color:#333}.doc-title{text-align:right;flex:1}.doc-title h1{font-size:18pt;color:#264027;margin-bottom:8px}.cod-number{font-size:11pt;font-weight:bold;color:#000}
.section{margin-bottom:20px}.section-title{font-size:10pt;font-weight:bold;color:#264027;background:#f5f5f5;padding:6px 10px;border-left:4px solid #264027;margin-bottom:10px}.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:15px}.info-row{display:flex;margin-bottom:8px;font-size:10pt}.label{font-weight:bold;min-width:150px;color:#333}.value{flex:1;color:#000}
.materials-table{width:100%;border-collapse:collapse;margin-top:10px}.materials-table th{background:#264027;color:white;padding:10px 12px;text-align:left;font-size:10pt;font-weight:600}.materials-table th:nth-child(2),.materials-table th:nth-child(3){text-align:center;width:100px}
.signature-section{margin-top:30px;padding-top:20px;border-top:1px solid #ccc}.signature-row{display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-bottom:20px}.signature-box{border-bottom:1px solid #000;padding-top:30px;padding-bottom:5px;min-height:50px}.signature-label{font-size:8pt;color:#666;margin-top:4px}
.disclaimer{margin-top:30px;padding:15px;background:#f9f9f9;border:1px solid #e0e0e0;border-radius:4px;font-size:9pt;color:#444;line-height:1.6}.footer{margin-top:25px;padding-top:15px;border-top:1px solid #ccc;font-size:8pt;color:#666;text-align:center}
@media screen{body{background:#f0f0f0;padding:20px}}
</style>${printScript}</head><body>
<div class="header"><div class="logo-section"><div class="company-name">Soil Seed and Water</div><div class="tagline">Regenerative Soil Solutions</div><div class="contact-info">18980 Stanton Rd, Congress, AZ 85332<br>Phone: (928) 632-7125<br>Email: info@soilseedandwater.com</div></div><div class="doc-title"><h1>Certificate of Destruction</h1><div class="cod-number">COD #: ${cod.cod_number}</div></div></div>
<div class="section"><div class="section-title">Receipt Information</div><div class="info-grid"><div><div class="info-row"><span class="label">Received From:</span><span class="value">${cod.received_from||''}</span></div><div class="info-row"><span class="label">Date Received:</span><span class="value">${formatDate(cod.date_received)}</span></div></div><div><div class="info-row"><span class="label">Destruction Location:</span><span class="value">${cod.destruction_location||''}</span></div></div></div></div>
<div class="section"><div class="section-title">Customer Reference Numbers</div><div class="info-grid"><div><div class="info-row"><span class="label">Sales Order:</span><span class="value">${cod.sales_order||'—'}</span></div><div class="info-row"><span class="label">Freight Order:</span><span class="value">${cod.freight_order||'—'}</span></div></div><div><div class="info-row"><span class="label">Vanguard Work Order #:</span><span class="value">${cod.vanguard_work_order||'—'}</span></div></div></div></div>
<div class="section"><div class="section-title">Materials Destroyed</div><table class="materials-table"><thead><tr><th>Material</th><th>Quantity</th><th>UOM</th></tr></thead><tbody>${materialRows}${emptyRows}</tbody></table></div>
<div class="signature-section"><div class="section-title">Authorization</div><div class="signature-row"><div><div class="info-row"><span class="label">Authorized By:</span><span class="value">${cod.authorized_by_name||''}</span></div><div class="info-row"><span class="label">Title:</span><span class="value">${cod.authorized_by_title||''}</span></div></div><div><div class="info-row"><span class="label">Date:</span><span class="value">${formatDate(cod.authorized_date)}</span></div></div></div><div class="signature-row"><div><div class="signature-box"></div><div class="signature-label">Authorized Signature</div></div><div><div class="signature-box"></div><div class="signature-label">SSW Representative Signature</div></div></div></div>
<div class="disclaimer"><strong>Certification:</strong> Vanguard warrants that all organic materials listed above were presented and have been destroyed for the purpose of the recycling of organic materials into soil amendments and compost products.</div>
${cod.notes?`<div class="section" style="margin-top:15px"><div class="section-title">Notes</div><div style="padding:8px 10px;background:#fafafa;border-radius:4px;font-size:9pt">${cod.notes}</div></div>`:''}
<div class="footer">Certificate of Destruction - ${cod.cod_number} | Generated by Soil Seed and Water Operations System</div>
</body></html>`;

      res.setHeader('Content-Type', 'text/html');
      return res.send(codHtml);
    }

    // ============ WORK ORDERS ENDPOINTS ============

    // Airtable configuration for SSW1 base (products)
    const SSW1_BASE_ID = "appDCKrxtJ7oG9O19";
    const PRODUCTS_TABLE_ID = "tbltXMzV96FnmrjFw";
    const SIZE_CATEGORIES_TABLE_ID = "tblkNN71Iiyh2GjEi";
    const INGREDIENTS_TABLE_ID = "tblujGuwLKvJzgOR4";
    const PALLET_CONFIG_TABLE_ID = "tblNqNFuOXsI6ZKeV";

    // Pallet configuration data (from Airtable Pallet Configuration table)
    const PALLET_CONFIGS = {
      '9lb': { unitsPerPallet: 144, weightPerPallet: 1296, config: 'Boxed pallet, 4 units per box, 36 boxes per pallet. Total of 144 units', weightPerUnit: 9 },
      '7.5qt': { unitsPerPallet: 144, weightPerPallet: 1000, config: 'Boxed pallet, 4 units per box, 36 boxes per pallet. Total of 144 units', weightPerUnit: 7 },
      '1cf': { unitsPerPallet: 50, weightPerPallet: 2000, config: 'Without boxes, bags stacked on pallet. 50 (1CF bags) per pallet', weightPerUnit: 40 },
      '1.5cf': { unitsPerPallet: 50, weightPerPallet: 2000, config: '50 per pallet', weightPerUnit: 40 },
      '2cf': { unitsPerPallet: 25, weightPerPallet: 2000, config: '25 per pallet', weightPerUnit: 80 },
      'tote': { unitsPerPallet: 1, weightPerPallet: 2000, config: '1 unit per pallet (2.2 cubic yards)', weightPerUnit: 2000 },
      'bulk': { unitsPerPallet: null, weightPerPallet: 2000, config: 'Bulk calculated by tonnage (2000 lbs each). Usually 22-24 tons per truck.', weightPerUnit: null },
    };

    // Helper: Fetch all ingredients for name lookup
    async function fetchIngredientsLookup() {
      const lookup = {};
      let offset;
      do {
        const urlStr = `https://api.airtable.com/v0/${SSW1_BASE_ID}/${INGREDIENTS_TABLE_ID}?fields%5B%5D=Name&pageSize=100${offset ? `&offset=${offset}` : ''}`;
        const response = await fetch(urlStr, {
          headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
        });
        if (!response.ok) break;
        const data = await response.json();
        for (const record of data.records || []) {
          if (record.fields && record.fields.Name) {
            lookup[record.id] = record.fields.Name;
          }
        }
        offset = data.offset;
      } while (offset);
      return lookup;
    }

    // Helper: Generate WO number
    async function generateWONumber() {
      const today = new Date();
      const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");
      const { count } = await db
        .from("ops_work_orders")
        .select("id", { count: "exact", head: true })
        .gte("created_at", `${today.toISOString().split("T")[0]}T00:00:00`)
        .lte("created_at", `${today.toISOString().split("T")[0]}T23:59:59`);
      const sequence = ((count || 0) + 1).toString().padStart(3, "0");
      return `WO-${dateStr}-${sequence}`;
    }

    // Helper: Generate size category code from name
    function generateSizeCategoryCode(name) {
      const lower = name.toLowerCase();
      if (lower.includes("9 lb") || lower.includes("9lb")) return "9lb";
      if (lower.includes("7.5 qt") || lower.includes("7.5qt")) return "7.5qt";
      if (lower.includes("1.5 cf") || lower.includes("1.5cf")) return "1.5cf";
      if (lower.includes("2 cf") || lower.includes("2cf")) return "2cf";
      if (lower.includes("1 cf") || lower.includes("1cf")) return "1cf";
      if (lower.includes("tote") || lower.includes("super sack")) return "tote";
      if (lower.includes("bulk") || lower.includes("cubic yard")) return "bulk";
      return lower.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 20);
    }

    // Helper: Fetch products from Airtable with ingredient name resolution
    async function fetchProductsFromAirtable() {
      // First, get ingredients lookup
      const ingredientsLookup = await fetchIngredientsLookup();

      const products = [];
      let offset;
      do {
        const urlStr = `https://api.airtable.com/v0/${SSW1_BASE_ID}/${PRODUCTS_TABLE_ID}?pageSize=100${offset ? `&offset=${offset}` : ''}`;
        const response = await fetch(urlStr, {
          headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
        });
        if (!response.ok) throw new Error(`Airtable error: ${response.status}`);
        const data = await response.json();
        for (const record of data.records || []) {
          const fields = record.fields || {};

          // Resolve ingredient record IDs to actual names
          let ingredientsList = null;
          if (Array.isArray(fields["Ingredients"])) {
            const resolvedNames = fields["Ingredients"]
              .map(id => ingredientsLookup[id] || id)
              .filter(name => name && !name.startsWith('rec')); // Filter out unresolved IDs
            ingredientsList = resolvedNames.length > 0 ? resolvedNames.join(", ") : null;
          } else if (typeof fields["Ingredients"] === 'string') {
            ingredientsList = fields["Ingredients"];
          }

          products.push({
            airtableId: record.id,
            productName: fields["Product Name "] || fields["Product Name"] || fields["Name"] || "Unknown",
            productId: fields["Product ID"] || null,
            ingredientRatios: fields["Ingredient Ratios"] || null,
            ingredientsList: ingredientsList,
            sizeCategories: Array.isArray(fields["Size Categories"]) ? fields["Size Categories"] : [],
            certifications: Array.isArray(fields["Certifications"]) ? fields["Certifications"] : [],
          });
        }
        offset = data.offset;
      } while (offset);
      return products;
    }

    // Helper: Fetch size categories from Airtable
    async function fetchSizeCategoriesFromAirtable() {
      const categories = [];
      let offset;
      do {
        const urlStr = `https://api.airtable.com/v0/${SSW1_BASE_ID}/${SIZE_CATEGORIES_TABLE_ID}?pageSize=100${offset ? `&offset=${offset}` : ''}`;
        const response = await fetch(urlStr, {
          headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
        });
        if (!response.ok) throw new Error(`Airtable error: ${response.status}`);
        const data = await response.json();
        for (const record of data.records || []) {
          const fields = record.fields || {};
          const name = fields["Name"] || "Unknown";
          categories.push({
            airtableId: record.id,
            name: name,
            code: generateSizeCategoryCode(name),
            unitsPerPallet: fields["Units per pallet"] || null,
            estimatedPalletWeight: fields["Estimated pallet weight"] || null,
            illustrationUrl: Array.isArray(fields["Size category illustration"]) && fields["Size category illustration"][0]
              ? fields["Size category illustration"][0].url : null,
            palletConfiguration: fields["Pallet Configuration"] || null,
          });
        }
        offset = data.offset;
      } while (offset);
      return categories;
    }

    // GET /api/admin/operations/work-orders/products
    if (path === '/api/admin/operations/work-orders/products' && req.method === 'GET') {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });

      // Try cache first
      const { data: cached } = await db.from('ops_products_cache').select('*').order('product_name', { ascending: true });
      if (cached && cached.length > 0) {
        return res.json(cached);
      }

      // Fallback: fetch from Airtable and cache
      try {
        const products = await fetchProductsFromAirtable();
        for (const product of products) {
          await db.from('ops_products_cache').upsert({
            airtable_id: product.airtableId,
            product_name: product.productName,
            product_id: product.productId,
            ingredient_ratios: product.ingredientRatios,
            ingredients_list: product.ingredientsList,
            size_categories: product.sizeCategories,
            certifications: product.certifications,
            last_synced_at: new Date().toISOString(),
          }, { onConflict: 'airtable_id' });
        }
        const { data: freshData } = await db.from('ops_products_cache').select('*').order('product_name', { ascending: true });
        return res.json(freshData || []);
      } catch (err) {
        console.error('Airtable fetch error:', err);
        return res.json([]);
      }
    }

    // GET /api/admin/operations/work-orders/size-categories
    if (path === '/api/admin/operations/work-orders/size-categories' && req.method === 'GET') {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });

      // Try cache first
      const { data: cached } = await db.from('ops_size_categories_cache').select('*').order('name', { ascending: true });
      if (cached && cached.length > 0) {
        return res.json(cached);
      }

      // Fallback: fetch from Airtable and cache
      try {
        const categories = await fetchSizeCategoriesFromAirtable();
        for (const cat of categories) {
          await db.from('ops_size_categories_cache').upsert({
            airtable_id: cat.airtableId,
            name: cat.name,
            code: cat.code,
            units_per_pallet: cat.unitsPerPallet,
            estimated_pallet_weight: cat.estimatedPalletWeight,
            illustration_url: cat.illustrationUrl,
            pallet_configuration: cat.palletConfiguration,
            last_synced_at: new Date().toISOString(),
          }, { onConflict: 'airtable_id' });
        }
        const { data: freshData } = await db.from('ops_size_categories_cache').select('*').order('name', { ascending: true });
        return res.json(freshData || []);
      } catch (err) {
        console.error('Airtable fetch error:', err);
        return res.json([]);
      }
    }

    // POST /api/admin/operations/work-orders/sync-products
    if (path === '/api/admin/operations/work-orders/sync-products' && req.method === 'POST') {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });

      try {
        const products = await fetchProductsFromAirtable();
        let productsSynced = 0;
        for (const product of products) {
          const { error } = await db.from('ops_products_cache').upsert({
            airtable_id: product.airtableId,
            product_name: product.productName,
            product_id: product.productId,
            ingredient_ratios: product.ingredientRatios,
            ingredients_list: product.ingredientsList,
            size_categories: product.sizeCategories,
            certifications: product.certifications,
            last_synced_at: new Date().toISOString(),
          }, { onConflict: 'airtable_id' });
          if (!error) productsSynced++;
        }

        const categories = await fetchSizeCategoriesFromAirtable();
        let categoriesSynced = 0;
        for (const cat of categories) {
          const { error } = await db.from('ops_size_categories_cache').upsert({
            airtable_id: cat.airtableId,
            name: cat.name,
            code: cat.code,
            units_per_pallet: cat.unitsPerPallet,
            estimated_pallet_weight: cat.estimatedPalletWeight,
            illustration_url: cat.illustrationUrl,
            pallet_configuration: cat.palletConfiguration,
            last_synced_at: new Date().toISOString(),
          }, { onConflict: 'airtable_id' });
          if (!error) categoriesSynced++;
        }

        return res.json({
          success: true,
          products: { synced: productsSynced, errors: [] },
          sizeCategories: { synced: categoriesSynced, errors: [] },
        });
      } catch (err) {
        console.error('Sync error:', err);
        return res.status(500).json({ error: err.message });
      }
    }

    // POST /api/admin/operations/work-orders/calculate-mix
    if (path === '/api/admin/operations/work-orders/calculate-mix' && req.method === 'POST') {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });

      const { productName, ingredientRatios, sizeCategory, sizeCategoryName, unitsPerPallet, estimatedPalletWeight, quantity, quantityType } = req.body || {};

      // Get pallet config from our lookup table
      const palletConfig = PALLET_CONFIGS[sizeCategory] || {};
      const configUnitsPerPallet = unitsPerPallet || palletConfig.unitsPerPallet || 0;
      const configWeightPerPallet = palletConfig.weightPerPallet || 0;
      const configWeightPerUnit = palletConfig.weightPerUnit || 0;
      const configDescription = palletConfig.config || '';

      // Parse estimated weight if provided
      let palletWeightLbs = configWeightPerPallet;
      if (estimatedPalletWeight) {
        const parsed = parseFloat(estimatedPalletWeight.replace(/,/g, "").replace(/\s*lbs?/i, ""));
        if (parsed > 0) palletWeightLbs = parsed;
      }

      let totalWeight = 0;
      let calculationDetails = "";

      if (quantityType === "pallet" && palletWeightLbs > 0) {
        totalWeight = quantity * palletWeightLbs;
        calculationDetails = `${quantity} pallet${quantity > 1 ? "s" : ""} x ${palletWeightLbs.toLocaleString()} lbs = ${totalWeight.toLocaleString()} lbs`;
      } else if (quantityType === "unit" && configWeightPerUnit > 0) {
        totalWeight = quantity * configWeightPerUnit;
        calculationDetails = `${quantity} unit${quantity > 1 ? "s" : ""} @ ${configWeightPerUnit} lbs each = ${totalWeight.toLocaleString()} lbs`;
      } else if (quantity > 0 && palletWeightLbs > 0) {
        // Default to pallet calculation
        totalWeight = quantity * palletWeightLbs;
        calculationDetails = `${quantity} x ${palletWeightLbs.toLocaleString()} lbs = ${totalWeight.toLocaleString()} lbs`;
      }

      // Round up to minimum batch size (2 tons = 4000 lbs) if needed
      let roundUpNote = "";
      if (totalWeight > 0 && totalWeight < 4000) {
        roundUpNote = `\n\nNote: Minimum recommended batch size is 2 tons (4,000 lbs). Consider rounding up for efficiency.`;
      }

      // Parse and calculate ingredient breakdown
      let ingredientBreakdown = "";
      if (ingredientRatios && totalWeight > 0) {
        const ratioLines = [];
        // Match patterns like "50% dairy compost" or "100% Worm Castings"
        const ratioMatch = ingredientRatios.match(/(\d+)%\s*([^,]+)/g);
        if (ratioMatch) {
          let totalPercentage = 0;
          for (const match of ratioMatch) {
            const [, percent, ingredient] = match.match(/(\d+)%\s*(.+)/) || [];
            if (percent && ingredient) {
              const percentage = parseInt(percent);
              totalPercentage += percentage;
              const weight = Math.round((percentage / 100) * totalWeight);
              ratioLines.push(`${ingredient.trim()} = ${percentage}% → ${weight.toLocaleString()} lbs`);
            }
          }
          // Validate percentages add up
          const actualNote = totalPercentage !== 100 ? ` (Actual ${totalPercentage}%)` : '';
          ingredientBreakdown = ratioLines.join("\n");
        } else if (ingredientRatios.toLowerCase().includes('100%')) {
          // Single ingredient at 100%
          const ingredientName = ingredientRatios.replace(/100%\s*/i, '').trim();
          ingredientBreakdown = `${ingredientName || 'Primary ingredient'} = 100% → ${totalWeight.toLocaleString()} lbs`;
        } else {
          ingredientBreakdown = `${ingredientRatios}: 100% → ${totalWeight.toLocaleString()} lbs`;
        }
      }

      const guidelines = `Pallet configuration: ${sizeCategoryName || sizeCategory}
${configDescription ? `${configDescription}` : ''}
${configUnitsPerPallet ? `Units per pallet: ${configUnitsPerPallet}` : ''}

Total estimated final weight: ${calculationDetails}

Total ingredient for mix:
${ingredientBreakdown || 'No ingredient ratios specified'}

Total anticipated product weight: ${totalWeight.toLocaleString()} lbs${roundUpNote}`.trim();

      return res.json({ mixingGuidelines: guidelines, totalWeightLbs: Math.round(totalWeight) });
    }

    // POST /api/admin/operations/work-orders/delete
    if (path === '/api/admin/operations/work-orders/delete' && req.method === 'POST') {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });

      const { ids } = req.body || {};
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: 'No IDs provided' });
      }

      const { error } = await db.from('ops_work_orders').delete().in('id', ids);
      if (error) throw error;

      return res.json({ success: true, deleted: ids.length });
    }

    // GET /api/admin/operations/work-orders - List all work orders
    if (path === '/api/admin/operations/work-orders' && req.method === 'GET') {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });

      const status = url.searchParams.get('status');
      const dateFilter = url.searchParams.get('dateFilter');
      const search = url.searchParams.get('search');

      let query = db.from('ops_work_orders').select('*').order('created_at', { ascending: false });

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      if (dateFilter && dateFilter !== 'all') {
        const now = new Date();
        let startDate = new Date();
        switch (dateFilter) {
          case 'today': startDate.setHours(0, 0, 0, 0); break;
          case 'week': startDate.setDate(now.getDate() - 7); break;
          case 'month': startDate.setMonth(now.getMonth() - 1); break;
          case '3months': startDate.setMonth(now.getMonth() - 3); break;
        }
        query = query.gte('created_at', startDate.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      let filteredData = data || [];
      if (search && search.trim()) {
        const searchLower = search.toLowerCase().trim();
        filteredData = filteredData.filter(wo =>
          wo.wo_number?.toLowerCase().includes(searchLower) ||
          wo.product_name?.toLowerCase().includes(searchLower) ||
          wo.product_id?.toLowerCase().includes(searchLower)
        );
      }

      return res.json(filteredData);
    }

    // POST /api/admin/operations/work-orders - Create new work order
    if (path === '/api/admin/operations/work-orders' && req.method === 'POST') {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });

      const body = req.body || {};

      if (!body.sizeCategory) {
        return res.status(400).json({ message: 'Size category is required' });
      }
      if (!body.quantity || body.quantity < 1) {
        return res.status(400).json({ message: 'Quantity must be at least 1' });
      }

      const woNumber = await generateWONumber();

      const { data, error } = await db.from('ops_work_orders').insert({
        wo_number: woNumber,
        product_type: body.productType || 'standard',
        product_name: body.productName,
        product_id: body.productId,
        airtable_product_id: body.airtableProductId,
        size_category: body.sizeCategory,
        size_category_name: body.sizeCategoryName,
        units_per_pallet: body.unitsPerPallet,
        estimated_pallet_weight: body.estimatedPalletWeight,
        quantity: parseInt(body.quantity),
        quantity_type: body.quantityType || 'pallet',
        ingredient_ratios: body.ingredientRatios,
        ingredients_list: body.ingredientsList,
        mixing_guidelines: body.mixingGuidelines,
        total_weight_lbs: body.totalWeightLbs ? parseFloat(body.totalWeightLbs) : null,
        custom_notes: body.customNotes,
        needs_transportation: body.needsTransportation || false,
        destination_address: body.destinationAddress,
        destination_city: body.destinationCity,
        destination_state: body.destinationState,
        destination_zip: body.destinationZip,
        preferred_delivery_date: body.preferredDeliveryDate || null,
        preferred_delivery_time: body.preferredDeliveryTime,
        linked_bol_id: body.linkedBolId || null,
        work_order_notes: body.workOrderNotes || null,
        status: 'pending',
        priority: body.priority || 'normal',
        created_by: admin.email || 'admin@ssw.com',
      }).select().single();

      if (error) throw error;
      return res.status(201).json(data);
    }

    // GET /api/admin/operations/work-orders/:id/pdf - Generate PDF (HTML for browser print)
    // Query params: type=guide|label|both (default: both), print=true|false (default: true)
    const woPdfMatch = path.match(/^\/api\/admin\/operations\/work-orders\/(\d+)\/pdf$/);
    if (woPdfMatch && req.method === 'GET') {
      const tokenFromQuery = url.searchParams.get('token');
      const tokenFromHeader = req.headers.authorization?.replace('Bearer ', '');
      const token = tokenFromQuery || tokenFromHeader;
      const pdfType = url.searchParams.get('type') || 'guide'; // 'guide', 'label', or 'both' - default to guide only
      const printParam = url.searchParams.get('print');
      const autoPrint = printParam === 'true'; // Only auto-print if explicitly set to 'true'

      if (!token) return res.status(401).json({ error: 'Unauthorized' });

      try {
        const jwt = (await import('jsonwebtoken')).default;
        jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      } catch (e) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      const woId = woPdfMatch[1];
      const { data: wo, error } = await db.from('ops_work_orders').select('*').eq('id', woId).single();

      if (error || !wo) return res.status(404).json({ error: 'Work order not found' });

      // Fetch size category image from cache
      let sizeCategoryImageUrl = null;
      if (wo.size_category) {
        const { data: sizeCategory } = await db.from('ops_size_categories_cache')
          .select('illustration_url')
          .eq('code', wo.size_category)
          .single();
        sizeCategoryImageUrl = sizeCategory?.illustration_url || null;
      }

      // Fetch product illustration and convert to base64 for PDF embedding
      let productIllustrationBase64 = null;
      if (wo.product_id) {
        const { data: product } = await db.from('ops_products_cache')
          .select('illustration_url')
          .eq('product_id', wo.product_id)
          .single();

        if (product?.illustration_url) {
          try {
            // Always use production domain for images (avoid self-referencing issues with VERCEL_URL)
            const baseUrl = 'https://www.organicsoilwholesale.com';
            const imageUrl = `${baseUrl}${product.illustration_url}`;
            console.log('Fetching product illustration from:', imageUrl);

            const imageResponse = await fetch(imageUrl);
            if (imageResponse.ok) {
              const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
              const ext = product.illustration_url.split('.').pop() || 'webp';
              const mimeType = ext === 'webp' ? 'image/webp' : ext === 'png' ? 'image/png' : 'image/jpeg';
              productIllustrationBase64 = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
            } else {
              console.warn('Failed to fetch product illustration:', imageResponse.status);
            }
          } catch (imgError) {
            console.warn('Could not fetch product illustration:', imgError);
          }
        }
      }

      const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      const today = formatDate(new Date().toISOString());
      const createdDate = wo.created_at ? formatDate(wo.created_at) : today;

      // Auto-print script
      const printScript = autoPrint ? `<script>window.onload = function() { setTimeout(function() { window.print(); }, 500); }</script>` : '';

      // Production Guide Page
      const guidePage = `
<div class="page">
  <div class="header">
    <div><div class="company-name">Soil Seed & Water</div><div class="tagline">Regenerative Soil Solutions</div></div>
    <div style="text-align:right"><div class="wo-number">${wo.wo_number}</div><div class="doc-date">${createdDate}</div><div style="margin-top:8px"><span class="status-badge status-${wo.status}">${wo.status.replace("_", " ")}</span></div></div>
  </div>
  <div class="section"><div class="section-title">Product Information</div>
    <div class="product-header" style="display: flex; gap: 16px; align-items: flex-start;">
      ${productIllustrationBase64 ? `<div class="product-image" style="width: 100px; height: 100px; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: #f9f9f9;"><img src="${productIllustrationBase64}" alt="${wo.product_name}" style="max-width: 100%; max-height: 100%; object-fit: contain;" /></div>` : ""}
      <div style="flex: 1;">
        <div class="product-name">${wo.product_name || "Custom Product"}</div>
        <div class="info-grid">
          ${wo.product_id ? `<span class="info-label">Product ID:</span><span class="info-value">${wo.product_id}</span>` : ""}
          <span class="info-label">Work Order:</span><span class="info-value">${wo.wo_number}</span>
          ${wo.order_type ? `<span class="info-label">Order Type:</span><span class="info-value" style="text-transform:capitalize">${wo.order_type}</span>` : ""}
          <span class="info-label">Created:</span><span class="info-value">${createdDate}</span>
          <span class="info-label">Priority:</span><span class="info-value" style="text-transform:capitalize">${wo.priority || "Normal"}</span>
          ${wo.created_by ? `<span class="info-label">Created By:</span><span class="info-value">${wo.created_by}</span>` : ""}
        </div>
      </div>
    </div>
  </div>
  <div class="section"><div class="section-title">Size & Quantity</div>
    <div class="size-quantity-container">
      ${sizeCategoryImageUrl ? `<div class="size-image-container"><img src="${sizeCategoryImageUrl}" alt="${wo.size_category_name || wo.size_category}" class="size-category-image" loading="lazy" /></div>` : ""}
      <div class="highlight-box" style="${sizeCategoryImageUrl ? 'flex:1' : ''}">
        <div class="highlight-row"><span class="highlight-label">Size Category</span><span class="highlight-value">${wo.size_category_name || wo.size_category}</span></div>
        <div class="highlight-row"><span class="highlight-label">Quantity</span><span class="highlight-value">${wo.quantity} ${wo.quantity_type === "pallet" ? "Pallet" : "Unit"}${wo.quantity > 1 ? "s" : ""}</span></div>
        ${wo.units_per_pallet ? `<div class="highlight-row"><span class="highlight-label">Units per Pallet</span><span class="highlight-value">${wo.units_per_pallet}</span></div>` : ""}
        ${wo.total_weight_lbs ? `<div class="highlight-row"><span class="highlight-label">Total Estimated Weight</span><span class="highlight-value">${wo.total_weight_lbs.toLocaleString()} lbs</span></div>` : ""}
      </div>
    </div>
  </div>
  ${wo.ingredient_ratios || wo.ingredients_list ? `<div class="section"><div class="section-title">Ingredients</div>
    <div class="info-grid" style="padding:0 8px">
      ${wo.ingredient_ratios ? `<span class="info-label">Ingredient Ratios:</span><span class="info-value">${wo.ingredient_ratios}</span>` : ""}
      ${wo.ingredients_list ? `<span class="info-label">Ingredients:</span><span class="info-value">${wo.ingredients_list}</span>` : ""}
    </div></div>` : ""}
  ${wo.mixing_guidelines ? `<div class="section"><div class="section-title">Mixing Guidelines</div><div class="mixing-box">${wo.mixing_guidelines}</div></div>` : ""}
  ${wo.custom_notes ? `<div class="section"><div class="section-title">Notes</div><div style="background:#fff9e6;border:1px solid #f0e0a0;border-radius:8px;padding:12px 16px">${wo.custom_notes}</div></div>` : ""}
  ${wo.needs_transportation ? `<div class="section"><div class="section-title">Delivery Information</div>
    <div class="info-grid" style="padding:0 8px">
      <span class="info-label">Destination:</span><span class="info-value">${wo.destination_address || ""}${wo.destination_city ? `, ${wo.destination_city}` : ""}${wo.destination_state ? `, ${wo.destination_state}` : ""} ${wo.destination_zip || ""}</span>
      ${wo.preferred_delivery_date ? `<span class="info-label">Preferred Date:</span><span class="info-value">${formatDate(wo.preferred_delivery_date)}</span>` : ""}
    </div></div>` : ""}
  <div class="footer">Soil Seed & Water | 18980 Stanton Rd, Congress, AZ 85332 | (928) 632-7125 | info@soilseedandwater.com</div>
</div>`;

      // Pallet Label Page
      const labelPage = `
<div class="page label-page">
  <div class="pallet-label">
    <div style="font-family:'Cormorant Garamond',serif;font-size:20pt;color:#264027">Soil Seed & Water</div>
    <div class="label-wo">${wo.wo_number}</div>
    <div class="label-product">${wo.product_name || "Custom Product"}</div>
    ${sizeCategoryImageUrl ? `<div class="label-image-container"><img src="${sizeCategoryImageUrl}" alt="${wo.size_category_name || wo.size_category}" class="label-size-image" loading="lazy" /></div>` : ""}
    <div class="label-info"><strong>${wo.size_category_name || wo.size_category}</strong></div>
    ${wo.units_per_pallet ? `<div class="label-info">${wo.units_per_pallet} units per pallet</div>` : ""}
    <div style="font-size:14pt;color:#666;margin-top:24px">Date Produced: _______________</div>
    <div class="label-pallet-number">Pallet ___ of ${wo.quantity}</div>
    <div style="margin-top:32px;padding-top:16px;border-top:2px solid #264027;font-size:10pt;color:#666">SSW BioSoils | Regenerative Soil Solutions | OMRI Listed</div>
  </div>
</div>`;

      // Determine which pages to include
      // Accept both 'guide' and 'workorder' for the production guide
      let pages = '';
      let title = wo.wo_number;
      if (pdfType === 'guide' || pdfType === 'workorder') {
        pages = guidePage;
        title = `${wo.wo_number} - Production Guide`;
      } else if (pdfType === 'label') {
        pages = labelPage;
        title = `${wo.wo_number} - Pallet Label`;
      } else if (pdfType === 'both') {
        pages = guidePage + labelPage;
        title = `${wo.wo_number} - Production Guide & Label`;
      } else {
        // Default to guide only
        pages = guidePage;
        title = `${wo.wo_number} - Production Guide`;
      }

      const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>${title}</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Montserrat:wght@400;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
@page { size: letter; margin: 0.5in; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Inter', Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #1a1a1a; background: white; }
.page { width: 7.5in; min-height: 10in; padding: 0.5in; margin: 0 auto; background: white; page-break-after: always; position: relative; }
.page:last-child { page-break-after: auto; }
.header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 3px solid #264027; flex-wrap: nowrap; }
.company-name { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 22pt; font-weight: 600; color: #264027; white-space: nowrap; }
.tagline { font-family: 'Montserrat', Arial, sans-serif; font-size: 9pt; font-weight: 500; color: #6f732f; letter-spacing: 1px; text-transform: uppercase; }
.wo-number { font-family: 'Montserrat', Arial, sans-serif; font-size: 22pt; font-weight: 700; color: #264027; white-space: nowrap; }
.doc-date { font-size: 11pt; color: #666; margin-top: 4px; }
.section { margin-bottom: 20px; }
.section-title { font-family: 'Montserrat', Arial, sans-serif; font-size: 12pt; font-weight: 600; color: #264027; background: #f5f7f5; padding: 8px 12px; border-left: 4px solid #264027; margin-bottom: 12px; text-transform: uppercase; }
.product-name { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 22pt; font-weight: 600; margin-bottom: 12px; color: #1a1a1a; }
.info-grid { display: grid; grid-template-columns: 140px 1fr; gap: 6px 16px; }
.info-label { font-weight: 600; color: #555; font-size: 10pt; }
.info-value { color: #1a1a1a; font-size: 10pt; }
.size-quantity-container { display: flex; gap: 20px; align-items: flex-start; margin: 16px 0; }
.size-image-container { width: 160px; flex-shrink: 0; }
.size-category-image { width: 100%; height: auto; max-height: 160px; object-fit: contain; border-radius: 8px; border: 1px solid #ddd; background: #f9f9f9; }
.highlight-box { background: #e8f5e9; border: 2px solid #264027; border-radius: 8px; padding: 16px 20px; }
.highlight-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(38,64,39,0.2); }
.highlight-row:last-child { border-bottom: none; }
.highlight-label { font-family: 'Montserrat', Arial, sans-serif; font-weight: 600; color: #264027; }
.highlight-value { font-family: 'Montserrat', Arial, sans-serif; font-weight: 700; font-size: 14pt; color: #264027; }
.mixing-box { background: #fafafa; border: 1px solid #ddd; border-radius: 8px; padding: 16px; white-space: pre-wrap; font-size: 11pt; line-height: 1.6; }
.status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 10pt; font-weight: 600; text-transform: uppercase; }
.status-pending { background: #fff3cd; color: #856404; }
.status-scheduled { background: #cce5ff; color: #004085; }
.status-in_progress { background: #d4edda; color: #155724; }
.status-completed { background: #264027; color: white; }
.footer { position: absolute; bottom: 0.25in; left: 0.5in; right: 0.5in; padding-top: 12px; border-top: 1px solid #ddd; font-size: 8pt; color: #999; text-align: center; }
.label-page { display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 0.5in; }
.pallet-label { width: 100%; border: 4px solid #264027; border-radius: 12px; padding: 40px; text-align: center; background: white; }
.label-wo { font-family: 'Montserrat', Arial, sans-serif; font-size: 48pt; font-weight: 700; color: #264027; margin: 16px 0; }
.label-product { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 28pt; font-weight: 600; margin: 24px 0; color: #1a1a1a; }
.label-info { font-size: 16pt; margin: 12px 0; color: #1a1a1a; }
.label-pallet-number { font-family: 'Montserrat', Arial, sans-serif; font-size: 24pt; font-weight: 600; color: #264027; margin-top: 20px; }
.label-image-container { margin: 16px 0; }
.label-size-image { max-width: 200px; max-height: 150px; object-fit: contain; border-radius: 8px; }
@media print { body { background: white; } .page { margin: 0; width: 100%; } }
@media screen {
  body { background: #f5f5f5; padding: 10px; margin: 0; }
  .page {
    width: 7.5in;
    max-width: 7.5in;
    min-height: auto;
    padding: 0.4in;
    margin: 0 auto 16px auto;
    box-shadow: 0 1px 4px rgba(0,0,0,0.1);
    box-sizing: border-box;
    transform-origin: top left;
    transform: scale(0.85);
  }
}
</style>
${printScript}
</head><body>
${pages}
</body></html>`;

      res.setHeader('Content-Type', 'text/html');
      return res.send(html);
    }

    // GET /api/admin/operations/work-orders/:id - Get single work order
    const woDetailMatch = path.match(/^\/api\/admin\/operations\/work-orders\/(\d+)$/);
    if (woDetailMatch && req.method === 'GET') {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });

      const woId = woDetailMatch[1];
      const { data, error } = await db.from('ops_work_orders').select('*').eq('id', woId).single();

      if (error) {
        if (error.code === 'PGRST116') return res.status(404).json({ error: 'Work order not found' });
        throw error;
      }
      return res.json(data);
    }

    // PATCH /api/admin/operations/work-orders/:id - Update work order
    if (woDetailMatch && req.method === 'PATCH') {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });

      const woId = woDetailMatch[1];
      const updates = req.body || {};

      const fieldMap = {
        productType: 'product_type', productName: 'product_name', productId: 'product_id',
        airtableProductId: 'airtable_product_id', sizeCategory: 'size_category', sizeCategoryName: 'size_category_name',
        unitsPerPallet: 'units_per_pallet', estimatedPalletWeight: 'estimated_pallet_weight', quantityType: 'quantity_type',
        ingredientRatios: 'ingredient_ratios', ingredientsList: 'ingredients_list', mixingGuidelines: 'mixing_guidelines',
        totalWeightLbs: 'total_weight_lbs', customNotes: 'custom_notes', needsTransportation: 'needs_transportation',
        destinationAddress: 'destination_address', destinationCity: 'destination_city', destinationState: 'destination_state',
        destinationZip: 'destination_zip', preferredDeliveryDate: 'preferred_delivery_date', preferredDeliveryTime: 'preferred_delivery_time',
        linkedBolId: 'linked_bol_id',
      };

      const snakeCaseUpdates = {};
      for (const [key, value] of Object.entries(updates)) {
        const snakeKey = fieldMap[key] || key;
        snakeCaseUpdates[snakeKey] = value;
      }
      snakeCaseUpdates.updated_at = new Date().toISOString();

      const { data, error } = await db.from('ops_work_orders').update(snakeCaseUpdates).eq('id', woId).select().single();

      if (error) {
        if (error.code === 'PGRST116') return res.status(404).json({ error: 'Work order not found' });
        throw error;
      }
      return res.json(data);
    }

    // ============ OPERATIONS TASK BOARD ENDPOINTS ============

    // GET /api/admin/operations/tasks/projects - List all projects
    if (path === '/api/admin/operations/tasks/projects' && req.method === 'GET') {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });

      const { data, error } = await db.from('ops_projects').select('*').order('name');
      if (error) throw error;
      return res.json(data || []);
    }

    // POST /api/admin/operations/tasks/projects - Create a project
    if (path === '/api/admin/operations/tasks/projects' && req.method === 'POST') {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });

      const { name, color } = req.body || {};
      if (!name) return res.status(400).json({ message: 'Name is required' });

      const { data, error } = await db.from('ops_projects').insert({ name, color: color || 'gray' }).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    // PATCH /api/admin/operations/tasks/projects/:id - Update a project
    const projectPatchMatch = path.match(/^\/api\/admin\/operations\/tasks\/projects\/([^/]+)$/);
    if (projectPatchMatch && req.method === 'PATCH') {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });

      const projectId = projectPatchMatch[1];
      const { name, color } = req.body || {};

      const { data: existing } = await db.from('ops_projects').select('name').eq('id', projectId).single();

      const updates = {};
      if (name) updates.name = name;
      if (color) updates.color = color;

      const { data, error } = await db.from('ops_projects').update(updates).eq('id', projectId).select().single();
      if (error) throw error;

      if (name && existing && existing.name !== name) {
        await db.from('ops_tasks').update({ project: name, updated_at: new Date().toISOString() }).eq('project', existing.name);
      }

      return res.json(data);
    }

    // DELETE /api/admin/operations/tasks/projects/:id - Delete a project
    const projectDeleteMatch = path.match(/^\/api\/admin\/operations\/tasks\/projects\/([^/]+)$/);
    if (projectDeleteMatch && req.method === 'DELETE') {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });

      const projectId = projectDeleteMatch[1];

      const { data: existing } = await db.from('ops_projects').select('name').eq('id', projectId).single();
      if (existing) {
        await db.from('ops_tasks').update({ project: null, updated_at: new Date().toISOString() }).eq('project', existing.name);
      }

      const { error } = await db.from('ops_projects').delete().eq('id', projectId);
      if (error) throw error;
      return res.json({ success: true });
    }

    // GET /api/admin/operations/tasks - List all tasks
    if (path === '/api/admin/operations/tasks' && req.method === 'GET') {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });

      const assignee = url.searchParams.get('assignee');
      const project = url.searchParams.get('project');
      const status = url.searchParams.get('status');

      let query = db.from('ops_tasks').select('*').order('position', { ascending: true }).order('created_at', { ascending: false });
      if (assignee) query = query.eq('assignee', assignee);
      if (project) query = query.eq('project', project);
      if (status) query = query.eq('status', status);

      const { data, error } = await query;
      if (error) throw error;
      return res.json(data || []);
    }

    // POST /api/admin/operations/tasks - Create a task
    if (path === '/api/admin/operations/tasks' && req.method === 'POST') {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });

      const { title, description, status, assignee, project, priority, due_date } = req.body || {};
      if (!title) return res.status(400).json({ message: 'Title is required' });

      const { data: maxPos } = await db.from('ops_tasks').select('position').eq('status', status || 'todo').order('position', { ascending: false }).limit(1);
      const nextPosition = (maxPos && maxPos.length > 0) ? maxPos[0].position + 1 : 0;

      const { data, error } = await db.from('ops_tasks').insert({
        title,
        description: description || null,
        status: status || 'todo',
        assignee: assignee || null,
        project: project || null,
        priority: priority || 'medium',
        due_date: due_date || null,
        position: nextPosition,
        created_by: admin.email || 'system',
      }).select().single();

      if (error) throw error;
      return res.status(201).json(data);
    }

    // PATCH /api/admin/operations/tasks/:id/move - Move a task
    const taskMoveMatch = path.match(/^\/api\/admin\/operations\/tasks\/([^/]+)\/move$/);
    if (taskMoveMatch && req.method === 'PATCH') {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });

      const taskId = taskMoveMatch[1];
      const { status, position } = req.body || {};

      const STATUSES = ['todo', 'in_progress', 'done'];
      if (!status || !STATUSES.includes(status)) {
        return res.status(400).json({ message: 'Valid status is required' });
      }

      const { data, error } = await db.from('ops_tasks').update({
        status,
        position: position ?? 0,
        updated_at: new Date().toISOString(),
      }).eq('id', taskId).select().single();

      if (error) throw error;
      return res.json(data);
    }

    // PATCH /api/admin/operations/tasks/:id - Update a task
    const taskPatchMatch = path.match(/^\/api\/admin\/operations\/tasks\/([^/]+)$/);
    if (taskPatchMatch && req.method === 'PATCH') {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });

      const taskId = taskPatchMatch[1];
      const updates = { updated_at: new Date().toISOString() };
      const allowedFields = ['title', 'description', 'status', 'assignee', 'project', 'priority', 'due_date', 'position'];
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) updates[field] = req.body[field];
      }

      const { data, error } = await db.from('ops_tasks').update(updates).eq('id', taskId).select().single();
      if (error) throw error;
      return res.json(data);
    }

    // DELETE /api/admin/operations/tasks/:id - Delete a task
    const taskDeleteMatch = path.match(/^\/api\/admin\/operations\/tasks\/([^/]+)$/);
    if (taskDeleteMatch && req.method === 'DELETE') {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });

      const taskId = taskDeleteMatch[1];
      const { error } = await db.from('ops_tasks').delete().eq('id', taskId);
      if (error) throw error;
      return res.json({ success: true });
    }

    // ============ OPERATIONS SETTINGS ENDPOINTS ============

    // GET /api/admin/operations/settings/work-order-notifications
    if (path === '/api/admin/operations/settings/work-order-notifications' && req.method === 'GET') {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });

      const { data, error } = await db.from('ops_work_order_notification_recipients').select('*').order('created_at', { ascending: true });
      if (error) throw error;
      return res.json(data || []);
    }

    // POST /api/admin/operations/settings/work-order-notifications
    if (path === '/api/admin/operations/settings/work-order-notifications' && req.method === 'POST') {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });

      const { name, email, phone, notify_by_email, notify_by_phone } = req.body || {};
      if (!name || !name.trim()) return res.status(400).json({ message: 'Name is required' });
      if (!email || !email.trim()) return res.status(400).json({ message: 'Email is required' });

      const hasPhone = phone != null && String(phone).trim() !== '';
      const { data, error } = await db.from('ops_work_order_notification_recipients').insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: hasPhone ? String(phone).trim() : null,
        notify_by_email: notify_by_email !== false,
        notify_by_phone: hasPhone && notify_by_phone === true,
      }).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    // PATCH /api/admin/operations/settings/work-order-notifications/:id
    const notifPatchMatch = path.match(/^\/api\/admin\/operations\/settings\/work-order-notifications\/(\d+)$/);
    if (notifPatchMatch && req.method === 'PATCH') {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });

      const nId = parseInt(notifPatchMatch[1], 10);
      const { name, email, phone, notify_by_email, notify_by_phone } = req.body || {};
      const updates = {};
      if (name !== undefined) updates.name = name.trim();
      if (email !== undefined) updates.email = email.trim().toLowerCase();
      if (phone !== undefined) updates.phone = phone != null && String(phone).trim() !== '' ? String(phone).trim() : null;
      if (typeof notify_by_email === 'boolean') updates.notify_by_email = notify_by_email;
      if (typeof notify_by_phone === 'boolean') updates.notify_by_phone = notify_by_phone;

      const { data, error } = await db.from('ops_work_order_notification_recipients').update(updates).eq('id', nId).select().single();
      if (error) throw error;
      return res.json(data);
    }

    // DELETE /api/admin/operations/settings/work-order-notifications/:id
    const notifDeleteMatch = path.match(/^\/api\/admin\/operations\/settings\/work-order-notifications\/(\d+)$/);
    if (notifDeleteMatch && req.method === 'DELETE') {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });

      const nId = parseInt(notifDeleteMatch[1], 10);
      const { error } = await db.from('ops_work_order_notification_recipients').delete().eq('id', nId);
      if (error) throw error;
      return res.json({ success: true });
    }

    // ============ SCHEDULED LOADS (Logistics Calendar) ENDPOINTS ============

    // GET /api/admin/operations/scheduled-loads
    if (path === '/api/admin/operations/scheduled-loads' && req.method === 'GET') {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });

      const weekStart = url.searchParams.get('weekStart');
      const weekEnd = url.searchParams.get('weekEnd');

      let query = db.from('scheduled_loads').select('*').order('date', { ascending: true });
      if (weekStart) query = query.gte('date', weekStart);
      if (weekEnd) query = query.lte('date', weekEnd);

      const { data, error } = await query;
      if (error) throw error;
      return res.json(data || []);
    }

    // POST /api/admin/operations/scheduled-loads
    if (path === '/api/admin/operations/scheduled-loads' && req.method === 'POST') {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });

      const { date, timeSlot, routeType, customer, destination, material, quantity, driver, carrierName, truckNumber, status, deal, contactName, contactPhone, notes } = req.body || {};
      if (!date || !routeType || !customer || !destination || !material) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const { data, error } = await db.from('scheduled_loads').insert({
        date, time_slot: timeSlot, route_type: routeType, customer, destination, material, quantity, driver,
        carrier_name: carrierName, truck_number: truckNumber, status: status || 'scheduled',
        deal, contact_name: contactName, contact_phone: contactPhone, notes,
        created_by: admin.email || 'admin@ssw.com',
      }).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    // GET /api/admin/operations/scheduled-loads/:id
    const loadDetailMatch = path.match(/^\/api\/admin\/operations\/scheduled-loads\/(\d+)$/);
    if (loadDetailMatch && req.method === 'GET') {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });

      const { data, error } = await db.from('scheduled_loads').select('*').eq('id', loadDetailMatch[1]).single();
      if (error) throw error;
      if (!data) return res.status(404).json({ message: 'Scheduled load not found' });
      return res.json(data);
    }

    // PATCH /api/admin/operations/scheduled-loads/:id
    if (loadDetailMatch && req.method === 'PATCH') {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });

      const fieldMap = { date: 'date', timeSlot: 'time_slot', routeType: 'route_type', customer: 'customer', destination: 'destination', material: 'material', quantity: 'quantity', driver: 'driver', carrierName: 'carrier_name', truckNumber: 'truck_number', status: 'status', deal: 'deal', contactName: 'contact_name', contactPhone: 'contact_phone', notes: 'notes' };
      const updates = { updated_at: new Date().toISOString() };
      for (const [key, value] of Object.entries(req.body || {})) {
        if (fieldMap[key]) updates[fieldMap[key]] = value;
      }

      const { data, error } = await db.from('scheduled_loads').update(updates).eq('id', loadDetailMatch[1]).select().single();
      if (error) throw error;
      return res.json(data);
    }

    // DELETE /api/admin/operations/scheduled-loads/:id
    if (loadDetailMatch && req.method === 'DELETE') {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });

      const { error } = await db.from('scheduled_loads').delete().eq('id', loadDetailMatch[1]);
      if (error) throw error;
      return res.json({ success: true });
    }

    // POST /api/admin/operations/scheduled-loads/bulk-delete
    if (path === '/api/admin/operations/scheduled-loads/bulk-delete' && req.method === 'POST') {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });

      const { ids } = req.body || {};
      if (!ids || !Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: 'No IDs provided' });

      const { error } = await db.from('scheduled_loads').delete().in('id', ids);
      if (error) throw error;
      return res.json({ success: true, deleted: ids.length });
    }

    // ============ UNSUBSCRIBE ENDPOINTS ============

    // Airtable configuration for Email Marketing 2026
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || "";
    const AIRTABLE_EMAIL_BASE_ID = "appBLlRW7MOx0qdlu";
    const AIRTABLE_EMAIL_TABLE_ID = "tblmofFGmkN2dZ4GB";

    // POST /api/unsubscribe - Unsubscribe an email
    if (path === '/api/unsubscribe' && req.method === 'POST') {
      const { email, reason } = req.body || {};

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const normalizedEmail = email.toLowerCase().trim();
      console.log('[Unsubscribe] Processing request for:', normalizedEmail);

      // Find the contact in Airtable
      const searchUrl = `https://api.airtable.com/v0/${AIRTABLE_EMAIL_BASE_ID}/${AIRTABLE_EMAIL_TABLE_ID}?filterByFormula=LOWER({Email})="${normalizedEmail}"&maxRecords=1`;

      const searchResponse = await fetch(searchUrl, {
        headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
      });

      if (!searchResponse.ok) {
        console.error('[Unsubscribe] Airtable search failed:', await searchResponse.text());
        return res.status(500).json({ error: 'Database error' });
      }

      const searchData = await searchResponse.json();
      const records = searchData.records || [];

      if (records.length === 0) {
        // Email not found - still return success (don't reveal if email exists)
        console.log('[Unsubscribe] Email not found in database:', normalizedEmail);
        return res.json({ success: true, message: 'Unsubscribed successfully' });
      }

      const recordId = records[0].id;

      // Update the contact - mark as unsubscribed
      const updateUrl = `https://api.airtable.com/v0/${AIRTABLE_EMAIL_BASE_ID}/${AIRTABLE_EMAIL_TABLE_ID}/${recordId}`;

      const updateFields = {
        Subscribed: false,
        "Unsubscribed Date": new Date().toISOString().split("T")[0],
      };

      // Add unsubscribe reason to Notes if provided
      if (reason && reason.trim()) {
        const existingNotes = records[0].fields?.Notes || "";
        const timestamp = new Date().toISOString();
        updateFields.Notes = `${existingNotes}\n\n[Unsubscribed ${timestamp}]\nReason: ${reason.trim()}`.trim();
      }

      const updateResponse = await fetch(updateUrl, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fields: updateFields }),
      });

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        console.error('[Unsubscribe] Airtable update failed:', errorText);

        // If Subscribed field doesn't exist, try without it
        if (errorText.includes("UNKNOWN_FIELD_NAME")) {
          console.log('[Unsubscribe] Retrying without Subscribed field...');
          const retryFields = {
            "Unsubscribed Date": new Date().toISOString().split("T")[0],
          };
          if (reason && reason.trim()) {
            const existingNotes = records[0].fields?.Notes || "";
            const timestamp = new Date().toISOString();
            retryFields.Notes = `${existingNotes}\n\n[Unsubscribed ${timestamp}]\nReason: ${reason.trim()}`.trim();
          }

          const retryResponse = await fetch(updateUrl, {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${AIRTABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ fields: retryFields }),
          });

          if (!retryResponse.ok) {
            console.error('[Unsubscribe] Retry also failed:', await retryResponse.text());
            return res.status(500).json({ error: 'Failed to update subscription status' });
          }
        } else {
          return res.status(500).json({ error: 'Failed to update subscription status' });
        }
      }

      console.log('[Unsubscribe] Successfully unsubscribed:', normalizedEmail);
      return res.json({ success: true, message: 'Unsubscribed successfully' });
    }

    // GET /api/unsubscribe/status/:email - Check subscription status
    const unsubStatusMatch = path.match(/^\/api\/unsubscribe\/status\/(.+)$/);
    if (unsubStatusMatch && req.method === 'GET') {
      const email = decodeURIComponent(unsubStatusMatch[1]).toLowerCase().trim();

      const searchUrl = `https://api.airtable.com/v0/${AIRTABLE_EMAIL_BASE_ID}/${AIRTABLE_EMAIL_TABLE_ID}?filterByFormula=LOWER({Email})="${email}"&maxRecords=1`;

      const response = await fetch(searchUrl, {
        headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
      });

      if (!response.ok) {
        return res.status(500).json({ error: 'Database error' });
      }

      const data = await response.json();
      const records = data.records || [];

      if (records.length === 0) {
        return res.json({ found: false });
      }

      const record = records[0];
      return res.json({
        found: true,
        subscribed: record.fields?.Subscribed !== false,
        unsubscribedDate: record.fields?.["Unsubscribed Date"] || null,
      });
    }

    // ============ CUSTOMER AUTH ENDPOINTS ============

    // Customer signup
    if (path === '/api/auth/signup' && req.method === 'POST') {
      const { email, password, fullName, phone, companyName, accountType = 'retail' } = req.body || {};

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }
      if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
      }
      if (!['retail', 'wholesale', 'commercial'].includes(accountType)) {
        return res.status(400).json({ error: 'Invalid account type' });
      }

      const sb = await getSupabase();

      // Create user in Supabase Auth
      const { data: authData, error: authError } = await sb.auth.admin.createUser({
        email,
        password,
        email_confirm: false,
      });

      if (authError) {
        console.error('Signup error:', authError);
        return res.status(400).json({ error: authError.message });
      }

      // Update customer profile with additional data
      const { error: profileError } = await sb
        .from('customer_profiles')
        .update({
          full_name: fullName || null,
          phone: phone || null,
          company_name: companyName || null,
          account_type: accountType,
          is_approved: true,
        })
        .eq('id', authData.user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
      }

      // Generate email verification token
      const crypto = await import('crypto');
      const verificationToken = crypto.randomBytes(32).toString('hex');
      await sb.from('email_verification_tokens').insert({
        email,
        token: verificationToken,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });

      // Send verification email
      try {
        const r = await getResend();
        const baseUrl = 'https://www.organicsoilwholesale.com';
        const verificationUrl = `${baseUrl}/verify-email/${verificationToken}`;
        await r.emails.send({
          from: 'Organic Soil Wholesale <info@soilseedandwater.com>',
          replyTo: 'ralvarez@soilseedandwater.com',
          to: email,
          subject: 'Verify your email for Organic Soil Wholesale',
          html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px"><div style="background-color:#2c5530;color:white;padding:20px;text-align:center"><h1>Organic Soil Wholesale</h1></div><div style="padding:30px;background-color:#f9f9f9"><h2>Verify Your Email Address</h2><p>Thank you for creating an account!</p><p>Please click the button below to verify your email address:</p><center><a href="${verificationUrl}" style="display:inline-block;padding:12px 30px;background-color:#2c5530;color:white;text-decoration:none;border-radius:5px;margin:20px 0">Verify Email</a></center><p>This link will expire in 24 hours.</p></div><div style="text-align:center;padding:20px;color:#666;font-size:14px"><p>Organic Soil Wholesale &bull; 1634 N 19th Ave, Phoenix, AZ 85009 &bull; (602) 637-0032</p></div></div>`,
        });
      } catch (emailErr) {
        console.error('Failed to send verification email:', emailErr);
      }

      // Notify Rodo of new signup
      try {
        const r = await getResend();
        await r.emails.send({
          from: 'Organic Soil Wholesale <info@soilseedandwater.com>',
          replyTo: 'ralvarez@soilseedandwater.com',
          to: 'ralvarez@soilseedandwater.com',
          subject: `New ${accountType} signup: ${fullName || email}`,
          html: `<p><strong>New account signup on organicsoilwholesale.com</strong></p><ul><li><strong>Name:</strong> ${fullName || 'N/A'}</li><li><strong>Email:</strong> ${email}</li><li><strong>Phone:</strong> ${phone || 'N/A'}</li><li><strong>Company:</strong> ${companyName || 'N/A'}</li><li><strong>Type:</strong> ${accountType}</li><li><strong>Auto-approved:</strong> Yes (portal access granted)</li></ul>`,
        });
      } catch (notifyErr) {
        console.error('Failed to send signup notification:', notifyErr);
      }

      return res.json({
        success: true,
        message: 'Account created successfully. Please check your email to verify your account.',
        requiresApproval: false,
      });
    }

    // Customer signin
    if (path === '/api/auth/signin' && req.method === 'POST') {
      const { email, password } = req.body || {};

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Use a separate client for signin to avoid polluting the shared service role client
      const { createClient } = await import('@supabase/supabase-js');
      const signinClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
      const { data: authData, error: authError } = await signinClient.auth.signInWithPassword({ email, password });

      if (authError) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Use the main service role client for admin queries (not polluted by signIn)
      const sb = await getSupabase();
      const { data: profile } = await sb.from('customer_profiles').select('*').eq('id', authData.user.id).single();

      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      // All accounts can sign in now — portal handles gating

      // Log activity
      await sb.from('customer_activity_log').insert({
        customer_id: authData.user.id,
        action: 'signin',
        ip_address: req.headers['x-forwarded-for'] || req.ip,
        user_agent: req.headers['user-agent'],
      });

      return res.json({
        token: authData.session.access_token,
        user: { id: authData.user.id, email: authData.user.email, profile },
      });
    }

    // Customer session check
    if (path === '/api/auth/session' && req.method === 'GET') {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) return res.status(401).json({ error: 'No token provided' });

      const sb = await getSupabase();
      const { data: { user }, error } = await sb.auth.getUser(token);

      if (error || !user) return res.status(401).json({ error: 'Invalid session' });

      const { data: profile } = await sb.from('customer_profiles').select('*').eq('id', user.id).single();

      return res.json({ user: { id: user.id, email: user.email, profile } });
    }

    // Customer signout
    if (path === '/api/auth/signout' && req.method === 'POST') {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (token) {
        const sb = await getSupabase();
        await sb.auth.admin.signOut(token);
      }
      return res.json({ success: true });
    }

    // Email verification
    const verifyMatch = path.match(/^\/api\/auth\/verify-email\/(.+)$/);
    if (verifyMatch && req.method === 'POST') {
      const verifyToken = verifyMatch[1];
      const sb = await getSupabase();

      const { data: tokenData, error: tokenError } = await sb
        .from('email_verification_tokens')
        .select('*')
        .eq('token', verifyToken)
        .eq('verified', false)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (tokenError || !tokenData) {
        return res.status(400).json({ error: 'Invalid or expired verification token' });
      }

      const { data: users } = await sb.auth.admin.listUsers();
      const user = users.users.find(u => u.email === tokenData.email);

      if (!user) return res.status(404).json({ error: 'User not found' });

      await sb.auth.admin.updateUserById(user.id, { email_confirm: true });
      await sb.from('email_verification_tokens').update({ verified: true }).eq('id', tokenData.id);

      return res.json({ success: true, message: 'Email verified successfully' });
    }

    // ========== CUSTOMER PORTAL ENDPOINTS ==========

    // Helper: get customer from bearer token
    async function getCustomerFromToken(req) {
      const tkn = req.headers.authorization?.replace('Bearer ', '');
      if (!tkn) return null;
      const sb = await getSupabase();
      const { data: { user }, error } = await sb.auth.getUser(tkn);
      if (error || !user) return null;
      const { data: profile } = await sb.from('customer_profiles').select('*').eq('id', user.id).single();
      if (!profile) return null;
      return { id: user.id, email: user.email, profile };
    }

    // GET /api/portal/profile
    if (path === '/api/portal/profile' && req.method === 'GET') {
      const customer = await getCustomerFromToken(req);
      if (!customer) return res.status(401).json({ error: 'Unauthorized' });
      return res.json({ profile: customer.profile });
    }

    // GET /api/portal/application
    if (path === '/api/portal/application' && req.method === 'GET') {
      const customer = await getCustomerFromToken(req);
      if (!customer) return res.status(401).json({ error: 'Unauthorized' });

      const sb = await getSupabase();
      const { data: app } = await sb.from('customer_applications').select('*').eq('customer_id', customer.id).single();

      if (!app) {
        return res.json({ application: { status: 'none' } });
      }
      return res.json({ application: app });
    }

    // POST /api/portal/application
    if (path === '/api/portal/application' && req.method === 'POST') {
      const customer = await getCustomerFromToken(req);
      if (!customer) return res.status(401).json({ error: 'Unauthorized' });

      const sb = await getSupabase();
      const body = req.body || {};

      // Upsert application
      const appData = {
        customer_id: customer.id,
        legal_entity_name: body.legal_entity_name || null,
        dba_name: body.dba_name || null,
        ein_tax_id: body.ein_tax_id || null,
        business_type: body.business_type || null,
        years_in_business: body.years_in_business || null,
        ops_contact_name: body.ops_contact_name || null,
        ops_contact_title: body.ops_contact_title || null,
        ops_contact_email: body.ops_contact_email || null,
        ops_contact_phone: body.ops_contact_phone || null,
        ap_contact_name: body.ap_contact_name || null,
        ap_contact_title: body.ap_contact_title || null,
        ap_contact_email: body.ap_contact_email || null,
        ap_contact_phone: body.ap_contact_phone || null,
        preferred_payment_method: body.preferred_payment_method || null,
        preferred_payment_terms: body.preferred_payment_terms || null,
        has_forklift: body.has_forklift || false,
        delivery_instructions: body.delivery_instructions || null,
        credit_references: body.credit_references || [],
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: existing } = await sb.from('customer_applications').select('id').eq('customer_id', customer.id).single();

      let result;
      if (existing) {
        const { data, error } = await sb.from('customer_applications').update(appData).eq('customer_id', customer.id).select().single();
        if (error) return res.status(500).json({ error: error.message });
        result = data;
      } else {
        const { data, error } = await sb.from('customer_applications').insert(appData).select().single();
        if (error) return res.status(500).json({ error: error.message });
        result = data;
      }

      // Update profile application_status
      await sb.from('customer_profiles').update({ application_status: 'submitted' }).eq('id', customer.id);

      // Notify Rodo
      try {
        const r = await getResend();
        await r.emails.send({
          from: 'Organic Soil Wholesale <info@soilseedandwater.com>',
          replyTo: 'ralvarez@soilseedandwater.com',
          to: 'ralvarez@soilseedandwater.com',
          subject: `New wholesale application: ${body.legal_entity_name || customer.profile.company_name || customer.email}`,
          html: `<p><strong>New wholesale application submitted</strong></p>
            <ul>
              <li><strong>Business:</strong> ${body.legal_entity_name || 'N/A'} ${body.dba_name ? `(DBA: ${body.dba_name})` : ''}</li>
              <li><strong>Type:</strong> ${body.business_type || 'N/A'}</li>
              <li><strong>Contact:</strong> ${body.ops_contact_name || 'N/A'} - ${body.ops_contact_email || 'N/A'} - ${body.ops_contact_phone || 'N/A'}</li>
              <li><strong>Payment:</strong> ${body.preferred_payment_method || 'N/A'} / ${body.preferred_payment_terms || 'N/A'}</li>
              <li><strong>Forklift:</strong> ${body.has_forklift ? 'Yes' : 'No'}</li>
            </ul>
            <p>Review in the admin panel or reply to approve.</p>`,
        });
      } catch (notifyErr) {
        console.error('Failed to send application notification:', notifyErr);
      }

      return res.json({ success: true, application: result });
    }

    // POST /api/portal/orders — submit order from cart
    if (path === '/api/portal/orders' && req.method === 'POST') {
      const customer = await getCustomerFromToken(req);
      if (!customer) return res.status(401).json({ error: 'Unauthorized' });

      const sb = await getSupabase();
      const body = req.body || {};
      const items = body.items || [];

      if (items.length === 0) {
        return res.status(400).json({ error: 'Order must have at least one item' });
      }

      // Calculate total
      const totalAmount = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);

      // Update SMS opt-in if provided
      if (typeof body.sms_opt_in === 'boolean') {
        await sb.from('customer_profiles').update({ sms_opt_in: body.sms_opt_in }).eq('id', customer.id);
      }

      // Create order
      const { data: order, error: orderError } = await sb.from('orders').insert({
        customer_profile_id: customer.id,
        customer_name: customer.profile.full_name || customer.email,
        customer_email: customer.email,
        business_name: customer.profile.company_name || customer.profile.full_name || customer.email,
        email: customer.email,
        phone: customer.profile.phone || '',
        delivery_type: body.fulfillment_type || 'pickup',
        order_items: JSON.stringify(items.map(i => ({ name: i.product_name, format: i.format, qty: i.quantity, price: i.unit_price }))),
        order_type: body.fulfillment_type === 'delivery' ? 'delivery' : 'pickup',
        status: 'pending',
        total: Math.round(totalAmount),
        subtotal: Math.round(totalAmount),
        fulfillment_type: body.fulfillment_type || 'pickup',
        delivery_address_json: body.delivery_address || null,
        preferred_date: body.preferred_date || null,
        preferred_time_start: body.preferred_time_start || null,
        preferred_time_end: body.preferred_time_end || null,
        special_instructions: body.special_instructions || null,
      }).select().single();

      if (orderError) {
        console.error('Order creation error:', orderError);
        return res.status(500).json({ error: orderError.message });
      }

      // Insert order items (format = product name for display, size_option = pallet format)
      const orderItems = items.map(item => ({
        order_id: order.id,
        quantity: item.quantity,
        size_option: item.format,
        format: item.product_name,
        unit_price: item.unit_price,
        total_price: item.unit_price * item.quantity,
      }));

      const { error: itemsError } = await sb.from('order_items').insert(orderItems);
      if (itemsError) {
        console.error('Order items error:', itemsError);
      }

      // Insert initial status history
      await sb.from('order_status_history').insert({
        order_id: order.id,
        new_status: 'pending',
        notes: 'Order submitted by customer',
      });

      // Notify Rodo
      try {
        const r = await getResend();
        const itemsList = items.map(i => `<li>${i.product_name} - ${i.format} x ${i.quantity} ($${(i.unit_price * i.quantity).toLocaleString()})</li>`).join('');
        await r.emails.send({
          from: 'Organic Soil Wholesale <info@soilseedandwater.com>',
          replyTo: 'ralvarez@soilseedandwater.com',
          to: 'ralvarez@soilseedandwater.com',
          subject: `New wholesale order #${order.order_number} - $${totalAmount.toLocaleString()} - ${customer.profile.company_name || customer.email}`,
          html: `<p><strong>New wholesale order from ${customer.profile.company_name || customer.email}</strong></p>
            <p><strong>Order #${order.order_number}</strong> - $${totalAmount.toLocaleString()}</p>
            <p><strong>${body.fulfillment_type === 'delivery' ? 'Delivery' : 'Pickup'}</strong> on ${body.preferred_date || 'TBD'}</p>
            <ul>${itemsList}</ul>
            ${body.special_instructions ? `<p><strong>Notes:</strong> ${body.special_instructions}</p>` : ''}`,
        });
      } catch (notifyErr) {
        console.error('Failed to send order notification:', notifyErr);
      }

      return res.json({ success: true, order });
    }

    // GET /api/portal/orders — list customer orders
    if (path === '/api/portal/orders' && req.method === 'GET') {
      const customer = await getCustomerFromToken(req);
      if (!customer) return res.status(401).json({ error: 'Unauthorized' });

      const sb = await getSupabase();
      const limit = parseInt(req.query?.limit) || 50;

      const { data: orders, error } = await sb
        .from('orders')
        .select('id, order_number, status, total, created_at, fulfillment_type')
        .eq('customer_profile_id', customer.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) return res.status(500).json({ error: error.message });

      // Get item counts
      const orderIds = (orders || []).map(o => o.id);
      let itemCounts = {};
      if (orderIds.length > 0) {
        const { data: items } = await sb
          .from('order_items')
          .select('order_id')
          .in('order_id', orderIds);
        if (items) {
          items.forEach(i => { itemCounts[i.order_id] = (itemCounts[i.order_id] || 0) + 1; });
        }
      }

      const enriched = (orders || []).map(o => ({
        ...o,
        item_count: itemCounts[o.id] || 0,
      }));

      return res.json({ orders: enriched });
    }

    // GET /api/portal/orders/:id — order detail
    const portalOrderMatch = path.match(/^\/api\/portal\/orders\/([a-f0-9-]+)$/);
    if (portalOrderMatch && req.method === 'GET') {
      const customer = await getCustomerFromToken(req);
      if (!customer) return res.status(401).json({ error: 'Unauthorized' });

      const orderId = portalOrderMatch[1];
      const sb = await getSupabase();

      const { data: order, error } = await sb
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .eq('customer_profile_id', customer.id)
        .single();

      if (error || !order) return res.status(404).json({ error: 'Order not found' });

      // Get items
      const { data: items } = await sb
        .from('order_items')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      // Get status history
      const { data: history } = await sb
        .from('order_status_history')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      return res.json({
        order: {
          ...order,
          delivery_address: order.delivery_address_json,
          items: items || [],
          status_history: history || [],
        },
      });
    }

    // ========== ADMIN: CUSTOMERS ==========

    // GET /api/admin/customers
    if (path === '/api/admin/customers' && req.method === 'GET') {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });
      const sb = await getSupabase();
      const { data, error } = await sb.from('customer_profiles').select('*').order('created_at', { ascending: false });
      if (error) return res.status(500).json({ error: error.message });
      return res.json(data || []);
    }

    // GET /api/admin/customers/:id
    const adminCustMatch = path.match(/^\/api\/admin\/customers\/([a-f0-9-]+)$/);
    if (adminCustMatch && req.method === 'GET') {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });
      const sb = await getSupabase();
      const custId = adminCustMatch[1];
      const { data: profile } = await sb.from('customer_profiles').select('*').eq('id', custId).single();
      if (!profile) return res.status(404).json({ error: 'Customer not found' });
      const { data: application } = await sb.from('customer_applications').select('*').eq('customer_id', custId).single();
      const { data: orders } = await sb.from('orders').select('id, order_number, status, total, created_at, fulfillment_type').eq('customer_profile_id', custId).order('created_at', { ascending: false });
      return res.json({ profile, application, orders: orders || [] });
    }

    // ========== ADMIN: APPLICATIONS ==========

    // GET /api/admin/applications
    if (path === '/api/admin/applications' && req.method === 'GET') {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });
      const sb = await getSupabase();
      const { data, error } = await sb.from('customer_applications').select('*, customer_profiles!customer_applications_customer_id_fkey(full_name, email, company_name, phone, account_type)').order('submitted_at', { ascending: false });
      if (error) {
        // Fallback without join
        const { data: apps } = await sb.from('customer_applications').select('*').order('submitted_at', { ascending: false });
        return res.json(apps || []);
      }
      return res.json(data || []);
    }

    // POST /api/admin/applications/:id/approve
    const approveMatch = path.match(/^\/api\/admin\/applications\/([a-f0-9-]+)\/approve$/);
    if (approveMatch && req.method === 'POST') {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });
      const sb = await getSupabase();
      const appId = approveMatch[1];
      const { data: app } = await sb.from('customer_applications').select('customer_id').eq('id', appId).single();
      if (!app) return res.status(404).json({ error: 'Application not found' });
      const body = req.body || {};
      await sb.from('customer_applications').update({ status: 'approved', reviewed_at: new Date().toISOString(), notes: body.notes || null }).eq('id', appId);
      // Update profile fields individually to avoid Supabase partial update issues
      await sb.from('customer_profiles').update({ is_approved: true, approved_at: new Date().toISOString() }).eq('id', app.customer_id);
      await sb.from('customer_profiles').update({ application_status: 'approved' }).eq('id', app.customer_id);
      if (body.credit_limit) await sb.from('customer_profiles').update({ credit_limit: body.credit_limit }).eq('id', app.customer_id);
      if (body.payment_terms) await sb.from('customer_profiles').update({ payment_terms: body.payment_terms }).eq('id', app.customer_id);
      return res.json({ success: true });
    }

    // POST /api/admin/applications/:id/reject
    const rejectMatch = path.match(/^\/api\/admin\/applications\/([a-f0-9-]+)\/reject$/);
    if (rejectMatch && req.method === 'POST') {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });
      const sb = await getSupabase();
      const appId = rejectMatch[1];
      const { data: app } = await sb.from('customer_applications').select('customer_id').eq('id', appId).single();
      if (!app) return res.status(404).json({ error: 'Application not found' });
      const body = req.body || {};
      await sb.from('customer_applications').update({ status: 'rejected', reviewed_at: new Date().toISOString(), notes: body.reason || null }).eq('id', appId);
      await sb.from('customer_profiles').update({ application_status: 'rejected' }).eq('id', app.customer_id);
      return res.json({ success: true });
    }

    // ========== ADMIN: ORDERS ==========

    // GET /api/admin/orders
    if (path === '/api/admin/orders' && req.method === 'GET') {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });
      const sb = await getSupabase();
      const status = req.query?.status;
      let query = sb.from('orders').select('*').order('created_at', { ascending: false }).limit(100);
      if (status && status !== 'all') query = query.eq('status', status);
      const { data, error } = await query;
      if (error) return res.status(500).json({ error: error.message });
      return res.json(data || []);
    }

    // GET /api/admin/orders/:id
    const adminOrderMatch = path.match(/^\/api\/admin\/orders\/(\d+)$/);
    if (adminOrderMatch && req.method === 'GET') {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });
      const sb = await getSupabase();
      const orderId = parseInt(adminOrderMatch[1]);
      const { data: order } = await sb.from('orders').select('*').eq('id', orderId).single();
      if (!order) return res.status(404).json({ error: 'Order not found' });
      const { data: items } = await sb.from('order_items').select('*').eq('order_id', orderId);
      const { data: history } = await sb.from('order_status_history').select('*').eq('order_id', orderId).order('created_at', { ascending: false });
      return res.json({ ...order, items: items || [], status_history: history || [] });
    }

    // POST /api/admin/orders/:id/status — update order status
    const adminOrderStatusMatch = path.match(/^\/api\/admin\/orders\/(\d+)\/status$/);
    if (adminOrderStatusMatch && req.method === 'POST') {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });
      const sb = await getSupabase();
      const orderId = parseInt(adminOrderStatusMatch[1]);
      const body = req.body || {};
      if (!body.status) return res.status(400).json({ error: 'Status required' });
      const { data: order } = await sb.from('orders').select('*').eq('id', orderId).single();
      if (!order) return res.status(404).json({ error: 'Order not found' });
      await sb.from('orders').update({ status: body.status, updated_at: new Date().toISOString() }).eq('id', orderId);
      await sb.from('order_status_history').insert({ order_id: orderId, old_status: order.status, new_status: body.status, notes: body.notes || null });

      // Auto-send customer notification for key status changes (fire and forget)
      const notifyStatuses = ['approved', 'ready_for_pickup', 'out_for_delivery', 'completed'];
      let notificationSent = false;
      if (notifyStatuses.includes(body.status) && body.notify !== false) {
        const customerEmail = order.customer_email || order.email;
        if (customerEmail) {
          const orderRef = order.order_number?.slice(0, 8) || order.id;
          const statusMessages = {
            approved: { subject: `Order #${orderRef} Approved`, body: `Great news! Your order #${orderRef} has been approved and is being prepared.` },
            ready_for_pickup: { subject: `Order #${orderRef} Ready for Pickup`, body: `Your order #${orderRef} is ready for pickup at 1634 N 19th Ave, Phoenix, AZ 85009. Mon-Fri, 7:00 AM - 2:00 PM.` },
            out_for_delivery: { subject: `Order #${orderRef} Out for Delivery`, body: `Your order #${orderRef} is on its way! Call (602) 637-0032 with questions.` },
            completed: { subject: `Order #${orderRef} Completed`, body: `Your order #${orderRef} has been completed. Thank you for your business!` },
          };
          const msg = statusMessages[body.status];
          if (msg) {
            try {
              const r = await getResend();
              await r.emails.send({
                from: 'Organic Soil Wholesale <info@soilseedandwater.com>',
                replyTo: 'ralvarez@soilseedandwater.com',
                to: customerEmail,
                subject: msg.subject,
                html: `<p>Hi ${order.customer_name || 'there'},</p><p>${msg.body}</p><p>Thanks,<br>Rodo Alvarez<br>Soil Seed & Water</p>`,
              });
              notificationSent = true;
            } catch (notifyErr) {
              console.error('Auto-notify email failed:', notifyErr);
            }
          }
        }
      }

      return res.json({ success: true, notification_sent: notificationSent });
    }

    // ========== ADMIN: LEADS ==========

    // GET /api/admin/leads
    if (path === '/api/admin/leads' && req.method === 'GET') {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });
      const sb = await getSupabase();
      const { data, error } = await sb.from('contact_messages').select('*').order('created_at', { ascending: false }).limit(100);
      if (error) return res.status(500).json({ error: error.message });
      return res.json(data || []);
    }

    // ========== PUBLIC: LEAD SUBMISSION (Vercel production) ==========

    // POST /api/leads/submit
    if (path === '/api/leads/submit' && req.method === 'POST') {
      const { name, email, phone, notes, preferred_date } = req.body || {};
      if (!name || !email || !phone) return res.status(400).json({ error: 'Name, email, and phone are required' });
      const sb = await getSupabase();
      const insertData = {
        name, email, subject: 'Lead Form Submission',
        message: `Phone: ${phone}\n\nNotes: ${notes || 'No additional notes'}`,
        created_at: new Date().toISOString(),
      };
      if (preferred_date) insertData.preferred_date = preferred_date;
      const { data, error } = await sb.from('contact_messages').insert(insertData).select().single();
      if (error) return res.status(500).json({ error: error.message });
      // Notify Rodo
      try {
        const r = await getResend();
        await r.emails.send({
          from: 'Organic Soil Wholesale <info@soilseedandwater.com>',
          replyTo: 'ralvarez@soilseedandwater.com',
          to: 'ralvarez@soilseedandwater.com',
          subject: `New quote request from ${name}`,
          html: `<p><strong>New lead from the website</strong></p><ul><li><strong>Name:</strong> ${name}</li><li><strong>Email:</strong> ${email}</li><li><strong>Phone:</strong> ${phone}</li>${preferred_date ? `<li><strong>Preferred Date:</strong> ${preferred_date}</li>` : ''}<li><strong>Notes:</strong> ${notes || 'None'}</li></ul>`,
        });
      } catch (e) { console.error('Lead notification error:', e); }
      return res.json({ success: true, message: 'Quote request submitted successfully', leadId: data.id });
    }

    // ========== SCHEDULING ENDPOINTS ==========

    // POST /api/portal/scheduling/available-dates — returns earliest pickup date based on cart items
    if (path === '/api/portal/scheduling/available-dates' && req.method === 'POST') {
      const sb = await getSupabase();
      const body = req.body || {};
      const productSlugs = body.product_slugs || [];

      // Get product availability info
      let products = [];
      if (productSlugs.length > 0) {
        const { data } = await sb.from('products').select('slug, name, pickup_lead_days, is_yard_available').in('slug', productSlugs);
        products = data || [];
      }

      // Calculate earliest date
      const maxLeadDays = products.length > 0
        ? Math.max(...products.map(p => p.pickup_lead_days || 7))
        : 7;

      const hasYardItems = products.some(p => p.is_yard_available);
      const allYardAvailable = products.length > 0 && products.every(p => p.is_yard_available);

      // Calculate earliest business day
      const now = new Date();
      const cutoffHour = 14; // 2 PM MST cutoff
      const mstHour = now.getUTCHours() - 7; // MST = UTC-7

      let leadDays = maxLeadDays;
      // If all items are yard-available and it's before cutoff, next business day
      if (allYardAvailable && mstHour < cutoffHour) {
        leadDays = 1;
      }

      const earliest = new Date(now);
      earliest.setDate(earliest.getDate() + leadDays);
      // Skip weekends
      while (earliest.getDay() === 0 || earliest.getDay() === 6) {
        earliest.setDate(earliest.getDate() + 1);
      }

      // Generate available dates for the next 30 days (weekdays only)
      const dates = [];
      const d = new Date(earliest);
      for (let i = 0; i < 30; i++) {
        if (d.getDay() !== 0 && d.getDay() !== 6) {
          dates.push(d.toISOString().split('T')[0]);
        }
        d.setDate(d.getDate() + 1);
        if (dates.length >= 20) break;
      }

      const productAvailability = products.map(p => ({
        slug: p.slug,
        name: p.name,
        is_yard_available: p.is_yard_available,
        pickup_lead_days: p.pickup_lead_days,
      }));

      return res.json({
        earliest_date: earliest.toISOString().split('T')[0],
        available_dates: dates,
        max_lead_days: maxLeadDays,
        all_yard_available: allYardAvailable,
        has_yard_items: hasYardItems,
        products: productAvailability,
      });
    }

    // POST /api/portal/scheduling/time-slots — returns 30-min slots for a date
    if (path === '/api/portal/scheduling/time-slots' && req.method === 'POST') {
      const body = req.body || {};
      const date = body.date;

      if (!date) return res.status(400).json({ error: 'Date is required' });

      const d = new Date(date + 'T12:00:00');
      if (d.getDay() === 0 || d.getDay() === 6) {
        return res.json({ slots: [], message: 'No pickup/delivery on weekends' });
      }

      // Mon-Fri 7 AM - 2 PM, 30-min slots
      const slots = [];
      for (let hour = 7; hour < 14; hour++) {
        for (let min = 0; min < 60; min += 30) {
          const h = hour > 12 ? hour - 12 : hour;
          const ampm = hour >= 12 ? 'PM' : 'AM';
          const label = `${h}:${min.toString().padStart(2, '0')} ${ampm}`;
          slots.push({ time: label, available: true });
        }
      }
      // Add 2:00 PM as last slot
      slots.push({ time: '2:00 PM', available: true });

      return res.json({ date, slots });
    }

    // ========== PRODUCT AVAILABILITY (Admin) ==========

    // GET /api/admin/products/availability — list all products with availability info
    if (path === '/api/admin/products/availability' && req.method === 'GET') {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });
      const sb = await getSupabase();
      const { data, error } = await sb.from('products')
        .select('id, name, slug, is_yard_available, pickup_lead_days, product_status')
        .order('name');
      if (error) return res.status(500).json({ error: error.message });
      return res.json(data || []);
    }

    // PATCH /api/admin/products/:id/availability — toggle yard availability and lead days
    const prodAvailMatch = path.match(/^\/api\/admin\/products\/(\d+)\/availability$/);
    if (prodAvailMatch && req.method === 'PATCH') {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });
      const sb = await getSupabase();
      const productId = parseInt(prodAvailMatch[1]);
      const body = req.body || {};
      const updates = {};
      if (typeof body.is_yard_available === 'boolean') updates.is_yard_available = body.is_yard_available;
      if (typeof body.pickup_lead_days === 'number') updates.pickup_lead_days = Math.max(1, Math.min(30, body.pickup_lead_days));
      if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'No valid fields to update' });
      const { data, error } = await sb.from('products').update(updates).eq('id', productId).select('id, name, is_yard_available, pickup_lead_days').single();
      if (error) return res.status(500).json({ error: error.message });
      return res.json(data);
    }

    // ========== STRIPE DEPOSITS ==========

    // POST /api/admin/orders/:id/payment-link — create Stripe Payment Link for deposit
    const paymentLinkMatch = path.match(/^\/api\/admin\/orders\/(\d+)\/payment-link$/);
    if (paymentLinkMatch && req.method === 'POST') {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });

      const sb = await getSupabase();
      const orderId = parseInt(paymentLinkMatch[1]);
      const { data: order } = await sb.from('orders').select('*').eq('id', orderId).single();
      if (!order) return res.status(404).json({ error: 'Order not found' });

      const body = req.body || {};
      // Default: 25% of total, minimum $100
      const depositPct = body.deposit_percent || 25;
      const depositAmount = Math.max(100, Math.round(order.total * depositPct / 100));

      try {
        const Stripe = (await import('stripe')).default;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

        // Create a price for the deposit
        const price = await stripe.prices.create({
          unit_amount: depositAmount * 100, // cents
          currency: 'usd',
          product_data: {
            name: `Order #${order.order_number?.slice(0, 8) || order.id} - Deposit`,
            metadata: { order_id: orderId.toString() },
          },
        });

        // Create payment link
        const paymentLink = await stripe.paymentLinks.create({
          line_items: [{ price: price.id, quantity: 1 }],
          metadata: { order_id: orderId.toString(), type: 'deposit' },
          after_completion: {
            type: 'redirect',
            redirect: { url: `${process.env.VITE_SUPABASE_URL ? 'https://soilseedandwater.com' : 'http://localhost:5173'}/portal/orders/${order.id}?deposit=success` },
          },
        });

        // Update order with payment link info
        await sb.from('orders').update({
          deposit_amount: depositAmount,
          stripe_payment_link_id: paymentLink.id,
          updated_at: new Date().toISOString(),
        }).eq('id', orderId);

        // Send payment link to customer
        const customerEmail = order.customer_email || order.email;
        if (customerEmail) {
          const r = await getResend();
          await r.emails.send({
            from: 'Organic Soil Wholesale <info@soilseedandwater.com>',
          replyTo: 'ralvarez@soilseedandwater.com',
            to: customerEmail,
            subject: `Payment link for Order #${order.order_number?.slice(0, 8) || order.id}`,
            html: `<p>Hi ${order.customer_name || 'there'},</p>
              <p>Your order has been approved! To confirm your order, please pay the deposit of <strong>$${depositAmount.toLocaleString()}</strong>.</p>
              <p><a href="${paymentLink.url}" style="display:inline-block;padding:12px 24px;background:#264027;color:white;text-decoration:none;border-radius:8px;font-weight:bold;">Pay Deposit - $${depositAmount}</a></p>
              <p>Or copy this link: ${paymentLink.url}</p>
              <p>If you prefer to pay in full or have questions, just reply to this email.</p>
              <p>Thanks,<br>Rodo Alvarez<br>Soil Seed & Water</p>`,
          });
        }

        return res.json({ success: true, payment_link: paymentLink.url, deposit_amount: depositAmount });
      } catch (err) {
        console.error('Payment link error:', err);
        return res.status(500).json({ error: err.message || 'Failed to create payment link' });
      }
    }

    // POST /api/webhooks/stripe — handle Stripe webhook for deposit payments
    if (path === '/api/webhooks/stripe' && req.method === 'POST') {
      try {
        const Stripe = (await import('stripe')).default;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        const sb = await getSupabase();

        // Verify webhook signature if secret is configured
        let event = req.body;
        const sig = req.headers['stripe-signature'];
        if (process.env.STRIPE_WEBHOOK_SECRET && sig) {
          try {
            event = stripe.webhooks.constructEvent(
              typeof req.body === 'string' ? req.body : JSON.stringify(req.body),
              sig,
              process.env.STRIPE_WEBHOOK_SECRET
            );
          } catch (err) {
            console.error('Webhook signature verification failed:', err.message);
            return res.status(400).json({ error: 'Invalid signature' });
          }
        }

        if (!event || !event.type) return res.status(400).json({ error: 'Invalid event' });

        if (event.type === 'checkout.session.completed') {
          const session = event.data?.object;
          const orderId = session?.metadata?.order_id;

          if (orderId && session?.metadata?.type === 'deposit') {
            // Mark deposit as paid
            await sb.from('orders').update({
              deposit_paid: true,
              deposit_paid_at: new Date().toISOString(),
              stripe_payment_intent_id: session.payment_intent || null,
              updated_at: new Date().toISOString(),
            }).eq('id', parseInt(orderId));

            // Log status change
            await sb.from('order_status_history').insert({
              order_id: parseInt(orderId),
              old_status: 'pending',
              new_status: 'deposit_paid',
              notes: `Deposit paid via Stripe. Payment Intent: ${session.payment_intent || 'N/A'}`,
            });

            // Notify Rodo via SMS
            try {
              const twilio = (await import('twilio')).default;
              const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
              const { data: order } = await sb.from('orders').select('order_number, customer_name, deposit_amount').eq('id', parseInt(orderId)).single();
              if (order) {
                await twilioClient.messages.create({
                  body: `Deposit paid! Order #${order.order_number?.slice(0, 8)} - $${order.deposit_amount} from ${order.customer_name}`,
                  from: process.env.TWILIO_PHONE_NUMBER,
                  to: process.env.RODO_PHONE,
                });
              }
            } catch (smsErr) {
              console.error('SMS notification error:', smsErr);
            }

            // Send confirmation email to customer
            try {
              const { data: order } = await sb.from('orders').select('*').eq('id', parseInt(orderId)).single();
              if (order) {
                const r = await getResend();
                await r.emails.send({
                  from: 'Organic Soil Wholesale <info@soilseedandwater.com>',
          replyTo: 'ralvarez@soilseedandwater.com',
                  to: order.customer_email || order.email,
                  subject: `Deposit confirmed - Order #${order.order_number?.slice(0, 8) || order.id}`,
                  html: `<p>Hi ${order.customer_name || 'there'},</p>
                    <p>Your deposit of <strong>$${order.deposit_amount}</strong> has been received for Order #${order.order_number?.slice(0, 8) || order.id}.</p>
                    <p>We'll notify you when your order is ready for ${order.fulfillment_type === 'delivery' ? 'delivery' : 'pickup'}.</p>
                    <p>Thanks,<br>Rodo Alvarez<br>Soil Seed & Water</p>`,
                });
              }
            } catch (emailErr) {
              console.error('Deposit confirmation email error:', emailErr);
            }
          }
        }

        return res.json({ received: true });
      } catch (err) {
        console.error('Webhook error:', err);
        return res.status(500).json({ error: 'Webhook processing failed' });
      }
    }

    // ========== ORDER NOTIFICATIONS ==========

    // POST /api/admin/orders/:id/notify — send status change notification to customer
    const notifyMatch = path.match(/^\/api\/admin\/orders\/(\d+)\/notify$/);
    if (notifyMatch && req.method === 'POST') {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });

      const sb = await getSupabase();
      const orderId = parseInt(notifyMatch[1]);
      const { data: order } = await sb.from('orders').select('*').eq('id', orderId).single();
      if (!order) return res.status(404).json({ error: 'Order not found' });

      const customerEmail = order.customer_email || order.email;
      if (!customerEmail) return res.status(400).json({ error: 'No customer email' });

      const status = order.status;
      const orderRef = order.order_number?.slice(0, 8) || order.id;

      const statusMessages = {
        approved: {
          subject: `Order #${orderRef} Approved`,
          html: `<p>Hi ${order.customer_name || 'there'},</p>
            <p>Great news! Your order #${orderRef} has been approved and is being prepared.</p>
            ${order.preferred_date ? `<p><strong>Scheduled for:</strong> ${new Date(order.preferred_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>` : ''}
            <p>We'll notify you when it's ready.</p>
            <p>Thanks,<br>Rodo Alvarez<br>Soil Seed & Water</p>`,
        },
        ready_for_pickup: {
          subject: `Order #${orderRef} Ready for Pickup`,
          html: `<p>Hi ${order.customer_name || 'there'},</p>
            <p>Your order #${orderRef} is ready for pickup!</p>
            <p><strong>Pickup Location:</strong><br>1634 N 19th Ave, Phoenix, AZ 85009<br>Mon-Fri, 7:00 AM - 2:00 PM</p>
            <p>Please bring a valid ID when picking up your order.</p>
            <p>Thanks,<br>Rodo Alvarez<br>Soil Seed & Water</p>`,
        },
        out_for_delivery: {
          subject: `Order #${orderRef} Out for Delivery`,
          html: `<p>Hi ${order.customer_name || 'there'},</p>
            <p>Your order #${orderRef} is on its way! Our driver will arrive at the scheduled time.</p>
            <p>If you need to make any changes, call us at (602) 637-0032.</p>
            <p>Thanks,<br>Rodo Alvarez<br>Soil Seed & Water</p>`,
        },
        completed: {
          subject: `Order #${orderRef} Completed`,
          html: `<p>Hi ${order.customer_name || 'there'},</p>
            <p>Your order #${orderRef} has been completed. Thank you for your business!</p>
            <p>If you have any questions or need to reorder, just reply to this email or visit our website.</p>
            <p>Thanks,<br>Rodo Alvarez<br>Soil Seed & Water</p>`,
        },
      };

      const template = statusMessages[status];
      if (!template) return res.status(400).json({ error: `No notification template for status: ${status}` });

      try {
        const r = await getResend();
        await r.emails.send({
          from: 'Organic Soil Wholesale <info@soilseedandwater.com>',
          replyTo: 'ralvarez@soilseedandwater.com',
          to: customerEmail,
          subject: template.subject,
          html: template.html,
        });

        // Send SMS if opted in
        const { data: profile } = await sb.from('customer_profiles').select('sms_opt_in, phone').eq('id', order.customer_profile_id).single();
        if (profile?.sms_opt_in && profile?.phone) {
          try {
            const twilio = (await import('twilio')).default;
            const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
            const smsMessages = {
              approved: `SSW: Order #${orderRef} approved! We're preparing it now.`,
              ready_for_pickup: `SSW: Order #${orderRef} is ready for pickup at 1634 N 19th Ave, Phoenix. Mon-Fri 7AM-2PM.`,
              out_for_delivery: `SSW: Order #${orderRef} is out for delivery! Call (602) 637-0032 with questions.`,
              completed: `SSW: Order #${orderRef} completed. Thanks for your business!`,
            };
            if (smsMessages[status]) {
              await twilioClient.messages.create({
                body: smsMessages[status],
                from: process.env.TWILIO_PHONE_NUMBER,
                to: profile.phone.startsWith('+') ? profile.phone : `+1${profile.phone.replace(/\D/g, '')}`,
              });
            }
          } catch (smsErr) {
            console.error('SMS notification error:', smsErr);
          }
        }

        return res.json({ success: true, status, email_sent: true });
      } catch (err) {
        console.error('Notification error:', err);
        return res.status(500).json({ error: err.message || 'Failed to send notification' });
      }
    }

    // ========== TRUCKING QUOTE ==========
    // Self-contained delivery price calculator. Picks the right truck from cart
    // contents, looks up round-trip drive time (Haversine fallback when no
    // Google Maps key), and returns a cost honest enough to pay against.

    const OSW_YARDS = {
      phoenix:  { label: 'Phoenix, AZ', lat: 33.4675, lng: -112.1000, zip: '85009' },
      congress: { label: 'Congress, AZ', lat: 34.1608, lng: -112.8515, zip: '85332' },
    };

    const DEFAULT_TRUCK_RATES = {
      walking_floor:   { hourly_rate: 165, min_fee: 400, capacity_label: '24 tons / 90 cu yd per load' },
      flatbed_moffett: { hourly_rate: 150, min_fee: 400, capacity_label: '22 pallets / 22 totes' },
      hot_shot:        { hourly_rate: 95,  min_fee: 175, capacity_label: '4-10 pallets' },
      avg_speed_mph:   55,
      road_factor:     1.30,
      unload_hours:    0.5,
    };

    async function getTruckingRates() {
      try {
        const { data } = await db.from('sp_settings').select('value').eq('key', 'trucking_rates').single();
        if (data?.value) return { ...DEFAULT_TRUCK_RATES, ...data.value };
      } catch (_) { /* settings table missing → defaults */ }
      return DEFAULT_TRUCK_RATES;
    }

    // Loose match: caller may pass an item with sizeOption like "Truckload (22 pallets)"
    // or "9lb Bag" — we need format from the string.
    function inferFormat(rawKey) {
      const k = String(rawKey || '').toLowerCase();
      if (k.includes('truckload') || k.includes('bulk')) return 'bulk';
      if (k === '2-cy' || k.includes('cubic yard') || k.includes('cu yd') || k.includes(' cy ')) return 'bulk';
      if (k.includes('pallet') || k.includes('tote') || k.includes('supersack') || k.includes('super sack')) return 'pallet';
      return 'bag';
    }

    function walkingFloorLoads(items) {
      return Math.max(1, (items || []).reduce((sum, item) => {
        if (inferFormat(item.sizeOption || item.format || '') !== 'bulk') return sum;
        const unit = String(item.unit || item.sizeOption || item.format || '').toLowerCase();
        const quantity = Math.max(1, Number(item.quantity) || 1);
        const capacity = unit.includes('ton') ? 24 : 90;
        return sum + Math.max(1, Math.ceil(quantity / capacity));
      }, 0));
    }

    // Cart items shape: [{ sizeOption, quantity, ... }]
    function pickTruck(items, milesEstimate = 100) {
      const formats = items.map((i) => inferFormat(i.sizeOption || i.format || ''));
      const hasBulk = formats.includes('bulk');
      const palletQty = items.reduce((sum, i, idx) => {
        if (formats[idx] === 'pallet') return sum + (Number(i.quantity) || 1);
        return sum;
      }, 0);

      if (hasBulk && palletQty === 0) {
        return { truck: 'walking_floor', split: null };
      }
      if (hasBulk && palletQty > 0) {
        // Mixed → return the heavier-cost truck (walking_floor) and flag a split.
        // UI will surface a "we'll split into two deliveries" notice.
        return { truck: 'walking_floor', split: 'mixed' };
      }
      if (palletQty <= 4 && milesEstimate < 200) {
        return { truck: 'hot_shot', split: null };
      }
      return { truck: 'flatbed_moffett', split: null };
    }

    function haversineMiles(a, b) {
      const toRad = (d) => (d * Math.PI) / 180;
      const R = 3958.7613; // Earth radius (mi)
      const dLat = toRad(b.lat - a.lat);
      const dLng = toRad(b.lng - a.lng);
      const sa = Math.sin(dLat / 2);
      const sb = Math.sin(dLng / 2);
      const h = sa * sa + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sb * sb;
      return 2 * R * Math.asin(Math.sqrt(h));
    }

    async function geocodeZip(zip) {
      // zippopotam.us is free, no key required, ~50ms typical latency
      const r = await fetch(`https://api.zippopotam.us/us/${encodeURIComponent(zip)}`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!r.ok) throw new Error(`ZIP ${zip} not found`);
      const j = await r.json();
      const place = j?.places?.[0];
      if (!place) throw new Error(`ZIP ${zip} not resolvable`);
      return { lat: Number(place.latitude), lng: Number(place.longitude), city: place['place name'], state: place['state abbreviation'] };
    }

    async function getOneWayDistance(originKey, destZip, rates) {
      // Cache lookup first
      try {
        const { data: cached } = await db
          .from('sp_trucking_distance_cache')
          .select('miles_one_way, hours_one_way')
          .eq('origin_key', originKey)
          .eq('dest_zip', destZip)
          .single();
        if (cached) {
          return { miles: Number(cached.miles_one_way), hours: Number(cached.hours_one_way), city: null, state: null, cached: true };
        }
      } catch (_) { /* miss */ }

      const yard = OSW_YARDS[originKey];
      if (!yard) throw new Error(`Unknown origin yard: ${originKey}`);
      const dest = await geocodeZip(destZip);
      const straightMiles = haversineMiles(yard, dest);
      const miles = +(straightMiles * (rates.road_factor || 1.3)).toFixed(1);
      const hours = +(miles / (rates.avg_speed_mph || 55)).toFixed(2);

      // Best-effort cache write
      try {
        await db.from('sp_trucking_distance_cache').upsert({
          origin_key: originKey,
          dest_zip: destZip,
          miles_one_way: miles,
          hours_one_way: hours,
          source: 'haversine',
          refreshed_at: new Date().toISOString(),
        }, { onConflict: 'origin_key,dest_zip' });
      } catch (_) {}

      return { miles, hours, city: dest.city, state: dest.state, cached: false };
    }

    async function pickClosestOrigin(destZip, rates) {
      // Phoenix first; if Congress is materially closer (≥30 mi shorter) use that.
      const phx = await getOneWayDistance('phoenix', destZip, rates);
      let congress = null;
      try { congress = await getOneWayDistance('congress', destZip, rates); } catch (_) {}
      if (congress && phx.miles - congress.miles >= 30) {
        return { origin: 'congress', distance: congress };
      }
      return { origin: 'phoenix', distance: phx };
    }

    async function quoteTrucking({ items, zip, roughAccess, originKey }) {
      const rates = await getTruckingRates();
      const { origin, distance } = originKey
        ? { origin: originKey, distance: await getOneWayDistance(originKey, zip, rates) }
        : await pickClosestOrigin(zip, rates);

      const { truck, split } = pickTruck(items || [], distance.miles);
      const truckRate = rates[truck];
      if (!truckRate) throw new Error(`No rate configured for truck ${truck}`);
      const loadCount = truck === 'walking_floor' ? walkingFloorLoads(items || []) : 1;

      const roundTripHours = distance.hours * 2 + (rates.unload_hours || 0.5);
      const baseCost = roundTripHours * truckRate.hourly_rate;
      const accessModifier = roughAccess ? 1.2 : 1.0;
      const subtotal = Math.max(truckRate.min_fee, baseCost) * accessModifier * loadCount;
      const costCents = Math.round(subtotal * 100);

      return {
        truck,
        truckLabel: ({
          walking_floor: 'Walking-floor (bulk dump)',
          flatbed_moffett: 'Flatbed with onboard forklift',
          hot_shot: 'Hot-shot trailer',
        })[truck],
        originYard: origin,
        originLabel: OSW_YARDS[origin].label,
        milesRoundTrip: +(distance.miles * 2).toFixed(1),
        hoursRoundTrip: +roundTripHours.toFixed(2),
        accessModifier,
        costCents,
        costDollars: +(costCents / 100).toFixed(2),
        split,
        breakdown: {
          milesOneWay: distance.miles,
          hoursOneWay: distance.hours,
          unloadHours: rates.unload_hours || 0.5,
          hourlyRate: truckRate.hourly_rate,
          minFee: truckRate.min_fee,
          capacityLabel: truckRate.capacity_label,
          loadCount,
          destinationCity: distance.city,
          destinationState: distance.state,
          cached: distance.cached,
        },
      };
    }

    // POST /api/quote/trucking — body { items: [{sizeOption, quantity}], zip, roughAccess?, originKey? }
    if (path === '/api/quote/trucking' && req.method === 'POST') {
      try {
        const { items, zip, roughAccess, originKey } = req.body || {};
        if (!zip || typeof zip !== 'string' || !/^\d{5}$/.test(zip.trim())) {
          return res.status(400).json({ error: 'A 5-digit ZIP is required' });
        }
        if (!Array.isArray(items) || items.length === 0) {
          return res.status(400).json({ error: 'items[] is required' });
        }
        const quote = await quoteTrucking({ items, zip: zip.trim(), roughAccess: !!roughAccess, originKey });
        res.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=3600');
        return res.json(quote);
      } catch (err) {
        console.error('[trucking quote]', err);
        return res.status(500).json({ error: err?.message || 'Failed to calculate trucking' });
      }
    }

    // GET /api/quote/trucking?zip=85308&truck=walking_floor — quick sanity check
    if (path === '/api/quote/trucking' && req.method === 'GET') {
      try {
        const zip = url.searchParams.get('zip');
        const truck = url.searchParams.get('truck') || 'walking_floor';
        const roughAccess = url.searchParams.get('rough') === '1';
        const originKey = url.searchParams.get('origin') || undefined;
        if (!zip || !/^\d{5}$/.test(zip)) {
          return res.status(400).json({ error: 'zip query param required (5 digits)' });
        }
        // Simulate one item with a sizeOption that maps to the requested truck
        const simulatedItem = truck === 'walking_floor'
          ? { sizeOption: 'Truckload', quantity: 1 }
          : truck === 'hot_shot'
            ? { sizeOption: 'Pallet of 1CF Bags', quantity: 2 }
            : { sizeOption: 'Pallet of 1CF Bags', quantity: 12 };
        const quote = await quoteTrucking({ items: [simulatedItem], zip, roughAccess, originKey });
        return res.json(quote);
      } catch (err) {
        return res.status(500).json({ error: err?.message || 'quote failed' });
      }
    }

    // ========== PAY & PICKUP CHECKOUT ==========

    // Forward an OSW pay-and-pickup order to the MOS sales portal so yard reps
    // get a push notification in the iOS app. Fire-and-await (Vercel kills
    // fire-and-forget); MOS failures are logged but never bubble up.
    async function forwardOswPickupToMos(payload) {
      const secret = process.env.MOS_LEAD_INGEST_SECRET;
      // Route by source: 'osw_pay_delivery' → delivery-orders, else pickup-orders.
      const isDelivery = payload?.source === 'osw_pay_delivery' || payload?.fulfillment_type === 'delivery';
      const endpoint = isDelivery
        ? (process.env.MOS_DELIVERY_INGEST_URL || 'https://myorganicsoil.com/api/delivery-orders')
        : (process.env.MOS_PICKUP_INGEST_URL  || 'https://myorganicsoil.com/api/pickup-orders');
      const tag = isDelivery ? 'mos-delivery-forward' : 'mos-pickup-forward';

      if (!secret) {
        console.warn(`[${tag}] MOS_LEAD_INGEST_SECRET not set — skipping`);
        return { skipped: true };
      }
      if (!payload?.customer_name || !payload?.customer_phone || !payload?.items?.length) {
        console.warn(`[${tag}] missing required fields — skipping`);
        return { skipped: true };
      }
      try {
        const r = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Lead-Source-Key': secret },
          body: JSON.stringify(payload),
        });
        if (!r.ok) {
          const text = await r.text().catch(() => '');
          // 404 is expected during the rollout window before MOS implements
          // /api/delivery-orders. Log it but don't surface as a hard error.
          const level = r.status === 404 && isDelivery ? 'warn' : 'error';
          console[level](`[${tag}] order ${payload.osw_order_id} → ${r.status}: ${text.slice(0, 200)}`);
          return { ok: false, status: r.status };
        }
        console.log(`[${tag}] order ${payload.osw_order_id} → OK`);
        return { ok: true };
      } catch (err) {
        console.error(`[${tag}] network error:`, err?.message || err);
        return { ok: false, error: String(err?.message || err) };
      }
    }

    function formatPickupSlotLabel(pickupIso) {
      try {
        const d = new Date(pickupIso);
        // Phoenix = MST year-round (no DST), fixed UTC-7. Format the hour and
        // date in Phoenix local so yard reps + customers see the slot they
        // actually picked, not the UTC translation.
        const parts = new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/Phoenix',
          weekday: 'short', month: 'short', day: 'numeric',
          hour: 'numeric', hour12: false,
        }).formatToParts(d);
        const get = (t) => parts.find(p => p.type === t)?.value || '';
        const hour = Number(get('hour'));
        const next = (hour + 1) % 24;
        const ampm = (h) => `${h % 12 === 0 ? 12 : h % 12} ${h < 12 || h === 24 ? 'AM' : 'PM'}`;
        const date = `${get('weekday')} ${get('month')} ${get('day')}`;
        return `${ampm(hour)} – ${ampm(next)}, ${date}`;
      } catch {
        return pickupIso;
      }
    }

    // POST /api/checkout/webhook — Stripe webhook for OSW pay-and-pickup orders.
    // On `checkout.session.completed`: mark order paid, reserve inventory, send
    // confirmation emails, and forward to the MOS sales portal so yard reps see
    // the order in the iOS app.
    //
    // NOTE: Vercel's default body parser converts JSON before this handler runs,
    // so we can't byte-perfect verify the Stripe signature without a separate
    // function with bodyParser disabled. We attempt verification when possible
    // and otherwise trust the parsed event but require the Stripe-Signature
    // header to be present (basic anti-spam guard). To enforce strict verification,
    // move this handler to its own function with `export const config = { api: { bodyParser: false } }`.
    if (path === '/api/checkout/webhook' && req.method === 'POST') {
      try {
        const Stripe = (await import('stripe')).default;
        const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
          httpClient: Stripe.createFetchHttpClient(),
        });

        let event = req.body;
        const sig = req.headers['stripe-signature'];
        if (!sig) return res.status(400).json({ error: 'Missing Stripe-Signature header' });

        if (process.env.STRIPE_WEBHOOK_SECRET) {
          try {
            event = stripeClient.webhooks.constructEvent(
              typeof req.body === 'string' ? req.body : JSON.stringify(req.body),
              sig,
              process.env.STRIPE_WEBHOOK_SECRET
            );
          } catch (err) {
            console.warn('[checkout webhook] signature verification failed, trusting parsed body:', err?.message);
            event = req.body;
          }
        }

        if (!event || !event.type) return res.status(400).json({ error: 'Invalid event' });

        if (event.type === 'checkout.session.completed') {
          const session = event.data?.object;
          const orderId = parseInt(session?.metadata?.order_id || '0', 10);
          if (!orderId) return res.json({ received: true, note: 'no order_id in metadata' });

          // Skip if this is a deposit checkout — let /api/webhooks/stripe handle it.
          if (session?.metadata?.type === 'deposit') {
            return res.json({ received: true, note: 'deposit — handled elsewhere' });
          }

          // Mark order paid
          await db
            .from('orders')
            .update({
              status: 'paid',
              payment_status: 'paid',
              paid_at: new Date().toISOString(),
              stripe_payment_intent_id: session.payment_intent || null,
            })
            .eq('id', orderId);

          // Pull order + items for downstream
          const { data: order } = await db.from('orders').select('*').eq('id', orderId).single();
          const { data: orderItems } = await db
            .from('order_items')
            .select('product_id, quantity, unit_price, total_price, size_option')
            .eq('order_id', orderId);

          // Reserve inventory (best-effort)
          if (Array.isArray(orderItems) && order) {
            const locationId = order.location_id || 1;
            for (const item of orderItems) {
              const { data: inv } = await db
                .from('inventory')
                .select('id, quantity_available, quantity_reserved')
                .eq('product_id', item.product_id)
                .eq('location_id', locationId)
                .eq('size_option', item.size_option)
                .single();
              if (inv) {
                await db.from('inventory').update({
                  quantity_available: inv.quantity_available - item.quantity,
                  quantity_reserved: (inv.quantity_reserved || 0) + item.quantity,
                }).eq('id', inv.id);
              }
              await db.from('order_items').update({
                status: 'reserved',
                reserved_at: new Date().toISOString(),
              }).eq('order_id', orderId).eq('product_id', item.product_id);
            }
          }

          // Send confirmation emails (customer + admin) via Resend
          try {
            const r = await getResend();
            const customerEmail = order?.customer_email || order?.email;
            const orderRef = order?.order_number?.slice(0, 8) || orderId;
            if (customerEmail) {
              await r.emails.send({
                from: 'Organic Soil Wholesale <info@soilseedandwater.com>',
                replyTo: 'ralvarez@soilseedandwater.com',
                to: customerEmail,
                subject: `Order #${orderRef} confirmed`,
                html: `<p>Hi ${order?.customer_name || 'there'},</p>
                  <p>Thanks! Your pay &amp; pickup order is confirmed.</p>
                  <p><strong>Pickup:</strong> ${order?.pickup_scheduled_at ? formatPickupSlotLabel(order.pickup_scheduled_at) : 'See order details'}<br>
                  <strong>Location:</strong> 1634 N 19th Ave, Phoenix, AZ 85009</p>
                  <p>Please call (602) 637-0032 when you arrive.</p>
                  <p>Thanks,<br>Rodo Alvarez<br>Soil Seed &amp; Water</p>`,
              });
            }
            await r.emails.send({
              from: 'Organic Soil Wholesale <info@soilseedandwater.com>',
              replyTo: 'ralvarez@soilseedandwater.com',
              to: ['ralvarez@soilseedandwater.com'],
              subject: `New pay & pickup order #${orderRef}`,
              html: `<p>New order from ${order?.customer_name || 'customer'} (${order?.phone || ''}).</p>
                <p>Items: ${(orderItems || []).length}<br>
                Total: $${((order?.total_amount) || 0).toFixed(2)}<br>
                Pickup: ${order?.pickup_scheduled_at ? formatPickupSlotLabel(order.pickup_scheduled_at) : 'TBD'}</p>`,
            });
          } catch (emailErr) {
            console.error('[checkout webhook] email send failed:', emailErr?.message || emailErr);
          }

          // Forward to MOS — delivery vs pickup endpoint chosen inside forwarder.
          const isDeliveryOrder = order?.fulfillment_type === 'delivery';
          await forwardOswPickupToMos({
            osw_order_id: orderId,
            osw_order_number: order?.order_number || undefined,
            customer_name: order?.customer_name || order?.business_name || 'Customer',
            customer_phone: order?.phone || '',
            customer_email: order?.customer_email || order?.email || undefined,
            items: (orderItems || []).map((item) => ({
              product_id: item.product_id,
              product_name: 'Product',
              size_option: item.size_option || '',
              quantity: item.quantity || 1,
              unit_price_cents: Math.round((item.unit_price || 0) * 100),
              total_price_cents: Math.round((item.total_price || 0) * 100),
            })),
            // pickup-shape fields
            pickup_at: isDeliveryOrder ? null : (order?.pickup_scheduled_at || new Date().toISOString()),
            slot_label: !isDeliveryOrder && order?.pickup_scheduled_at ? formatPickupSlotLabel(order.pickup_scheduled_at) : undefined,
            // delivery-shape fields
            fulfillment_type: isDeliveryOrder ? 'delivery' : 'pickup',
            delivery_address: isDeliveryOrder ? order?.delivery_address || null : null,
            truck_type: isDeliveryOrder ? order?.delivery_truck_type || null : null,
            origin_yard: isDeliveryOrder ? order?.delivery_origin_yard || null : null,
            miles_round_trip: isDeliveryOrder ? order?.delivery_miles || null : null,
            hours_round_trip: isDeliveryOrder ? order?.delivery_hours || null : null,
            trucking_fee_cents: isDeliveryOrder ? order?.trucking_fee_cents || 0 : 0,
            // shared
            total_cents: Math.round(((order?.total_amount) || (order?.total) || 0) * 100),
            payment_status: 'paid',
            source: isDeliveryOrder ? 'osw_pay_delivery' : 'osw_pay_pickup',
          });
        } else if (event.type === 'payment_intent.payment_failed') {
          const pi = event.data?.object;
          const { data: order } = await db
            .from('orders')
            .select('id')
            .eq('stripe_payment_intent_id', pi?.id)
            .single();
          if (order) {
            await db.from('orders').update({
              payment_status: 'failed',
              status: 'payment_failed',
            }).eq('id', order.id);
          }
        }

        return res.json({ received: true });
      } catch (err) {
        console.error('[checkout webhook] error:', err);
        return res.status(500).json({ error: 'Webhook processing failed' });
      }
    }

    // POST /api/checkout/create-session
    // Creates a draft order, then either (a) skips Stripe for free orders
    // (TEST discount code = 100% off) or (b) returns a Stripe Checkout URL.
    if (path === '/api/checkout/create-session' && req.method === 'POST') {
      try {
        const {
          items, customerInfo, pickupTime, locationId, discountCode,
          fulfillmentType, deliveryAddress, deliveryQuote,
        } = req.body || {};

        if (!Array.isArray(items) || items.length === 0) {
          return res.status(400).json({ error: 'No items to check out' });
        }

        const normalizedDiscount = typeof discountCode === 'string' ? discountCode.trim().toUpperCase() : null;
        const discountPercent = normalizedDiscount === 'TEST' ? 100 : 0;

        // ---- Delivery (optional). Re-quote server-side so client price can't be trusted. ----
        const isDelivery = fulfillmentType === 'delivery';
        let truckingQuote = null;
        if (isDelivery) {
          if (!deliveryAddress?.zip || !/^\d{5}$/.test(String(deliveryAddress.zip).trim())) {
            return res.status(400).json({ error: 'Delivery ZIP is required (5 digits)' });
          }
          try {
            truckingQuote = await quoteTrucking({
              items,
              zip: String(deliveryAddress.zip).trim(),
              roughAccess: !!deliveryAddress?.roughAccess,
              originKey: deliveryAddress?.originKey,
            });
          } catch (err) {
            return res.status(400).json({ error: `Could not price delivery: ${err.message}` });
          }
        }

        const customerNotes = [
          customerInfo?.customerCategory ? `Customer type: ${customerInfo.customerCategory}` : null,
          customerInfo?.company ? `Company/farm: ${customerInfo.company}` : null,
          typeof customerInfo?.marketingOptIn === 'boolean' ? `Marketing contact list: ${customerInfo.marketingOptIn ? 'yes' : 'no'}` : null,
          normalizedDiscount && discountPercent > 0 ? `Discount applied: ${normalizedDiscount} (-${discountPercent}%)` : null,
          isDelivery && deliveryAddress ? `Delivery to: ${[deliveryAddress.street, deliveryAddress.city, deliveryAddress.state, deliveryAddress.zip].filter(Boolean).join(', ')}` : null,
          isDelivery && truckingQuote ? `Delivery: ${truckingQuote.truckLabel}, ~${truckingQuote.hoursRoundTrip} hr round-trip from ${truckingQuote.originLabel} ($${truckingQuote.costDollars})` : null,
          deliveryAddress?.roughAccess ? 'Site access: hard-to-reach / off-pavement (+20% modifier applied)' : null,
          // Semi-truck access: only call out the negative case. Customer opted out
          // of the pre-checked semi-access question, so we MUST call before dispatch.
          isDelivery && deliveryAddress?.semiAccess === false ? 'SEMI-TRUCK ACCESS: customer says NOT enough room - call before dispatching.' : null,
          customerInfo?.notes ? `Customer notes: ${customerInfo.notes}` : null,
        ].filter(Boolean).join('\n');

        const checkoutLocationId = locationId || 1;

        const productSubtotalDollars = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const truckingDollars = isDelivery && truckingQuote ? truckingQuote.costDollars : 0;
        const rawSubtotal = productSubtotalDollars + truckingDollars;
        const totalDollars = Math.max(0, rawSubtotal * (1 - discountPercent / 100));
        const totalCents = Math.round(totalDollars * 100);
        const isFreeOrder = totalCents === 0 && discountPercent > 0;

        // Create order
        const orderData = {
          email: customerInfo?.email || null,
          phone: customerInfo?.phone,
          status: isFreeOrder ? 'paid' : 'pending_payment',
          payment_status: isFreeOrder ? 'paid' : 'pending',
          delivery_type: isDelivery ? 'delivery' : 'pickup',
          fulfillment_type: isDelivery ? 'delivery' : 'pickup',
          pickup_scheduled_at: isDelivery ? null : (pickupTime || null),
          subtotal: totalCents,
          total: totalCents,
          total_amount: totalDollars,
          location_id: checkoutLocationId,
          customer_name: customerInfo?.name || null,
          customer_email: customerInfo?.email || null,
          business_name: customerInfo?.company || customerInfo?.name || null,
          order_type: isDelivery ? 'delivery' : 'pickup',
          notes: customerNotes || null,
          paid_at: isFreeOrder ? new Date().toISOString() : null,
          // Delivery / trucking columns (new). Safe to set when isDelivery is false too.
          trucking_fee_cents: isDelivery && truckingQuote ? truckingQuote.costCents : 0,
          delivery_truck_type: isDelivery && truckingQuote ? truckingQuote.truck : null,
          delivery_zip: isDelivery ? (deliveryAddress?.zip || null) : null,
          delivery_miles: isDelivery && truckingQuote ? truckingQuote.milesRoundTrip : null,
          delivery_hours: isDelivery && truckingQuote ? truckingQuote.hoursRoundTrip : null,
          access_modifier: isDelivery && truckingQuote ? truckingQuote.accessModifier : null,
          delivery_origin_yard: isDelivery && truckingQuote ? truckingQuote.originYard : null,
          delivery_address_json: isDelivery && deliveryAddress
            ? { street: deliveryAddress.street || '', city: deliveryAddress.city || '', state: deliveryAddress.state || 'AZ', zip: deliveryAddress.zip || '' }
            : null,
          order_items: items.map((item) => ({
            product_id: item.productId,
            name: item.name,
            size: item.sizeOption,
            quantity: item.quantity,
            price: item.price,
            total: item.price * item.quantity,
          })),
        };

        const { data: order, error: orderError } = await db
          .from('orders')
          .insert(orderData)
          .select()
          .single();

        if (orderError) {
          console.error('Order insert error:', orderError);
          return res.status(500).json({ error: 'Failed to create order' });
        }

        const orderItems = items.map((item) => ({
          order_id: order.id,
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
          size_option: item.sizeOption,
          status: isFreeOrder ? 'reserved' : 'pending',
        }));

        const { error: itemsError } = await db.from('order_items').insert(orderItems);
        if (itemsError) console.error('order_items insert error:', itemsError);

        if (isFreeOrder) {
          // Fan out to MOS so yard reps see the test order in the iOS portal.
          try {
            await forwardOswPickupToMos({
              osw_order_id: order.id,
              osw_order_number: order.order_number || undefined,
              customer_name: customerInfo?.name || customerInfo?.company || 'Test Customer',
              customer_phone: customerInfo?.phone || '',
              customer_email: customerInfo?.email || undefined,
              items: items.map((item) => ({
                product_id: item.productId,
                product_name: item.name,
                size_option: item.sizeOption || '',
                quantity: item.quantity || 1,
                unit_price_cents: Math.round((item.price || 0) * 100),
                total_price_cents: Math.round((item.price || 0) * (item.quantity || 1) * 100),
              })),
              // pickup-shape fields
              pickup_at: isDelivery ? null : (pickupTime || new Date().toISOString()),
              slot_label: !isDelivery && pickupTime ? formatPickupSlotLabel(pickupTime) : undefined,
              // delivery-shape fields
              fulfillment_type: isDelivery ? 'delivery' : 'pickup',
              delivery_address: isDelivery ? orderData.delivery_address_json : null,
              truck_type: isDelivery && truckingQuote ? truckingQuote.truck : null,
              origin_yard: isDelivery && truckingQuote ? truckingQuote.originYard : null,
              miles_round_trip: isDelivery && truckingQuote ? truckingQuote.milesRoundTrip : null,
              hours_round_trip: isDelivery && truckingQuote ? truckingQuote.hoursRoundTrip : null,
              trucking_fee_cents: isDelivery && truckingQuote ? truckingQuote.costCents : 0,
              total_cents: 0,
              payment_status: 'paid',
              source: isDelivery ? 'osw_pay_delivery' : 'osw_pay_pickup',
            });
          } catch (e) {
            console.error('[free-order MOS forward] failed:', e?.message || e);
          }

          return res.json({
            free: true,
            orderId: order.id,
            confirmationCode: order.confirmation_code,
            url: null,
          });
        }

        // Stripe path. Use fetch-based HTTP client — the default Node http
        // transport occasionally fails with "connection retried" inside Vercel
        // serverless functions; fetch is the supported workaround.
        const Stripe = (await import('stripe')).default;
        const stripeKey = process.env.STRIPE_SECRET_KEY;
        if (!stripeKey) {
          return res.status(500).json({ error: 'Stripe is not configured on the server' });
        }
        const stripeClient = new Stripe(stripeKey, {
          httpClient: Stripe.createFetchHttpClient(),
          maxNetworkRetries: 2,
        });

        const origin =
          (req.headers.origin) ||
          (req.headers.referer && req.headers.referer.replace(/(https?:\/\/[^/]+).*/, '$1')) ||
          'https://organicsoilwholesale.com';

        const absolutizeImage = (urlStr) => {
          if (!urlStr) return null;
          if (/^https?:\/\//i.test(urlStr)) return urlStr;
          return `${origin.replace(/\/$/, '')}${urlStr.startsWith('/') ? '' : '/'}${urlStr}`;
        };

        const lineItems = items.map((item) => {
          const img = absolutizeImage(item.imageUrl);
          return {
            price_data: {
              currency: 'usd',
              product_data: {
                name: item.name,
                description: item.sizeOption,
                ...(img ? { images: [img] } : {}),
              },
              unit_amount: Math.round(item.price * 100),
            },
            quantity: item.quantity,
          };
        });

        // Delivery shows as its own line item so the customer sees the cost transparently.
        if (isDelivery && truckingQuote && truckingQuote.costCents > 0) {
          lineItems.push({
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Delivery',
                description: `${truckingQuote.truckLabel} • ${truckingQuote.hoursRoundTrip} hr round-trip from ${truckingQuote.originLabel}${deliveryAddress?.roughAccess ? ' • rough-access site' : ''}`,
              },
              unit_amount: truckingQuote.costCents,
            },
            quantity: 1,
          });
        }

        const session = await stripeClient.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: lineItems,
          mode: 'payment',
          success_url: `${origin}/order-confirmation?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
          cancel_url: `${origin}/checkout?canceled=true`,
          metadata: {
            order_id: String(order.id),
            pickup_time: pickupTime || '',
            customer_type: customerInfo?.customerCategory || '',
            company: customerInfo?.company || '',
          },
          customer_email: customerInfo?.email || undefined,
        });

        await db
          .from('orders')
          .update({ stripe_checkout_session_id: session.id })
          .eq('id', order.id);

        return res.json({
          sessionId: session.id,
          orderId: order.id,
          confirmationCode: order.confirmation_code,
          url: session.url,
        });
      } catch (err) {
        console.error('Checkout error:', err);
        return res.status(500).json({ error: err.message || 'Failed to create checkout session' });
      }
    }

    // 404 — alert admin only when a real submission (POST/PUT/PATCH) hits a
    // missing route (i.e. a broken input), not GET noise from bots/crawlers.
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && path.startsWith('/api/')) {
      await reportFailure({ kind: 'unmatched_input', path, method: req.method, status: 404, message: 'No prod route for this input' });
    }
    return res.status(404).json({ error: 'API endpoint not found', path });
  } catch (error) {
    console.error('API error:', error);
    await reportFailure({ kind: 'server_error', path, method: req.method, status: 500, message: error?.message || String(error) });
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
