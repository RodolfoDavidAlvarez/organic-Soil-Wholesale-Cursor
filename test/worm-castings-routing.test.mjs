import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { STAFF_SIGNUP_SUBJECT, buildNewsletterAdminNotification } from '../shared/newsletterNotifications.js';
import {
  WORM_CASTINGS_GROWING_OPTIONS,
  WORM_CASTINGS_OFFER,
  nextActionForGardenStatus,
  parseCampaignPrefill,
  persistWormCastingsRouting,
  propertyProfileFromGrowing,
  routingRecordColumns,
  validateWormCastingsRouting,
} from '../shared/wormCastingsRouting.js';
import {
  SSW_NUMBER_ALPHABET,
  SSW_NUMBER_RE,
  ensureSswNumber,
  generateSswNumber,
  isSswNumber,
} from '../shared/sswNumber.js';
import { buildWormCastingsCouponEmail } from '../shared/wormCastingsCampaign.js';

const validBody = {
  customerType: 'homeowner',
  gardenStatus: 'brand-new',
  growing: ['food-garden', 'citrus-avocado'],
  growingOther: 'figs',
  zipCode: '85009',
};

test('routing questions accept Mike plant list and reject invented SKUs', () => {
  const labels = WORM_CASTINGS_GROWING_OPTIONS.map(([, label]) => label);
  assert.deepEqual(labels, [
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
  assert.equal(validateWormCastingsRouting(validBody).ok, true);
  assert.equal(validateWormCastingsRouting({ ...validBody, growing: ['bacchus'] }).ok, false);
  assert.equal(validateWormCastingsRouting({ ...validBody, customerType: 'home-gardener' }).ok, false);
  assert.equal(validateWormCastingsRouting({ ...validBody, zipCode: '8500' }).ok, false);
});

test('ZIP, property profile, offer, and next action are derived honestly', () => {
  const { routing } = validateWormCastingsRouting({ ...validBody, zipCode: '85009-1234' });
  assert.equal(routing.zipCode, '85009-1234');
  assert.equal(routing.propertyProfile, 'Food garden, Citrus/avocado, Other: figs');
  assert.equal(routing.offer, WORM_CASTINGS_OFFER);
  assert.equal(routing.nextAction, 'yard_pickup_then_intro_prescription');
  assert.equal(nextActionForGardenStatus('existing'), 'yard_pickup_then_existing_garden_upsell');
  assert.equal(
    propertyProfileFromGrowing(['turf', 'turf', 'unknown'], ''),
    'Turf/grass',
  );
});

test('signup record columns match CRM fields due Aug 25', () => {
  const { routing } = validateWormCastingsRouting(validBody);
  const columns = routingRecordColumns(routing, 'community-print');
  assert.deepEqual(Object.keys(columns).sort(), [
    'customer_type',
    'garden_status',
    'growing',
    'growing_other',
    'next_action',
    'offer',
    'property_profile',
    'signup_notes',
    'source',
    'zip_code',
  ]);
  assert.equal(columns.offer, 'free-9lb-mikeys-worm-poop');
  assert.equal(columns.source, 'community-print');
  assert.equal(columns.customer_type, 'homeowner');
});

test('persist writes routing onto the existing redemption and fills ZIP only when missing', async () => {
  const updates = [];
  const db = {
    from(table) {
      return {
        update(patch) {
          updates.push({ table, patch });
          return this;
        },
        eq() { return this; },
        select() { return this; },
        maybeSingle: async () => ({ data: { id: 'redemption-1' }, error: null }),
      };
    },
  };

  const { routing } = validateWormCastingsRouting(validBody);
  await persistWormCastingsRouting({
    db,
    customer: { id: 88, delivery_zip: '85007', newsletter_notes: 'prior' },
    redemptionId: 'redemption-1',
    routing,
    source: 'ig-ads',
  });

  const redemption = updates.find((item) => item.table === 'sp_worm_castings_redemptions');
  const customer = updates.find((item) => item.table === 'sp_customers');
  assert.equal(redemption.patch.zip_code, '85009');
  assert.equal(redemption.patch.customer_type, 'homeowner');
  assert.deepEqual(redemption.patch.growing, ['food-garden', 'citrus-avocado']);
  assert.equal(customer.patch.delivery_zip, undefined);
  assert.match(customer.patch.newsletter_notes, /ZIP: 85009/);
  assert.equal(customer.patch.newsletter_contact_type, 'homeowner');

  updates.length = 0;
  await persistWormCastingsRouting({
    db,
    customer: { id: 89, delivery_zip: null, newsletter_notes: '' },
    redemptionId: 'redemption-2',
    routing,
    source: 'ig-ads',
  });
  const filled = updates.find((item) => item.table === 'sp_customers');
  assert.equal(filled.patch.delivery_zip, '85009');
});

test('staff signup alerts keep generic subject and still omit Dan Nowell', async () => {
  const { routing } = validateWormCastingsRouting(validBody);
  const message = buildNewsletterAdminNotification({
    subscriber: {
      name: 'Sam Patel',
      email: 'sam@example.com',
      source: 'community-print',
      customerCategory: routing.customerType,
      zipCode: routing.zipCode,
      gardenStatus: routing.gardenStatus,
      propertyProfile: routing.propertyProfile,
      offer: routing.offer,
      nextAction: routing.nextAction,
    },
    testing: false,
  });
  assert.equal(message.subject, STAFF_SIGNUP_SUBJECT);
  assert.equal(message.subject, 'SSW signup');
  assert.match(message.html, /85009/);
  assert.match(message.html, /Food garden/);
  assert.match(message.html, /Yard pickup, then intro soil prescription/);
  assert.doesNotMatch(message.html, /nowell/i);
  assert.doesNotMatch(message.subject, /Sam/);

  const notifications = await readFile(new URL('../shared/newsletterNotifications.js', import.meta.url), 'utf8');
  assert.doesNotMatch(notifications, /nowell/i);
});

test('/free-worm-castings asks routing questions and does not change /survey', async () => {
  const page = await readFile(new URL('../client/src/pages/WormCastingsCampaign.tsx', import.meta.url), 'utf8');
  const survey = await readFile(new URL('../client/src/pages/ClientSurvey.tsx', import.meta.url), 'utf8');
  const api = await readFile(new URL('../api/index.js', import.meta.url), 'utf8');

  assert.match(page, /Who are you\?/);
  assert.match(page, /New or existing garden\?/);
  assert.match(page, /What are you growing\?/);
  assert.match(page, /ZIP code/);
  assert.match(page, /parseCampaignPrefill/);
  assert.match(page, /This is your number. Call us with it and we will pull you up./);
  assert.match(page, /campaign-notes/);
  assert.match(page, /border-\[#264027\] bg-\[#264027\] text-white/);
  assert.match(page, /campaign: "free-worm-castings-2026-08"/);
  assert.doesNotMatch(page, /Founder/);
  assert.doesNotMatch(page, /nowell/i);
  assert.doesNotMatch(page, /home-gardener/);
  assert.doesNotMatch(page, /\u2014/);

  assert.match(survey, /\/api\/survey\/submit/);
  assert.doesNotMatch(survey, /newsletter\/subscribe/);
  assert.match(api, /persistWormCastingsRouting/);
  assert.match(api, /validateWormCastingsRouting/);
  assert.match(api, /ensureSswNumber/);
  assert.doesNotMatch(api, /Dan Nowell/);
});

test('query params prefill name, email, phone, zip, and known routing answers', () => {
  const prefill = parseCampaignPrefill(
    '?email=rodolfodavid110@gmail.com&name=Rodo&phone=6232633386&zip=85009&customerType=homeowner&gardenStatus=existing&growing=food-garden,palms&other=figs',
  );
  assert.equal(prefill.name, 'Rodo');
  assert.equal(prefill.email, 'rodolfodavid110@gmail.com');
  assert.equal(prefill.phone, '6232633386');
  assert.equal(prefill.zipCode, '85009');
  assert.equal(prefill.customerType, 'homeowner');
  assert.equal(prefill.gardenStatus, 'existing');
  assert.deepEqual(prefill.growing, ['food-garden', 'palms']);
  assert.equal(prefill.growingOther, 'figs');
  assert.equal(parseCampaignPrefill('?customerType=home-gardener&growing=bacchus').customerType, '');
  assert.deepEqual(parseCampaignPrefill('?growing=bacchus').growing, []);
});

test('SSW numbers are random SSW-XXXX values and are reused for the same customer', async () => {
  assert.equal(SSW_NUMBER_ALPHABET, '23456789ABCDEFGHJKMNPQRSTUVWXYZ');
  const first = generateSswNumber(Buffer.from([0, 1, 2, 3]));
  const second = generateSswNumber(Buffer.from([10, 20, 30, 40]));
  assert.match(first, SSW_NUMBER_RE);
  assert.match(second, SSW_NUMBER_RE);
  assert.notEqual(first, second);
  assert.notEqual(first, 'SSW-290A');
  assert.equal(isSswNumber('SSW-3115'), false);

  const reused = await ensureSswNumber({}, { id: 290, ssw_number: 'SSW-7K2P' });
  assert.equal(reused, 'SSW-7K2P');

  const updates = [];
  const db = {
    from() {
      return {
        update(patch) {
          updates.push(patch);
          return this;
        },
        eq() { return this; },
        is() { return this; },
        select() { return this; },
        maybeSingle: async () => ({ data: { ssw_number: updates.at(-1)?.ssw_number }, error: null }),
      };
    },
  };
  const minted = await ensureSswNumber(db, { id: 88, ssw_number: null }, () => 'SSW-4H9Q');
  assert.equal(minted, 'SSW-4H9Q');
  assert.equal(updates[0].ssw_number, 'SSW-4H9Q');
});

test('gift email shows the customer number large with the yard phone', () => {
  const coupon = buildWormCastingsCouponEmail({
    fullName: 'Rodo',
    token: '11111111-1111-4111-8111-111111111111',
    customerNumber: 'SSW-4H9Q',
  });
  assert.equal(coupon.subject, 'Your free 9-lb worm castings coupon');
  assert.match(coupon.html, /SSW-4H9Q/);
  assert.match(coupon.html, /This is your number. Call us with it and we will pull you up./);
  assert.match(coupon.html, /tel:\+16232633386/);
  assert.match(coupon.html, /\(623\) 263-3386/);
});
