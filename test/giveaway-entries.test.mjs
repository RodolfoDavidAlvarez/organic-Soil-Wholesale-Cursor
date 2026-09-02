import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  GIVEAWAY_CAMPAIGN_KEY,
  GIVEAWAY_CUSTOMER_TYPES,
  GIVEAWAY_ENTRIES_CLOSED_MESSAGE,
  GIVEAWAY_FOLLOW_COPY,
  GIVEAWAY_GROWING_OPTIONS,
  GIVEAWAY_SOCIAL_CHANNELS,
  GIVEAWAY_SOURCE,
  areGiveawayEntriesOpen,
  giveawayEntryRow,
  processGiveawayEntry,
  saveGiveawayEntry,
  validateGiveawayEntry,
} from '../shared/giveawayEntries.js';

const validBody = {
  fullName: 'Jordan Grower',
  email: 'jordan@example.com',
  phone: '(623) 555-0199',
  zipCode: '85009',
  customerTypes: ['homeowner', 'specialty-farmer'],
  gardenStatus: 'brand-new',
  growing: ['food-garden', 'citrus-avocado'],
  growingOther: 'figs',
  notes: 'South-facing beds',
  emailConsent: true,
  rulesConsent: true,
  followed: { ig: true, fb: false, yt: false },
  source: 'win-giveaway',
  website: '',
  attributionSource: 'instagram-bio',
  utmSource: 'instagram',
  utmMedium: 'organic_social',
  utmCampaign: 'september_garden_giveaway_2026',
  utmContent: 'big_garden_giveaway',
};

function createGiveawayDb({ existing = null, failInsert = false } = {}) {
  const inserts = [];
  return {
    inserts,
    from(table) {
      assert.equal(table, 'sp_giveaway_entries');
      const state = { op: 'select', filters: {}, payload: null };
      const api = {
        select() { return api; },
        eq(col, val) { state.filters[col] = val; return api; },
        insert(row) {
          state.op = 'insert';
          state.payload = row;
          inserts.push(row);
          return api;
        },
        maybeSingle: async () => ({ data: existing, error: null }),
        single: async () => {
          if (failInsert) return { data: null, error: { message: 'insert failed' } };
          return { data: { id: 'entry-1', created_at: '2026-09-01T00:00:00.000Z' }, error: null };
        },
      };
      return api;
    },
  };
}

test('giveaway questions match the /win spec and reject incomplete entries', () => {
  assert.deepEqual(GIVEAWAY_CUSTOMER_TYPES.map(([, label]) => label), [
    'Homeowner',
    'Landscaper',
    'Farmer / agriculture',
    'Garden professional',
  ]);
  assert.deepEqual(GIVEAWAY_GROWING_OPTIONS.map(([, label]) => label), [
    'Food garden',
    'Turf/grass',
    'Ornamentals',
    'Trees',
    'Citrus/avocado',
    'Palms',
    'Roses',
    'Succulents',
    'Indoor plants',
  ]);
  assert.equal(validateGiveawayEntry(validBody).ok, true);
  assert.equal(validateGiveawayEntry({ ...validBody, fullName: 'J' }).ok, false);
  assert.equal(validateGiveawayEntry({ ...validBody, zipCode: '8500' }).ok, false);
  assert.equal(validateGiveawayEntry({ ...validBody, customerTypes: ['home-gardener'] }).ok, false);
  assert.equal(validateGiveawayEntry({ ...validBody, growing: [] }).ok, false);
  assert.equal(validateGiveawayEntry({ ...validBody, emailConsent: false }).ok, false);
  assert.equal(validateGiveawayEntry({ ...validBody, rulesConsent: false }).ok, false);
  assert.equal(validateGiveawayEntry({ ...validBody, followed: { ig: false, fb: false, yt: false } }).ok, false);
  assert.equal(validateGiveawayEntry({ ...validBody, website: 'https://spam.test' }).bot, true);
});

