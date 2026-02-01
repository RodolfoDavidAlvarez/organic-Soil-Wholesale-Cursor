import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixTextureUrl() {
  // Fix Mikey's Worm Poop texture photo URL
  const { data, error } = await supabase
    .from("products")
    .update({ texture_photo_url: "/images/optimized/worm-castting-product-texture.jpg" })
    .eq("id", 1001)
    .select("id, name, texture_photo_url");

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log("Updated:", data);
}

fixTextureUrl();
