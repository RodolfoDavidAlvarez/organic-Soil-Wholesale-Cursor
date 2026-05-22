import 'dotenv/config';
import fs from 'fs';
import path from 'path';

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const OUTPUT_DIR = path.join(process.cwd(), 'client/public/images/generated-review');
const MODEL = 'gemini-3-pro-image-preview';

const images = [
  // Missing bestfor collages
  {
    slug: 'propagrow',
    filename: 'propagrow-bestfor.jpg',
    prompt: 'Create a professional 2x2 photo grid collage with 4 equal panels separated by thin white borders. Each panel has a bold white title bar at the bottom with thick readable text. Panel 1 labeled "PROPAGATION" shows plant cuttings being placed into dark propagation medium in trays. Panel 2 labeled "CUTTING ROOTING" shows close-up of healthy white roots forming on stem cuttings in growing medium. Panel 3 labeled "GREENHOUSE" shows a professional greenhouse with rows of propagation trays and young plants. Panel 4 labeled "HEALTHY STARTS" shows strong healthy rooted cuttings ready for transplanting. All photos are photorealistic, soft natural lighting, greenhouse nursery setting, editorial quality. No watermarks, no logos, no deformities, no AI artifacts.',
  },
  {
    slug: 'natures-blanket-premium',
    filename: 'natures-blanket-premium-bestfor.jpg',
    prompt: 'Create a professional 2x2 photo grid collage with 4 equal panels separated by thin white borders. Each panel has a bold white title bar at the bottom with thick readable text. Panel 1 labeled "PREMIUM MULCHING" shows fine dark premium mulch being spread in a high-end commercial landscape. Panel 2 labeled "COMMERCIAL PROPERTIES" shows a beautiful commercial building entrance with pristine mulched plant beds. Panel 3 labeled "GARDEN SHOWCASE" shows an immaculate showcase garden with premium dark mulch around ornamental plants. Panel 4 labeled "CURB APPEAL" shows a luxury residential landscape with manicured mulched beds. All photos are photorealistic, warm golden lighting, upscale commercial setting, editorial quality. No watermarks, no logos, no deformities, no AI artifacts.',
  },
  {
    slug: 'skmicrosource',
    filename: 'skmicrosource-bestfor.jpg',
    prompt: 'Create a professional 2x2 photo grid collage with 4 equal panels separated by thin white borders. Each panel has a bold white title bar at the bottom with thick readable text. Panel 1 labeled "pH CORRECTION" shows granular mineral amendment being mixed into alkaline desert soil. Panel 2 labeled "POTASSIUM BOOST" shows healthy fruiting plants growing in mineral-enriched soil. Panel 3 labeled "ACID-LOVING PLANTS" shows vibrant blueberry bushes and azaleas thriving in amended soil. Panel 4 labeled "SOIL SCIENCE" shows a close-up of dark amended soil with visible mineral particles. All photos are photorealistic, warm natural lighting, garden and farm setting, editorial quality. No watermarks, no logos, no deformities, no AI artifacts.',
  },
  // Missing lifestyle images
  {
    slug: 'propagrow',
    filename: 'propagrow-lifestyle.jpg',
    prompt: 'Professional photo of plant propagation in a greenhouse, stem cuttings rooting in dark growing medium trays, healthy new growth visible, professional nursery setting, rows of propagation trays, soft natural morning light, editorial quality photography, no text or logos',
  },
  {
    slug: 'natures-blanket-premium',
    filename: 'natures-blanket-premium-lifestyle.jpg',
    prompt: 'Professional photo of premium dark organic mulch freshly applied around ornamental plants and trees at a luxury commercial property entrance, clean manicured landscaping, warm golden hour light, editorial quality photography, no text or logos',
  },
  {
    slug: 'skmicrosource',
    filename: 'skmicrosource-lifestyle.jpg',
    prompt: 'Professional photo of healthy blueberry bushes and acid-loving plants thriving in mineral-amended soil, granular mineral amendment visible on soil surface, lush green growth with ripe berries, warm natural lighting, garden setting, editorial quality photography, no text or logos',
  },
  {
    slug: 'superbooster',
    filename: 'superbooster-lifestyle.jpg',
    prompt: 'Professional photo of a thriving organic vegetable garden and fruit trees with concentrated organic amendment being applied to soil, healthy abundant produce, rich dark enriched soil visible, warm golden hour natural lighting, editorial quality photography, no text or logos',
  },
];

async function generateImage(img) {
  console.log(`Generating: ${img.filename}...`);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_KEY}`;
  const body = {
    contents: [{ parts: [{ text: img.prompt }] }],
    generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
  };

  try {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    if (data.error) { console.log(`  ERROR: ${data.error.message}`); return false; }

    for (const candidate of (data.candidates || [])) {
      for (const part of (candidate.content?.parts || [])) {
        if (part.inlineData) {
          const filepath = path.join(OUTPUT_DIR, img.filename);
          fs.writeFileSync(filepath, Buffer.from(part.inlineData.data, 'base64'));
          console.log(`  Saved: ${img.filename} (${Math.round(fs.statSync(filepath).size / 1024)}KB)`);
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
for (const img of images) {
  const ok = await generateImage(img);
  if (ok) success++;
  await new Promise(r => setTimeout(r, 3000));
}
console.log(`\nDone: ${success}/${images.length}`);