test('social follow URLs and copy match the approved channels', () => {
  assert.equal(GIVEAWAY_FOLLOW_COPY, 'Follow at least one account — tap Follow, then check the box.');
  assert.deepEqual(GIVEAWAY_SOCIAL_CHANNELS.map((channel) => [channel.key, channel.url]), [
    ['ig', 'https://www.instagram.com/soilseedandwater/'],
    ['fb', 'https://www.facebook.com/soilseedandwater'],
    ['yt', 'https://www.youtube.com/@soilseedwater'],
  ]);
});

test('GIVEAWAY_ENTRIES_OPEN defaults open; only an explicit false closes it', () => {
  assert.equal(areGiveawayEntriesOpen({}), true);
  assert.equal(areGiveawayEntriesOpen({ GIVEAWAY_ENTRIES_OPEN: '' }), true);
  assert.equal(areGiveawayEntriesOpen({ GIVEAWAY_ENTRIES_OPEN: 'true' }), true);
  assert.equal(areGiveawayEntriesOpen({ GIVEAWAY_ENTRIES_OPEN: 'false' }), false);
});

test('closed flag rejects before any database write', async () => {
  const db = createGiveawayDb();
  const result = await processGiveawayEntry({
    db,
    body: validBody,
    env: { GIVEAWAY_ENTRIES_OPEN: 'false' },
  });
  assert.equal(result.status, 403);
  assert.equal(result.json.error, GIVEAWAY_ENTRIES_CLOSED_MESSAGE);
  assert.equal(result.json.entriesOpen, false);
  assert.equal(db.inserts.length, 0);
});

test('honeypot succeeds without saving even when entries are open', async () => {
  const db = createGiveawayDb();
  const result = await processGiveawayEntry({
    db,
    body: { ...validBody, website: 'https://bot.test' },
  });
  assert.equal(result.status, 200);
  assert.equal(result.json.success, true);
  assert.equal(db.inserts.length, 0);
});

test('unset env saves a live win-giveaway row with follow flags', async () => {
  const db = createGiveawayDb();
  const result = await processGiveawayEntry({
    db,
    body: validBody,
    now: new Date('2026-09-01T12:00:00.000Z'),
  });
  assert.equal(result.status, 201);
  assert.equal(result.json.success, true);
  assert.equal(result.json.alreadyEntered, false);
  assert.equal(db.inserts.length, 1);
  assert.equal(db.inserts[0].source, GIVEAWAY_SOURCE);
  assert.equal(db.inserts[0].campaign_key, GIVEAWAY_CAMPAIGN_KEY);
  assert.equal(db.inserts[0].is_preview, false);
  assert.equal(db.inserts[0].followed_ig, true);
  assert.equal(db.inserts[0].followed_tt, false);
  assert.equal(db.inserts[0].customer_type, 'homeowner');
  assert.match(db.inserts[0].notes, /Customer types: homeowner, specialty-farmer/);
  assert.equal(db.inserts[0].email_normalized, 'jordan@example.com');
  assert.equal(db.inserts[0].attribution_source, 'instagram-bio');
  assert.equal(db.inserts[0].utm_source, 'instagram');
  assert.equal(db.inserts[0].utm_medium, 'organic_social');
  assert.equal(db.inserts[0].utm_campaign, 'september_garden_giveaway_2026');
  assert.equal(db.inserts[0].utm_content, 'big_garden_giveaway');
});

test('one live entry per email does not insert a second row', async () => {
  const db = createGiveawayDb({ existing: { id: 'already', created_at: '2026-08-01T00:00:00.000Z' } });
  const saved = await saveGiveawayEntry({
    db,
    entry: validateGiveawayEntry(validBody).entry,
  });
  assert.equal(saved.created, false);
  assert.equal(db.inserts.length, 0);
});

test('live row helper never marks preview true', () => {
  const row = giveawayEntryRow(validateGiveawayEntry(validBody).entry);
  assert.equal(row.is_preview, false);
  assert.equal(row.source, 'win-giveaway');
});

