-- Create admin_profiles table
CREATE TABLE IF NOT EXISTS admin_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'inventory_manager', 'order_processor')),
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Enable Row Level Security
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for admin users to read their own profile
CREATE POLICY "Admin can view own profile" ON admin_profiles
  FOR SELECT USING (auth.uid() = id);

-- Create policy for super_admin to manage all profiles
CREATE POLICY "Super admin can manage all profiles" ON admin_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_admin_profiles_updated_at BEFORE UPDATE ON admin_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create audit_logs table for admin actions
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id BIGSERIAL PRIMARY KEY,
  admin_id UUID REFERENCES admin_profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Index for faster queries
CREATE INDEX idx_admin_audit_logs_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX idx_admin_audit_logs_created_at ON admin_audit_logs(created_at);

-- Enable RLS on audit logs
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON admin_audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE id = auth.uid()
    )
  );