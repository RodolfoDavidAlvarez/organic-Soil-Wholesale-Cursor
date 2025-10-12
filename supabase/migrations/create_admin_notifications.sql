-- Create admin_notifications table
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_notifications_email ON admin_notifications(email);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_active ON admin_notifications(active);

-- Insert default admin
INSERT INTO admin_notifications (
  email, 
  name, 
  role,
  notify_new_orders,
  notify_arrivals,
  notify_trivia_leads,
  notify_contact_forms,
  notify_quote_requests,
  notify_special_requests,
  active
) VALUES (
  'ralvarez@soilseedandwater.com',
  'Admin',
  'primary_admin',
  true,
  true,
  true,
  true,
  true,
  true,
  true
) ON CONFLICT (email) DO NOTHING;

-- Create contact_submissions table if it doesn't exist
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

-- Create quote_requests table if it doesn't exist
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