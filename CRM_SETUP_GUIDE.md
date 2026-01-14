# CRM System Setup Guide

This guide will help you set up and use the Representative CRM system for managing representative landing pages and contact form submissions.

## Database Setup

### Step 1: Run SQL Migration

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `scripts/create-crm-tables.sql`
4. Run the SQL script

This will create two tables:
- `representatives` - Stores representative information
- `representative_contacts` - Stores contact form submissions

### Already ran the original migration?

Run the snippet below in the Supabase SQL editor to add the latest landing-page fields (banner image, gallery, contact card labels, etc.) without rebuilding the table:

```sql
ALTER TABLE representatives
  ADD COLUMN IF NOT EXISTS banner_image_url TEXT,
  ADD COLUMN IF NOT EXISTS gallery_images TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS contact_button_text TEXT DEFAULT 'Contact Me' NOT NULL,
  ADD COLUMN IF NOT EXISTS contact_card_button_text TEXT DEFAULT 'Download Contact Card' NOT NULL,
  ADD COLUMN IF NOT EXISTS contact_form_title TEXT DEFAULT 'Get In Touch' NOT NULL,
  ADD COLUMN IF NOT EXISTS contact_form_description TEXT;
```

## Features

### Admin Features

1. **Manage Representatives** (`/admin/representatives`)
   - Create, edit, and delete representatives
   - Set representative information (name, email, phone, website, bio, etc.)
   - Upload photos and add social media links
   - Control visibility with active/inactive status
   - Set display order for sorting

2. **Contact Management**
   - View all contact submissions for each representative
   - Update contact status (new, contacted, qualified, converted, archived)
   - Add notes to contacts
   - Filter contacts by status
3. **CRM Contacts Dashboard** (`/admin/representative-contacts`)
   - Centralized list of every submission
   - Search by name, email, or phone
   - Update status inline and log notes in a detail drawer

### Public Features

1. **Representative Landing Pages** (`/rep/:slug`)
   - Beautiful, mobile-responsive landing pages
   - Hero section with profile photo, optional banner, and CTA buttons
   - Downloadable contact card (vCard) support
   - Optional gallery highlights with multiple photos
   - Social media links and full contact info cards
   - Clean CTA card that opens a modal intake form

2. **Contact Form**
   - Simple, user-friendly intake form
   - Captures: first name, last name, email, phone, quick notes
   - Automatic submission to database
   - Success confirmation

## Usage Instructions

### Creating a Representative

1. Log in to the admin panel
2. Navigate to **Representatives** in the sidebar
3. Click **Add Representative**
4. Fill in the required fields:
   - **Slug**: URL-friendly identifier (e.g., "john-smith")
   - **Name**: Full name of the representative
   - **Email**: Contact email (required)
5. Optionally add:
   - Phone number
   - Website URL
   - Company name
   - Title/position
   - Bio/description
   - Photo URL
   - Address information
   - Social media links (Facebook, Twitter, LinkedIn, Instagram)
6. Set display order (for sorting)
7. Toggle active/inactive status
8. Click **Create**

### Viewing Landing Pages

Once a representative is created, their landing page will be available at:
```
/rep/[slug]
```

For example, if the slug is "john-smith", the URL will be:
```
/rep/john-smith
```

### Managing Contacts

1. Open the **CRM Contacts** tab in the admin sidebar.
2. Filter by status or search by name/email/phone.
3. Update the status inline from the table.
4. Click **View** to open the detail drawer, read the original message, and log internal notes.
5. All contact updates are reflected instantly on the page.

## API Endpoints

### Admin Endpoints (Protected)

- `GET /api/admin/representatives` - Get all representatives
- `GET /api/admin/representatives/:id` - Get single representative
- `POST /api/admin/representatives` - Create representative
- `PUT /api/admin/representatives/:id` - Update representative
- `DELETE /api/admin/representatives/:id` - Delete representative
- `GET /api/admin/representatives/:id/contacts` - Get contacts for representative
- `PATCH /api/admin/representatives/contacts/:contactId` - Update contact status
- `GET /api/admin/representative-contacts` - Global list of all submissions
- `PATCH /api/admin/representative-contacts/:contactId` - Update status or internal notes

### Public Endpoints

- `GET /api/representatives/:slug` - Get representative by slug
- `GET /api/representatives/:slug/contact-card` - Download the representative vCard file
- `POST /api/representatives/:slug/contact` - Submit contact form

## Database Schema

### Representatives Table

- `id` - Primary key
- `slug` - URL-friendly identifier (unique)
- `name` - Representative name
- `email` - Contact email
- `phone` - Phone number (optional)
- `website` - Website URL (optional)
- `bio` - Biography/description (optional)
- `photo_url` - Photo URL (optional)
- `company_name` - Company name (optional)
- `title` - Job title (optional)
- `address`, `city`, `state`, `zip_code` - Address fields (optional)
- `social_links` - JSON object with social media URLs
- `custom_fields` - JSON object for custom data
- `banner_image_url` - Optional hero/background media
- `gallery_images` - Optional array of additional photo URLs
- `contact_button_text` / `contact_card_button_text` - CTA label overrides
- `contact_form_title` / `contact_form_description` - Custom form copy
- `is_active` - Boolean for visibility
- `display_order` - Integer for sorting
- `created_at`, `updated_at` - Timestamps

### Representative Contacts Table

- `id` - Primary key
- `representative_id` - Foreign key to representatives
- `first_name` - Contact's first name
- `last_name` - Contact's last name
- `email` - Contact's email
- `phone` - Contact's phone (optional)
- `company_name` - Contact's company (optional)
- `message` - Contact's message (optional)
- `source` - Source of contact (default: "landing_page")
- `status` - Status (new, contacted, qualified, converted, archived)
- `notes` - Admin notes (optional)
- `metadata` - JSON object for additional data
- `created_at`, `updated_at` - Timestamps

## Mobile Optimization

The landing pages are fully responsive and optimized for mobile devices:
- Responsive grid layout
- Touch-friendly form inputs
- Mobile-optimized images
- Easy-to-use modal contact form with CTA buttons

## Customization

### Adding Custom Fields

You can add custom fields to representatives using the `custom_fields` JSON column. These can be accessed programmatically in the admin panel or landing pages.

### Styling

The landing pages use Tailwind CSS and can be customized by modifying:
- `client/src/pages/RepresentativeLanding.tsx` - Landing page component
- `client/src/pages/admin/Representatives.tsx` - Admin interface

## Troubleshooting

### Representative Not Found

- Check that the slug matches exactly (case-sensitive)
- Verify the representative is set to `is_active = true`
- Check the database to ensure the representative exists

### Contact Form Not Submitting

- Check browser console for errors
- Verify the API endpoint is accessible
- Ensure all required fields are filled
- Check database connection

### Admin Access Issues

- Ensure you're logged in to the admin panel
- Check that your admin token is valid
- Verify admin authentication middleware is working

## Next Steps

1. Run the SQL migration script
2. Create your first representative
3. Test the landing page
4. Customize styling if needed
5. Start collecting contacts!

For questions or issues, check the code comments or contact the development team.



