# Project-Specific Instructions

## Mobile-First Development Priority
- **90% of website visitors use mobile phones** - CRITICAL priority
- Always develop and test mobile view first before desktop
- Ensure all touch targets are minimum 44x44px for easy tapping
- Test all features on mobile viewport (375px-414px width)
- Avoid horizontal scrolling at all costs on mobile

## Product Image Display Order
- **ALWAYS display texture photo as the first/primary image** for all products
- Order: 1) Product Texture Photo, 2) Additional images, 3) Product bag photo
- This applies to all product detail pages and galleries

## Image Performance Concerns
- **High-resolution texture photos (7.5MB+) cause slow loading times**
- Need to implement image optimization: lazy loading, compression, responsive sizes
- Consider creating optimized versions (e.g., texture-photo-optimized.jpg at <500KB)
- Product images are already in client/public/ directory - use local files, not external URLs

## Pay & Pickup Landing Strategy
- **Physical Banner QR Code** → Mobile landing page for landscapers
- Primary Path: `/pay-and-pickup` (legacy alias `/qr`) - Optimized for quick ordering (2-3 taps max)
- May become DEFAULT ordering interface for all users
- Focus: Convert drive-by traffic to immediate orders
- Design: Bold buttons, simple choices, no distractions

## Database Management
- Use Supabase MPC when needed modifications in the database

## API Keys Location (.env)

| Service | Key | Purpose |
|---------|-----|---------|
| **Supabase** | `VITE_SUPABASE_ANON_KEY` | Public/client-side - safe to expose, limited by Row Level Security (RLS) |
| **Supabase** | `SUPABASE_SERVICE_ROLE_KEY` | Server-side ONLY - bypasses RLS, full admin access. NEVER expose to client |
| **Stripe** | `STRIPE_SECRET_KEY` | Server-side - process payments, create invoices |
| **Stripe** | `VITE_STRIPE_PUBLISHABLE_KEY` | Client-side - safe to expose, used for Stripe.js |
| **HubSpot** | `HUBSPOT_ACCESS_TOKEN` | Server-side - API calls to create/read contacts |
| **HubSpot** | `HUBSPOT_CLIENT_SECRET` | Server-side - webhook signature validation |
| **Resend** | `RESEND_API_KEY` | Server-side - send transactional emails |
| **Grok** | `XAI_API_KEY` | Server-side - AI features |

### Key Types Explained

| Type | Can Expose? | Use Case |
|------|-------------|----------|
| **Anon/Public/Publishable** | ✅ Yes | Frontend code, browser - limited permissions |
| **Secret/Service Role** | ❌ Never | Backend only - full access, bypasses security |
| **Access Token** | ❌ Never | API authentication - treat like password |
