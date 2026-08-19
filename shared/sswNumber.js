import { randomBytes } from 'node:crypto';

export const SSW_NUMBER_PREFIX = 'SSW-';
export const SSW_FIRST_DIGIT_ALPHABET = '23456789';
export const SSW_DIGIT_ALPHABET = '0123456789';
export const SSW_NUMBER_DIGIT_COUNT = 6;
export const SSW_NUMBER_RE = /^SSW-[2-9]\d{2}-\d{3}$/;
export const SSW_LEGACY_NUMBER_RE = /^SSW-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$/;

function digitsFromLookup(value) {
  const raw = String(value || '').trim().toUpperCase();
  if (!raw) return '';
  const withoutPrefix = raw.replace(/^SSW[\s-]*/, '');
  return withoutPrefix.replace(/\D/g, '');
}

export function formatSswNumber(digits) {
  const body = String(digits || '').replace(/\D/g, '');
  if (body.length !== SSW_NUMBER_DIGIT_COUNT) return null;
  return `${SSW_NUMBER_PREFIX}${body.slice(0, 3)}-${body.slice(3)}`;
}

export function generateSswNumber(bytes = randomBytes(SSW_NUMBER_DIGIT_COUNT)) {
  let body = SSW_FIRST_DIGIT_ALPHABET[bytes[0] % SSW_FIRST_DIGIT_ALPHABET.length];
  for (let i = 1; i < SSW_NUMBER_DIGIT_COUNT; i += 1) {
    body += SSW_DIGIT_ALPHABET[bytes[i] % SSW_DIGIT_ALPHABET.length];
  }
  return formatSswNumber(body);
}

export function isSswNumber(value) {
  return Boolean(normalizeSswNumber(value));
}

export function normalizeSswNumber(value) {
  const formatted = formatSswNumber(digitsFromLookup(value));
  return formatted && SSW_NUMBER_RE.test(formatted) ? formatted : null;
}

export function normalizeLegacySswNumber(value) {
  const raw = String(value || '').trim().toUpperCase();
  return SSW_LEGACY_NUMBER_RE.test(raw) ? raw : null;
}

export async function findCustomerBySswLookup(db, value) {
  const canonical = normalizeSswNumber(value);
  const legacy = normalizeLegacySswNumber(value);
  if (!canonical && !legacy) return null;

  const filters = [];
  if (canonical) filters.push(`ssw_number.eq.${canonical}`);
  if (legacy) filters.push(`ssw_number_alias.eq.${legacy}`);

  const lookup = await db
    .from('sp_customers')
    .select('id, full_name, email, phone, ssw_number, ssw_number_alias')
    .or(filters.join(','))
    .maybeSingle();
  if (lookup.error) throw lookup.error;
  return lookup.data || null;
}

export async function ensureSswNumber(db, customer, generate = generateSswNumber) {
  const existing = normalizeSswNumber(customer?.ssw_number);
  if (existing) return existing;
  if (!customer?.id) throw new Error('Customer is required to assign a number');

  const legacy = normalizeLegacySswNumber(customer?.ssw_number);

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const number = generate();
    const patch = { ssw_number: number, updated_at: new Date().toISOString() };
    if (legacy && !customer?.ssw_number_alias) patch.ssw_number_alias = legacy;

    let query = db.from('sp_customers').update(patch).eq('id', customer.id);
    query = legacy ? query.eq('ssw_number', customer.ssw_number) : query.is('ssw_number', null);

    const assigned = await query.select('ssw_number').maybeSingle();
    if (assigned.error && assigned.error.code === '23505') continue;
    if (assigned.error) throw assigned.error;
    if (normalizeSswNumber(assigned.data?.ssw_number)) return assigned.data.ssw_number;

    const fresh = await db
      .from('sp_customers')
      .select('ssw_number, ssw_number_alias')
      .eq('id', customer.id)
      .maybeSingle();
    if (fresh.error) throw fresh.error;
    if (normalizeSswNumber(fresh.data?.ssw_number)) return fresh.data.ssw_number;
    if (fresh.data?.ssw_number && fresh.data.ssw_number !== customer.ssw_number) {
      customer = { ...customer, ...fresh.data };
    }
  }

  throw new Error('Could not assign a customer number');
}

export async function assignSswNumberForPurchase(db, { email, name, phone } = {}) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes('@')) return null;

  const { data: existing, error: lookupError } = await db
    .from('sp_customers')
    .select('id, ssw_number, ssw_number_alias, full_name, email')
    .ilike('email', normalizedEmail)
    .maybeSingle();
  if (lookupError) throw lookupError;

  if (existing) {
    const customerNumber = await ensureSswNumber(db, existing);
    return { customerId: existing.id, customerNumber, created: false };
  }

  const now = new Date().toISOString();
  const { data: created, error: insertError } = await db
    .from('sp_customers')
    .insert({
      full_name: String(name || '').trim() || normalizedEmail.split('@')[0],
      email: normalizedEmail,
      phone: String(phone || '').trim() || null,
      source: 'osw_checkout',
      stage: 'active',
      newsletter_subscribed: false,
      created_at: now,
      updated_at: now,
    })
    .select('id, ssw_number, ssw_number_alias, full_name, email')
    .single();

  if (insertError?.code === '23505') {
    const raced = await db
      .from('sp_customers')
      .select('id, ssw_number, ssw_number_alias, full_name, email')
      .ilike('email', normalizedEmail)
      .maybeSingle();
    if (raced.error) throw raced.error;
    if (!raced.data) throw insertError;
    const customerNumber = await ensureSswNumber(db, raced.data);
    return { customerId: raced.data.id, customerNumber, created: false };
  }
  if (insertError) throw insertError;

  const customerNumber = await ensureSswNumber(db, created);
  return { customerId: created.id, customerNumber, created: true };
}
