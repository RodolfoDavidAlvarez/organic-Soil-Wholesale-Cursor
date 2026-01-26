const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const INPUT_DIR = './client/public/product-illustrations';
const OUTPUT_DIR = './client/public/product-illustrations';
const MAX_WIDTH = 400; // Max width for work order illustrations

async function compressImages() {
  const files = fs.readdirSync(INPUT_DIR).filter(f => f.endsWith('.png') && f !== 'product-map.json');

  console.log(`Compressing ${files.length} images...`);

  let totalOriginal = 0;
  let totalCompressed = 0;

  for (const file of files) {
    const inputPath = path.join(INPUT_DIR, file);
    const outputPath = path.join(OUTPUT_DIR, file.replace('.png', '-small.webp'));

    const originalSize = fs.statSync(inputPath).size;
    totalOriginal += originalSize;

    try {
      await sharp(inputPath)
        .resize(MAX_WIDTH, MAX_WIDTH, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(outputPath);

      const newSize = fs.statSync(outputPath).size;
      totalCompressed += newSize;

      const savings = ((originalSize - newSize) / originalSize * 100).toFixed(1);
      console.log(`  ${file} -> ${file.replace('.png', '-small.webp')} (${(newSize/1024).toFixed(0)}KB, -${savings}%)`);
    } catch (err) {
      console.error(`  Failed: ${file}`, err.message);
    }
  }

  console.log(`\nTotal: ${(totalOriginal/1024/1024).toFixed(1)}MB -> ${(totalCompressed/1024/1024).toFixed(1)}MB`);
  console.log(`Savings: ${((totalOriginal - totalCompressed) / totalOriginal * 100).toFixed(1)}%`);
}

compressImages().catch(console.error);
