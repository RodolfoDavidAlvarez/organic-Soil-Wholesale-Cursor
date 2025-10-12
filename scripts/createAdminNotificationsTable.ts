import dotenv from 'dotenv';
import { supabase } from '../server/db/supabase.js';

dotenv.config();

async function createAdminNotificationsTable() {
  console.log('Creating admin_notifications table...\n');

  try {
    // Create admin_notifications table
    const { error: createTableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS admin_notifications (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) NOT NULL UNIQUE,
          name VARCHAR(255) NOT NULL,
          role VARCHAR(100) DEFAULT 'admin',
          
          -- Notification preferences
          notify_new_orders BOOLEAN DEFAULT true,
          notify_arrivals BOOLEAN DEFAULT true,
          notify_trivia_leads BOOLEAN DEFAULT true,
          notify_contact_forms BOOLEAN DEFAULT true,
          notify_quote_requests BOOLEAN DEFAULT true,
          notify_special_requests BOOLEAN DEFAULT true,
          
          -- Status
          active BOOLEAN DEFAULT true,
          
          -- Timestamps
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Create updated_at trigger
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
        END;
        $$ language 'plpgsql';

        CREATE TRIGGER update_admin_notifications_updated_at 
        BEFORE UPDATE ON admin_notifications 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();

        -- Create index on email for faster lookups
        CREATE INDEX IF NOT EXISTS idx_admin_notifications_email ON admin_notifications(email);
        CREATE INDEX IF NOT EXISTS idx_admin_notifications_active ON admin_notifications(active);
      `
    });

    if (createTableError) {
      console.error('Error creating table:', createTableError);
      return;
    }

    console.log('✓ Admin notifications table created successfully\n');

    // Insert default admin
    const { error: insertError } = await supabase
      .from('admin_notifications')
      .insert({
        email: 'ralvarez@soilseedandwater.com',
        name: 'Admin',
        role: 'primary_admin',
        notify_new_orders: true,
        notify_arrivals: true,
        notify_trivia_leads: true,
        notify_contact_forms: true,
        notify_quote_requests: true,
        notify_special_requests: true,
        active: true
      })
      .select();

    if (insertError && insertError.code !== '23505') { // Ignore duplicate key error
      console.error('Error inserting default admin:', insertError);
    } else if (!insertError) {
      console.log('✓ Default admin added successfully');
    }

    // Create contact_submissions table if it doesn't exist
    const { error: createContactError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS contact_submissions (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          phone VARCHAR(50),
          company VARCHAR(255),
          subject VARCHAR(255),
          message TEXT NOT NULL,
          status VARCHAR(50) DEFAULT 'new',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `
    });

    if (!createContactError) {
      console.log('✓ Contact submissions table ready');
    }

    // Create quote_requests table if it doesn't exist
    const { error: createQuoteError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS quote_requests (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          phone VARCHAR(50),
          company VARCHAR(255),
          products TEXT NOT NULL,
          quantities TEXT NOT NULL,
          delivery_location VARCHAR(255),
          notes TEXT,
          status VARCHAR(50) DEFAULT 'new',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `
    });

    if (!createQuoteError) {
      console.log('✓ Quote requests table ready');
    }

    console.log('\nDatabase setup complete!');

  } catch (error) {
    console.error('Setup error:', error);
  }
}

// Run the setup
createAdminNotificationsTable().catch(console.error);