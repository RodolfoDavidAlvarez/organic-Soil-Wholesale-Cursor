import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const ignoredDirectories = new Set([
  '.git',
  '.vercel',
  'coverage',
  'dist',
  'node_modules',
]);

const walkRepository = (directory = '.') => readdirSync(directory, { withFileTypes: true })
  .flatMap((entry) => {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return ignoredDirectories.has(entry.name) ? [] : walkRepository(file);
    }
    return entry.isFile() ? [file.replace(/^\.\//, '')] : [];
  });

let trackedFiles;
try {
  trackedFiles = execFileSync('git', [
    'ls-files',
    '-z',
    '--cached',
    '--others',
    '--exclude-standard',
  ])
    .toString('utf8')
    .split('\0')
    .filter(Boolean);
} catch {
  trackedFiles = walkRepository();
}

const violations = [];
const literalServiceKeyFallback = /SUPABASE_SERVICE_ROLE_KEY\s*\|\|\s*['"`][^'"`]+['"`]/;
const literalJwtSecretFallback = /JWT_SECRET\s*\|\|\s*['"`][^'"`]+['"`]/;
const hardcodedPasswordComparison = /\bpassword\s*===\s*['"`][^'"`]+['"`]/i;
const hardcodedPasswordConstant = /(?:const|let|var)\s+(?:admin)?password\s*=\s*['"`][^'"`]+['"`]/i;
const hardcodedPasswordField = /\bpassword\s*:\s*['"`][^'"`]+['"`]/i;
const hardcodedAdminIdentity = /(?:decoded|admin|req\.admin)\.id\s*===\s*['"`](?:ops-user|super-admin)['"`]/;
const modernSupabaseSecret = /\bsb_secret_[A-Za-z0-9_-]{20,}\b/;
const jwtPattern = /\beyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g;
const sourceFile = /\.(?:cjs|js|mjs|ts|tsx)$/i;

for (const file of trackedFiles) {
  const contents = readFileSync(file);
  if (contents.includes(0)) continue;

  const source = contents.toString('utf8');

  if (literalServiceKeyFallback.test(source)) {
    violations.push(`${file}: literal SUPABASE_SERVICE_ROLE_KEY fallback`);
  }

  if (literalJwtSecretFallback.test(source)) {
    violations.push(`${file}: literal JWT_SECRET fallback`);
  }

  if (modernSupabaseSecret.test(source)) {
    violations.push(`${file}: embedded Supabase secret key`);
  }

  if (sourceFile.test(file) && contents.length < 1_000_000) {
    if (hardcodedPasswordComparison.test(source)) {
      violations.push(`${file}: hardcoded password comparison`);
    }
    if (hardcodedPasswordConstant.test(source)) {
      violations.push(`${file}: hardcoded password constant`);
    }
    if (hardcodedPasswordField.test(source)) {
      violations.push(`${file}: hardcoded password field`);
    }
    if (hardcodedAdminIdentity.test(source)) {
      violations.push(`${file}: hardcoded admin identity bypass`);
    }
  }

  for (const jwt of source.matchAll(jwtPattern)) {
    try {
      const payload = JSON.parse(Buffer.from(jwt[0].split('.')[1], 'base64url').toString('utf8'));
      if (payload.role === 'service_role') {
        violations.push(`${file}: embedded Supabase service-role JWT`);
      }
    } catch {
      // Ignore strings that merely resemble JWTs.
    }
  }
}

assert.deepEqual(
  violations,
  [],
  `Tracked service-role secrets found:\n${violations.join('\n')}`,
);

console.log(`Security config check passed across ${trackedFiles.length} repository files.`);
