import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const manifest = JSON.parse(readFileSync(resolve(root, 'docs/specsheet-manifest.json'), 'utf8'));
const publicRoot = resolve(root, 'client/public');
const hash = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');
if (hash(resolve(publicRoot, manifest.publicPath)) !== manifest.sha256) throw new Error('PlantPal PDF differs from reviewed master. Review the replacement and update docs/specsheet-manifest.json.');
function scan(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) scan(path);
    else if (/\.pdf$/i.test(entry.name) && (manifest.retiredSha256.includes(hash(path)) || /outdated|do-not-use/i.test(entry.name))) throw new Error(`Outdated PDF in public assets: ${path}`);
  }
}
scan(publicRoot);
console.log('Spec-sheet gate passed: approved PlantPal master; no retired PDFs in public assets.');