test('/win is live-ready: no draft framing, working Enter to win, form and follows kept', async () => {
  const page = await readFile(new URL('../client/src/pages/BigGardenGiveaway.tsx', import.meta.url), 'utf8');
  const config = await readFile(new URL('../client/src/config/giveawayDraft.ts', import.meta.url), 'utf8');
  const shared = await readFile(new URL('../shared/giveawayEntries.js', import.meta.url), 'utf8');
  const app = await readFile(new URL('../client/src/App.tsx', import.meta.url), 'utf8');
  const api = await readFile(new URL('../api/index.js', import.meta.url), 'utf8');
  const serverRoutes = await readFile(new URL('../server/routes/index.ts', import.meta.url), 'utf8');
  const migration = await readFile(new URL('../supabase/migrations/20260901_giveaway_entries.sql', import.meta.url), 'utf8');
  const envExample = await readFile(new URL('../.env.example', import.meta.url), 'utf8');
  const offers = await readFile(new URL('../shared/promoBundles.js', import.meta.url), 'utf8');
  const worm = await readFile(new URL('../shared/wormCastingsCampaign.js', import.meta.url), 'utf8');

  assert.match(app, /path="\/win" component=\{BigGardenGiveaway\}/);
  assert.match(config, /acceptingEntries: true/);
  assert.match(config, /cta: "Sign up in 30 seconds"/);
  assert.match(config, /September is bigger than August/);
  assert.match(config, /Raised-Bed Starter Garden/);
  assert.match(config, /Full Pallet of Planting Soil/);
  assert.match(config, /phoenix-september-garden-prize-web\.mp4/);
  assert.match(config, /phoenix-september-garden-prize-email-thumb\.jpg/);
  assert.match(page, /Here’s what you can win/);
  assert.match(page, /id="video"/);
  assert.match(page, /controls/);
  assert.match(page, /playsInline/);
  assert.match(page, /hash === "#video"/);
  assert.match(page, /params\.get\("play"\) === "1"/);
  assert.match(page, /if \(!wantsVideo\) return/);
  assert.match(page, /hashchange/);
  assert.match(page, /figure\?\.querySelector\("video"\)/);
  assert.match(page, /video\.muted = false/);
  assert.match(page, /await video\.play\(\)/);
  assert.match(page, /video\.muted = true/);
  assert.match(page, /Tap to unmute/);
  assert.doesNotMatch(page, /autoPlay=/);
  assert.doesNotMatch(page, /\sautoplay=/i);
  assert.match(page, /giveaway-name/);
  assert.match(page, /form\.followCopy/);
  assert.match(page, /Enter to win/);
  assert.match(page, /disabled=\{submitting\}/);
  assert.doesNotMatch(page, /Draft preview/);
  assert.doesNotMatch(page, /Entries open after approval/);
  assert.doesNotMatch(page, /nothing is saved until/i);
  assert.doesNotMatch(page, /entries are not being accepted/i);
  assert.doesNotMatch(config, /Draft preview/);
  assert.match(shared, /Follow at least one account/);
  assert.match(shared, /instagram\.com\/soilseedandwater/);
  assert.match(shared, /facebook\.com\/soilseedandwater/);
  assert.match(shared, /youtube\.com\/@soilseedwater/);
  assert.doesNotMatch(shared, /tiktok\.com\/@soilseedandwater/);
  assert.match(page, /\/api\/giveaway\/enter/);
  assert.match(page, /noopener/);
  assert.doesNotMatch(page, /auto-follow|autofollow|we followed you/i);
  assert.match(api, /\/api\/giveaway\/enter/);
  assert.match(serverRoutes, /\/api\/giveaway/);
  assert.match(migration, /sp_giveaway_entries/);
  assert.match(envExample, /GIVEAWAY_ENTRIES_OPEN/);
  assert.match(offers, /99/);
  assert.match(worm, /WORM_CASTINGS_PUBLIC_SIGNUP_OPEN = false/);
});
