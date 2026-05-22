import 'dotenv/config';
import fs from 'fs';
import path from 'path';

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const OUTPUT_DIR = path.join(process.cwd(), 'client/public/images/generated-review');

const products = [
  {
    slug: 'pomona-blend',
    id: 1008,
    name: 'Pomona Blend',
    prompt: 'Professional photo of a thriving pomegranate tree orchard in Arizona desert landscape, golden hour sunlight, healthy green leaves with ripe red pomegranates, rich dark amended soil visible at the base of the trees, agricultural setting, warm tones, shallow depth of field, editorial quality photography, no text or logos',
  },
  {
    slug: 'bacchus-blend',
    id: 1006,
    name: 'Bacchus Blend',
    prompt: 'Professional photo of a lush vineyard with rows of grapevines heavy with purple grapes, rich dark soil between rows showing organic soil amendment applied, Arizona or Southwest wine country landscape, golden hour warm lighting, editorial quality agricultural photography, no text or logos',
  },
  {
    slug: 'turf-daddy-blend',
    id: 1004,
    name: 'Turf Daddy Blend',
    prompt: 'Professional photo of a perfectly manicured green lawn at a golf course or sports field, vibrant emerald grass with crisp mowing lines, close-up angle showing the thick healthy turf texture, Arizona landscape in background, warm natural lighting, editorial quality photography, no text or logos',
  },
  {
    slug: 'oasis-blend',
    id: 1010,
    name: 'Oasis Blend',
    prompt: 'Professional photo of tall healthy palm trees and date palms thriving in an Arizona desert oasis setting, rich dark amended soil visible around the base, blue sky background, lush green fronds, warm desert golden hour lighting, editorial quality photography, no text or logos',
  },
  {
    slug: 'artemis-root-boost-blend',
    id: 1005,
    name: 'Artemis Root Boost Blend',
    prompt: 'Professional photo of healthy mature trees and ornamental shrubs in a landscaped Arizona yard, strong trunk with lush canopy, rich dark amended soil visible around root zone, mulch ring around base, warm natural lighting, editorial quality landscape photography, no text or logos',
  },
];

async function generateImage(product) {
  console.log(`Generating: ${product.name}...`);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_KEY}`;

  const body = {
    contents: [{
      parts: [{
        text: product.prompt
      }]
    }],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
    }
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (data.error) {
      console.log(`  ERROR: ${data.error.message}`);
      return false;
    }

    // Find the image part in the response
    const candidates = data.candidates || [];
    for (const candidate of candidates) {
      const parts = candidate.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData) {
          const imageData = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || 'image/png';
          const ext = mimeType.includes('jpeg') ? 'jpg' : 'png';
          const filename = `${product.slug}-lifestyle.${ext}`;
          const filepath = path.join(OUTPUT_DIR, filename);

          fs.writeFileSync(filepath, Buffer.from(imageData, 'base64'));
          const stats = fs.statSync(filepath);
          console.log(`  Saved: ${filename} (${Math.round(stats.size / 1024)}KB)`);
          return true;
        }
      }
    }

    console.log(`  No image in response. Keys:`, Object.keys(data));
    if (data.candidates?.[0]?.content?.parts) {
      console.log(`  Parts:`, data.candidates[0].content.parts.map(p => Object.keys(p)));
    }
    return false;
  } catch (err) {
    console.log(`  FETCH ERROR: ${err.message}`);
    return false;
  }
}

console.log('=== Generating Product Lifestyle Images ===');
console.log(`Output: ${OUTPUT_DIR}\n`);

let success = 0;
for (const product of products) {
  const ok = await generateImage(product);
  if (ok) success++;
  // Small delay between requests
  await new Promise(r => setTimeout(r, 2000));
}

console.log(`\nDone: ${success}/${products.length} images generated`);
console.log(`Review them at: ${OUTPUT_DIR}`);
