import 'dotenv/config';
import fs from 'fs';
import path from 'path';

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const OUTPUT_DIR = path.join(process.cwd(), 'client/public/images/generated-review');

const products = [
  {
    slug: 'simons-gold',
    prompt: 'Professional photo of rich dark organic dairy compost being spread in a vegetable garden bed, healthy tomato and pepper plants growing in amended soil, Arizona backyard setting, warm golden hour sunlight, editorial quality gardening photography, no text or logos',
  },
  {
    slug: 'mikeys-worm-poop',
    prompt: 'Professional close-up photo of dark rich worm castings vermicompost in hands over a lush raised garden bed with thriving vegetables and herbs, organic gardening setting, warm natural lighting, editorial quality photography, no text or logos',
  },
  {
    slug: 'tee-top-divot-repair-blend',
    prompt: 'Professional photo of a manicured golf course tee box with perfectly repaired divots, emerald green grass, golfer in background, pristine fairway conditions, warm morning light, editorial quality sports turf photography, no text or logos',
  },
  {
    slug: 'seriokais-secret-blend',
    prompt: 'Professional photo of a healthy mature avocado tree and citrus orange tree with ripe fruit in an Arizona backyard, rich dark amended soil around the base, lush green canopy, warm desert golden hour lighting, editorial quality photography, no text or logos',
  },
  {
    slug: 'stoned-apes-blend',
    prompt: 'Professional close-up photo of white mycorrhizal fungi network visible on healthy plant roots in rich dark soil, mushrooms growing at the base, forest floor organic setting, macro photography style, warm natural lighting, editorial quality, no text or logos',
  },
  {
    slug: 'desert-defender',
    prompt: 'Professional photo of drought-resistant desert landscaping thriving in extreme Arizona heat, xeriscape plants and native shrubs growing in amended soil, dry rocky terrain with green oasis, harsh midday sun, editorial quality photography, no text or logos',
  },
  {
    slug: 'amazonian-dark-earth',
    prompt: 'Professional photo of dark rich biochar-amended soil in a raised garden bed with exceptionally healthy vegetable plants, deep black earth visible, lush green growth, organic garden setting, warm natural lighting, editorial quality photography, no text or logos',
  },
  {
    slug: 'cultivators-rose-blend',
    prompt: 'Professional photo of stunning blooming rose bushes with vibrant red and pink roses in a well-maintained garden, rich dark amended soil visible around the base, Arizona residential landscape, golden hour warm lighting, editorial quality photography, no text or logos',
  },
  {
    slug: 'soil-craft',
    prompt: 'Professional photo of hands potting a beautiful flowering plant into a terracotta container using dark rich premium potting soil, home patio garden setting, various potted plants in background, warm natural lighting, editorial quality lifestyle photography, no text or logos',
  },
  {
    slug: 'plugboost',
    prompt: 'Professional photo of tiny green seedlings sprouting from seed starter trays filled with fine dark growing medium, close-up showing healthy germination, greenhouse nursery setting, soft morning light, editorial quality photography, no text or logos',
  },
];

async function generateImage(product) {
  console.log(`Generating: ${product.slug}...`);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_KEY}`;

  const body = {
    contents: [{ parts: [{ text: product.prompt }] }],
    generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (data.error) { console.log(`  ERROR: ${data.error.message}`); return false; }

    const candidates = data.candidates || [];
    for (const candidate of candidates) {
      for (const part of (candidate.content?.parts || [])) {
        if (part.inlineData) {
          const ext = (part.inlineData.mimeType || '').includes('jpeg') ? 'jpg' : 'png';
          const filename = `${product.slug}-lifestyle.${ext}`;
          const filepath = path.join(OUTPUT_DIR, filename);
          fs.writeFileSync(filepath, Buffer.from(part.inlineData.data, 'base64'));
          console.log(`  Saved: ${filename} (${Math.round(fs.statSync(filepath).size / 1024)}KB)`);
          return true;
        }
      }
    }
    console.log(`  No image returned`);
    return false;
  } catch (err) {
    console.log(`  ERROR: ${err.message}`);
    return false;
  }
}

let success = 0;
for (const p of products) {
  const ok = await generateImage(p);
  if (ok) success++;
  await new Promise(r => setTimeout(r, 3000));
}
console.log(`\nDone: ${success}/${products.length}`);
