// Simple Vercel Serverless Function

// Lazy initialize Supabase to avoid startup errors
let supabase = null;
async function getSupabase() {
  if (!supabase) {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = new URL(req.url, `https://${req.headers.host}`);
  const path = url.pathname;

  try {
    // Health check
    if (path === '/api/health') {
      return res.json({ status: 'ok', timestamp: new Date().toISOString() });
    }

    // Get Supabase client for database operations
    const db = await getSupabase();

    // Products list
    if (path === '/api/public/products' && req.method === 'GET') {
      const { data, error } = await db
        .from('products')
        .select('*')
        .eq('is_catalog_enabled', true)
        .eq('product_status', 'active')
        .order('catalog_display_order', { ascending: true, nullsFirst: false })
        .order('name', { ascending: true });

      if (error) throw error;
      return res.json({ products: data || [] });
    }

    // Single product - try by ID first, then by slug
    const productMatch = path.match(/^\/api\/public\/products\/(.+)$/);
    if (productMatch && req.method === 'GET') {
      const idOrSlug = productMatch[1];
      const numericId = Number(idOrSlug);
      let data = null;
      let error = null;

      // Try by numeric ID first
      if (!Number.isNaN(numericId)) {
        const result = await db
          .from('products')
          .select('*')
          .eq('id', numericId)
          .single();
        data = result.data;
        error = result.error;
      }

      // If not found by ID, try by slug
      if (!data || error?.code === 'PGRST116') {
        const result = await db
          .from('products')
          .select('*')
          .eq('slug', idOrSlug)
          .single();
        data = result.data;
        error = result.error;
      }

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Product not found' });
        }
        throw error;
      }
      return res.json(data);
    }

    // Representative by slug
    const repMatch = path.match(/^\/api\/representatives\/([^\/]+)$/);
    if (repMatch && req.method === 'GET') {
      const slug = repMatch[1];

      // Try representatives first
      let { data, error } = await db
        .from('representatives')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      // If not found, try admin_users
      if (error && error.code === 'PGRST116') {
        const { data: adminData, error: adminError } = await db
          .from('admin_users')
          .select('*')
          .eq('slug', slug)
          .eq('has_landing_page', true)
          .eq('is_active', true)
          .single();

        if (adminError) {
          if (adminError.code === 'PGRST116') {
            return res.status(404).json({ error: 'Landing page not found' });
          }
          throw adminError;
        }

        data = {
          id: adminData.id,
          slug: adminData.slug,
          name: adminData.full_name || adminData.email,
          email: adminData.email,
          phone: adminData.phone,
          website: adminData.website,
          bio: adminData.bio,
          photo_url: adminData.photo_url,
          banner_image_url: adminData.banner_image_url,
          gallery_images: adminData.gallery_images || [],
          video_urls: adminData.video_urls || [],
          company_name: adminData.company_name,
          title: adminData.title,
          address: adminData.address,
          city: adminData.city,
          state: adminData.state,
          zip_code: adminData.zip_code,
          social_links: adminData.social_links || {},
          contact_button_text: adminData.contact_button_text || 'Enter Your Contact Details',
          contact_card_button_text: adminData.contact_card_button_text || 'Download Contact Card',
          contact_form_title: adminData.contact_form_title || 'Get In Touch',
          contact_form_description: adminData.contact_form_description,
          is_active: adminData.is_active,
          source: 'admin',
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

      if (!firstName || !lastName || !email) {
        return res.status(400).json({ error: 'First name, last name, and email are required' });
      }

      const { data: representative } = await db
        .from('representatives')
        .select('id, admin_id')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      let contactData = {
        first_name: firstName,
        last_name: lastName,
        email,
        phone: phone || null,
        company_name: companyName || null,
        message: message || null,
        source: 'landing_page',
        status: 'new',
      };

      if (representative) {
        contactData.representative_id = representative.id;
        contactData.admin_id = representative.admin_id || null;
      } else {
        const { data: admin } = await db
          .from('admin_users')
          .select('id')
          .eq('slug', slug)
          .eq('has_landing_page', true)
          .eq('is_active', true)
          .single();

        if (!admin) {
          return res.status(404).json({ error: 'Landing page not found' });
        }
        contactData.admin_id = admin.id;
        contactData.representative_id = null;
      }

      const { data, error } = await db
        .from('representative_contacts')
        .insert(contactData)
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json({ success: true, data });
    }

    // 404 for unmatched routes
    return res.status(404).json({ error: 'API endpoint not found', path });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
