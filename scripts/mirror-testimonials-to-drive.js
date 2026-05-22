#!/usr/bin/env node
/**
 * Mirror approved testimonial videos to SSW Drive (SSW Testimonials 2026 folder).
 * Idempotent — only mirrors media rows where drive_file_id IS NULL.
 *
 * Usage:
 *   cd ~/Documents/Soil\ Seed\ and\ Water/Organic\ Soil\ Wholesale/Organic\ Soil\ Wholesale\ Website
 *   node scripts/mirror-testimonials-to-drive.js                # mirror all pending
 *   node scripts/mirror-testimonials-to-drive.js --id <uuid>    # mirror just this testimonial
 *
 * Requires: ~/.soilseed-mcp/drive-api.js (SSW Drive helper, full drive scope)
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';
import { writeFileSync, mkdirSync, unlinkSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const SSW_TESTIMONIALS_FOLDER_ID = '1EHNPtAwK9iScBS1DLSghRSmto03DLlEC';
const DRIVE_API = '/Users/rodolfoalvarez/.soilseed-mcp/drive-api.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const args = process.argv.slice(2);
const targetId = args.indexOf('--id') >= 0 ? args[args.indexOf('--id') + 1] : null;

async function fetchPending() {
  let q = supabase
    .from('testimonial_media')
    .select(`
      id, testimonial_id, storage_path, mime_type, size_bytes,
      testimonials!inner ( id, client_name, client_city, product_or_service, submitted_by_name, created_at )
    `)
    .is('drive_file_id', null)
    .eq('upload_status', 'uploaded');
  if (targetId) q = q.eq('testimonial_id', targetId);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

function buildFilename(media) {
  const t = media.testimonials;
  const date = new Date(t.created_at).toISOString().slice(0, 10);
  const parts = [date];
  if (t.client_name) parts.push(t.client_name.replace(/[^a-zA-Z0-9]+/g, '-'));
  if (t.client_city) parts.push(t.client_city.replace(/[^a-zA-Z0-9]+/g, '-'));
  if (t.product_or_service) parts.push(t.product_or_service.replace(/[^a-zA-Z0-9]+/g, '-').slice(0, 30));
  const base = parts.join('_').replace(/_+/g, '_').replace(/-+/g, '-');
  const orig = media.storage_path.split('/').pop();
  const ext = orig.includes('.') ? orig.slice(orig.lastIndexOf('.')) : '.mp4';
  return `${base}${ext}`;
}

async function downloadFromStorage(storagePath) {
  const tmp = join(tmpdir(), 'ssw-testimonials');
  if (!existsSync(tmp)) mkdirSync(tmp, { recursive: true });
  const { data, error } = await supabase.storage.from('testimonials').download(storagePath);
  if (error) throw error;
  const localPath = join(tmp, storagePath.replace(/[\/\\]/g, '_'));
  const buf = Buffer.from(await data.arrayBuffer());
  writeFileSync(localPath, buf);
  return localPath;
}

function uploadToDrive(localPath, title) {
  const cmd = `node "${DRIVE_API}" upload "${localPath}" "${SSW_TESTIMONIALS_FOLDER_ID}" "${title}"`;
  const out = execSync(cmd, { encoding: 'utf8' });
  return JSON.parse(out);
}

async function main() {
  const pending = await fetchPending();
  console.log(`Found ${pending.length} media to mirror.`);
  for (const m of pending) {
    try {
      const title = buildFilename(m);
      console.log(`→ ${title}`);
      const localPath = await downloadFromStorage(m.storage_path);
      const uploaded = uploadToDrive(localPath, title);
      const { error } = await supabase
        .from('testimonial_media')
        .update({
          drive_file_id: uploaded.id,
          drive_view_url: uploaded.webViewLink,
        })
        .eq('id', m.id);
      if (error) throw error;
      try { unlinkSync(localPath); } catch {}
      console.log(`  ✓ ${uploaded.webViewLink}`);
    } catch (e) {
      console.error(`  ✗ ${m.id}: ${e.message}`);
    }
  }
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
