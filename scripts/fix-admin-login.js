import bcrypt from "bcrypt";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const requireEnv = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
};

async function fixAdminLogin() {
  const supabase = createClient(
    requireEnv("SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  );
  const passwordHash = await bcrypt.hash(requireEnv("ADMIN_PASSWORD"), 12);
  const emails = requireEnv("ADMIN_EMAILS")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  const { data, error } = await supabase
    .from("admin_users")
    .update({ password_hash: passwordHash, is_active: true })
    .in("email", emails)
    .select("id");

  if (error) throw error;
  console.log(`Updated ${data?.length || 0} managed admin account(s).`);
}

fixAdminLogin().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
