/**
 * Compress Garden Refresh flyer PNGs into WebP for homepage cards (~800px)
 * and offer landing heroes (~1200px). Re-run after swapping source PNGs.
 *
 *   node scripts/optimize-offer-flyers.mjs
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const OFFER_DIR = path.join(process.cwd(), "client/public/images/offers");
const SLUGS = ["garden-refresh", "garden-refresh-plus", "big-garden-setup"];

const VARIANTS = [
  { suffix: "800", width: 800, quality: 78 },
  { suffix: "1200", width: 1200, quality: 80 },
];

async function convertOne(slug) {
  const inputPath = path.join(OFFER_DIR, `${slug}.png`);
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Missing source flyer: ${inputPath}`);
  }
  const inputKb = Math.round(fs.statSync(inputPath).size / 1024);
  const meta = await sharp(inputPath).metadata();
  console.log(`${slug}.png  ${meta.width}x${meta.height}  ${inputKb}KB`);

  for (const variant of VARIANTS) {
    const outputPath = path.join(OFFER_DIR, `${slug}-${variant.suffix}.webp`);
    await sharp(inputPath)
      .resize(variant.width, null, { withoutEnlargement: true })
      .webp({ quality: variant.quality, effort: 6 })
      .toFile(outputPath);
    const outputKb = Math.round(fs.statSync(outputPath).size / 1024);
    const outMeta = await sharp(outputPath).metadata();
    console.log(
      `  -> ${path.basename(outputPath)}  ${outMeta.width}x${outMeta.height}  ${outputKb}KB  (${Math.round((1 - outputKb / inputKb) * 100)}% smaller)`,
    );
  }
}

const slugs = process.argv.slice(2).length ? process.argv.slice(2) : SLUGS;
for (const slug of slugs) {
  await convertOne(slug);
}
