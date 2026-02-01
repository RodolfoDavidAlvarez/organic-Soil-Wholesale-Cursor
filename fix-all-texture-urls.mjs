import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Mapping of product names to correct texture photo paths
const textureUpdates = [
  { name: "Amazonian Dark Earth", texture: "/images/optimized/biochar-product-texture-look.jpg" },
  { name: "Artemis Root Boost Blend", texture: "/images/optimized/compost-texture-look.jpg" },
  { name: "Bacchus Blend", texture: "/images/optimized/compost-texture-look.jpg" },
  { name: "Nature's Blanket Premium Mulch", texture: "/images/optimized/dark-mulk-applied-in-outside-of-office-showcase.jpg" },
  { name: "Natures Blanket", texture: "/images/optimized/dark-mulk-applied-in-outside-of-office-showcase.jpg" },
  { name: "Oasis Blend", texture: "/images/optimized/compost-texture-look.jpg" },
  { name: "Pomona Blend", texture: "/images/optimized/compost-texture-look.jpg" },
  { name: "SKMicrosource", texture: "/images/optimized/skm-product-texture-look.jpg" },
  { name: "Seriokai's Secret Blend", texture: "/images/optimized/compost-texture-look.jpg" },
  { name: "SuperBooster", texture: "/images/optimized/concentrated-organic-amendment-fertilizer-product-look.jpg" },
  { name: "Turf Daddy Blend", texture: "/images/optimized/compost-texture-look.jpg" },
];

async function fixAllTextureUrls() {
  for (const update of textureUpdates) {
    const { data, error } = await supabase
      .from("products")
      .update({ texture_photo_url: update.texture })
      .eq("name", update.name)
      .select("id, name, texture_photo_url");

    if (error) {
      console.error(`Error updating ${update.name}:`, error.message);
    } else if (data && data.length > 0) {
      console.log(`✓ Updated: ${data[0].name}`);
    } else {
      console.log(`⚠ No match for: ${update.name}`);
    }
  }
}

fixAllTextureUrls();
