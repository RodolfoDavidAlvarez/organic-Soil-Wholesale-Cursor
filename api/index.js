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

      const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>BOL ${bol.bol_number}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,sans-serif;font-size:11px;line-height:1.4;padding:20px;max-width:800px;margin:0 auto}
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
</style></head><body>
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

    // 404
    return res.status(404).json({ error: 'API endpoint not found', path });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
