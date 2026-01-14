# Setup Super Admin Authentication

## Step 1: Run SQL Script in Supabase SQL Editor

I've created a SQL script that will set up your super admin user with authentication. 

**File:** `scripts/setup-super-admin.sql`

### Instructions:

1. Open your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `scripts/setup-super-admin.sql`
4. Run the SQL script

### What the script does:

- Ensures the `admin_users` table has `password_hash` and `full_name` columns
- Creates or updates your super admin user with:
  - **Email:** `ralvarez@soilseedandwater.com`
  - **Password:** `admin123`
  - **Role:** `super_admin`
  - **Full Name:** `Rodolfo Alvarez`
  - **Permissions:** Full access (`{"all": true}`)

### Verify Setup:

After running the script, you should see a result showing your admin user with:
- `password_status: "Password set"`
- `role: "super_admin"`
- `is_active: true`

## Step 2: Test the Authentication

Once the SQL script is run, you can test the login:

1. Start your development server: `npm run dev`
2. Navigate to `/admin/login`
3. Login with:
   - Email: `ralvarez@soilseedandwater.com`
   - Password: `admin123`

## Next Steps (After Authentication is Working)

Once authentication is confirmed working, we'll proceed with:

1. **Re-enable Authentication Middleware** - Remove the temporary bypass
2. **Create Admin Management UI** - Section for super admin to manage admins
3. **Implement Role-Based Permissions**:
   - **Admin:** Can only see their own CRM contacts
   - **Super Admin:** Can see all CRM contacts and manage admins
4. **Add Admin Assignment Features** - Allow super admin to assign roles to users

## Current Authentication Status

- ✅ SQL script created with bcrypt password hash
- ⏳ Waiting for you to run the SQL script in Supabase
- ⏳ Authentication middleware currently bypassed (needs to be re-enabled)
- ⏳ Admin management UI needs to be created



