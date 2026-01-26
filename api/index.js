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

    // ============ EXISTING ENDPOINTS ============

    // Products list
    if (path === '/api/public/products' && req.method === 'GET') {
      const { data, error } = await db.from('products').select('*').eq('is_catalog_enabled', true).eq('product_status', 'active').order('catalog_display_order', { ascending: true, nullsFirst: false }).order('name', { ascending: true });
      if (error) throw error;
      return res.json({ products: data || [] });
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
      return res.json(data);
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

    // ============ OPERATIONS BOL ENDPOINTS ============

    // Get all BOLs
    if (path === '/api/admin/operations/bols' && req.method === 'GET') {
      const admin = await verifyAdminToken(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });

      const { data, error } = await db
        .from('ops_bols')
        .select('*')
        .order('created_at', { ascending: false });

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
body{font-family:Arial,sans-serif;font-size:11px;line-height:1.4;padding:20px;max-width:800px;margin:0 auto;background:white}
.header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #264027;padding-bottom:15px;margin-bottom:15px}
.logo-section h1{font-size:20px;color:#264027;margin-bottom:3px}
.logo-section p{font-size:9px;color:#666}
.bol-info{text-align:right}
.bol-number{font-size:16px;font-weight:bold;font-family:monospace;color:#264027}
.date{font-size:11px;color:#666;margin-top:3px}
.section{margin-bottom:12px;border:1px solid #ddd;border-radius:4px;overflow:hidden}
.section-header{background:#f5f5f5;padding:6px 10px;font-weight:bold;font-size:10px;text-transform:uppercase;color:#333;border-bottom:1px solid #ddd}
.section-content{padding:10px}
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:15px}
.field{margin-bottom:6px}
.field-label{font-size:9px;color:#666;text-transform:uppercase;margin-bottom:1px}
.field-value{font-size:11px;font-weight:500}
.weight-summary{background:#1a1a1a;color:white;padding:12px;border-radius:4px;display:grid;grid-template-columns:repeat(3,1fr);gap:10px;text-align:center;margin-top:8px}
.weight-box{padding:8px;border-radius:4px}
.weight-box.gross,.weight-box.tare{background:rgba(255,255,255,0.1)}
.weight-box.net{background:#264027}
.weight-label{font-size:8px;text-transform:uppercase;opacity:0.8;margin-bottom:2px}
.weight-value{font-size:16px;font-weight:bold;font-family:monospace}
.weight-unit{font-size:8px;opacity:0.7}
.signature-section{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:20px;padding-top:15px;border-top:1px solid #ddd}
.signature-box{border-bottom:1px solid #333;padding-bottom:30px;margin-bottom:5px}
.signature-label{font-size:9px;color:#666}
.footer{margin-top:20px;padding-top:10px;border-top:1px solid #ddd;font-size:8px;color:#666;text-align:center}
@media screen { body { background: #f0f0f0; padding: 20px; } }
</style>
${printScript}
</head><body>
<div class="header">
<div class="logo-section"><h1>Soil Seed and Water</h1><p>1634 North 19th Avenue, Phoenix, AZ 85007 | info@soilseedandwater.com</p></div>
<div class="bol-info"><div class="bol-number">${bol.bol_number}</div><div class="date">${new Date(bol.date).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</div>${bol.reference_number?`<div style="font-size:9px;color:#666;margin-top:3px">Ref: ${bol.reference_number}</div>`:''}</div>
</div>
<div class="two-col">
<div class="section"><div class="section-header">Origin</div><div class="section-content">
<div class="field"><div class="field-label">Location</div><div class="field-value">${bol.origin_location}</div></div>
<div class="field"><div class="field-label">Address</div><div class="field-value">${bol.origin_address}<br>${bol.origin_city}, ${bol.origin_state} ${bol.origin_zip}</div></div>
</div></div>
<div class="section"><div class="section-header">Destination</div><div class="section-content">
<div class="field"><div class="field-label">Customer</div><div class="field-value">${bol.customer_name}</div></div>
<div class="field"><div class="field-label">Address</div><div class="field-value">${bol.destination_address}<br>${bol.destination_city}, ${bol.destination_state} ${bol.destination_zip}</div></div>
${bol.onsite_contact_name?`<div class="field"><div class="field-label">Contact</div><div class="field-value">${bol.onsite_contact_name}${bol.onsite_contact_phone?' - '+bol.onsite_contact_phone:''}</div></div>`:''}
</div></div>
</div>
<div class="section"><div class="section-header">Material</div><div class="section-content">
<div class="field"><div class="field-label">Type</div><div class="field-value">${bol.material_type}</div></div>
${bol.material_description?`<div class="field"><div class="field-label">Description</div><div class="field-value">${bol.material_description}</div></div>`:''}
${hasWeight?`<div class="weight-summary">
<div class="weight-box gross"><div class="weight-label">Gross</div><div class="weight-value">${bol.gross_weight.toLocaleString()}</div><div class="weight-unit">lbs</div></div>
<div class="weight-box tare"><div class="weight-label">Tare</div><div class="weight-value">${bol.tare_weight.toLocaleString()}</div><div class="weight-unit">lbs</div></div>
<div class="weight-box net"><div class="weight-label">Net</div><div class="weight-value">${bol.net_weight.toLocaleString()}</div><div class="weight-unit">${bol.net_weight_tons} tons</div></div>
</div>`:''}
</div></div>
<div class="section"><div class="section-header">Carrier & Transport</div><div class="section-content">
<div class="two-col">
<div><div class="field"><div class="field-label">Carrier</div><div class="field-value">${bol.carrier_name}</div></div>
${bol.driver_name?`<div class="field"><div class="field-label">Driver</div><div class="field-value">${bol.driver_name}</div></div>`:''}</div>
<div>${bol.truck_number?`<div class="field"><div class="field-label">Truck #</div><div class="field-value">${bol.truck_number}</div></div>`:''}
${bol.license_plate?`<div class="field"><div class="field-label">License Plate</div><div class="field-value">${bol.license_plate}</div></div>`:''}
${bol.trailer_number?`<div class="field"><div class="field-label">Trailer #</div><div class="field-value">${bol.trailer_number}</div></div>`:''}</div>
</div></div></div>
${bol.notes?`<div class="section"><div class="section-header">Notes</div><div class="section-content"><div class="field-value">${bol.notes}</div></div></div>`:''}
<div class="signature-section">
<div><div class="signature-box"></div><div class="signature-label">Shipper Signature / Date</div></div>
<div><div class="signature-box"></div><div class="signature-label">Driver Signature / Date</div></div>
</div>
<div class="footer">This document serves as a Bill of Lading${hasWeight?' and Weight Ticket':''} for the delivery of materials from Soil Seed and Water.</div>
</body></html>`;

      // Return HTML as PDF-ready content
      res.setHeader('Content-Type', 'text/html');
      return res.send(html);
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

    // 404
    return res.status(404).json({ error: 'API endpoint not found', path });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
