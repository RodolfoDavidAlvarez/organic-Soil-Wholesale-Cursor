import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const requireEnv = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
};

const sqlLiteral = (value) => value.replaceAll("'", "''");

async function createAdminUser() {
  const email = requireEnv("ADMIN_EMAIL").toLowerCase();
  const password = requireEnv("ADMIN_PASSWORD");
  const fullName = process.env.ADMIN_FULL_NAME?.trim() || "Admin User";
  const passwordHash = await bcrypt.hash(password, 12);

  console.log(`Generated an admin password hash for ${email}.`);
  console.log(`
INSERT INTO admin_users (email, password_hash, full_name, role, permissions, is_active)
VALUES ('${sqlLiteral(email)}', '${passwordHash}', '${sqlLiteral(fullName)}', 'super_admin', '{"all": true}'::jsonb, true)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  full_name = EXCLUDED.full_name,
  is_active = true;
  `);
}

createAdminUser().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
