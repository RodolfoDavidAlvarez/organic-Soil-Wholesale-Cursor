import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';

const IMAGE_DIR = path.join(process.cwd(), 'client/public/images/generated-review');
const OPTIMIZED_DIR = path.join(process.cwd(), 'client/public/images/bestfor');

const sb = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// All product slugs (used for DB lookup by slug)
const validSlugs = [
  'simons-gold', 'mikeys-worm-poop', 'artemis-root-boost-blend',
  'tee-top-divot-repair-blend', 'turf-daddy-blend', 'oasis-blend',
  'bacchus-blend', 'seriokais-secret-blend', 'pomona-blend',
  'stoned-apes-blend', 'desert-defender', 'amazonian-dark-earth',
  'soil-craft', 'plugboost', 'plantpal', 'natures-blanket',
  'natures-blanket-premium', 'superbooster', 'cultivators-rose-blend',
  'zeolite', 'propagrow', 'skmicrosource',
];

async function run() {
  // Create optimized directory
  if (!fs.existsSync(OPTIMIZED_DIR)) {
    fs.mkdirSync(OPTIMIZED_DIR, { recursive: true });
  }

  // Find all bestfor images
  const files = fs.readdirSync(IMAGE_DIR).filter(f => f.includes('-bestfor.'));
  console.log(`Found ${files.length} bestfor images to optimize\n`);

  for (const file of files) {
    const slug = file.replace(/-bestfor\.(jpg|png)$/, '');
    const inputPath = path.join(IMAGE_DIR, file);
    const outputFile = `${slug}-bestfor.jpg`;
    const outputPath = path.join(OPTIMIZED_DIR, outputFile);

    // Optimize with sharp: resize to 1200px wide, quality 80, progressive JPEG
    const inputSize = Math.round(fs.statSync(inputPath).size / 1024);
    await sharp(inputPath)
      .resize(1200, null, { withoutEnlargement: true })
      .jpeg({ quality: 80, progressive: true })
      .toFile(outputPath);
    const outputSize = Math.round(fs.statSync(outputPath).size / 1024);

    console.log(`${slug}: ${inputSize}KB -> ${outputSize}KB (${Math.round((1 - outputSize/inputSize) * 100)}% smaller)`);

    // Update DB by slug (avoids duplicate name issues)
    if (validSlugs.includes(slug)) {
      const { data: product } = await sb
        .from('products')
        .select('id, name, additional_images')
        .eq('slug', slug)
        .single();

      if (product) {
        const imagePath = `${outputFile}`;
        const existing = product.additional_images || [];
        // Remove any old bestfor images and add new one
        const cleaned = existing.filter(img => !img.includes('-bestfor'));
        cleaned.push(imagePath);

        await sb
          .from('products')
          .update({ additional_images: cleaned })
          .eq('id', product.id);

        console.log(`  DB updated: ${product.name} (${cleaned.length} images)`);
      } else {
        console.log(`  NOT FOUND in DB: ${slug}`);
      }
    } else {
      console.log(`  Unknown slug: ${slug}`);
    }
  }

  console.log('\nDone!');
}

run().catch(console.error);
