import { randomBytes } from 'node:crypto';

export const SSW_NUMBER_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
export const SSW_NUMBER_PREFIX = 'SSW-';
export const SSW_NUMBER_LENGTH = 4;
export const SSW_NUMBER_RE = /^SSW-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$/;

export function generateSswNumber(bytes = randomBytes(SSW_NUMBER_LENGTH)) {
  let body = '';
  for (let i = 0; i < SSW_NUMBER_LENGTH; i += 1) {
    body += SSW_NUMBER_ALPHABET[bytes[i] % SSW_NUMBER_ALPHABET.length];
  }
  return `${SSW_NUMBER_PREFIX}${body}`;
}

export function isSswNumber(value) {
  return SSW_NUMBER_RE.test(String(value || '').trim().toUpperCase());
}

export function normalizeSswNumber(value) {
  const raw = String(value || '').trim().toUpperCase();
  return isSswNumber(raw) ? raw : null;
}

export async function ensureSswNumber(db, customer, generate = generateSswNumber) {
  const existing = normalizeSswNumber(customer?.ssw_number);
  if (existing) return existing;
  if (!customer?.id) throw new Error('Customer is required to assign a number');

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const number = generate();
    const assigned = await db
      .from('sp_customers')
      .update({ ssw_number: number, updated_at: new Date().toISOString() })
      .eq('id', customer.id)
      .is('ssw_number', null)
      .select('ssw_number')
      .maybeSingle();

    if (assigned.error && assigned.error.code === '23505') continue;
    if (assigned.error) throw assigned.error;
    if (normalizeSswNumber(assigned.data?.ssw_number)) return assigned.data.ssw_number;

    const fresh = await db
      .from('sp_customers')
      .select('ssw_number')
      .eq('id', customer.id)
      .maybeSingle();
    if (fresh.error) throw fresh.error;
    if (normalizeSswNumber(fresh.data?.ssw_number)) return fresh.data.ssw_number;
  }

  throw new Error('Could not assign a customer number');
}
