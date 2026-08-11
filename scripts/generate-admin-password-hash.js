import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const password = process.env.ADMIN_PASSWORD?.trim();
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();

if (!password || !email) {
  throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required");
}

const hash = await bcrypt.hash(password, 12);
console.log(`Generated an admin password hash for ${email}.`);
console.log(hash);
