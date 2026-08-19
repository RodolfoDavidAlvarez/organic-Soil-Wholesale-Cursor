import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ADMIN_TEAM,
  STAFF_SIGNUP_SUBJECT,
  buildNewsletterAdminNotification,
} from '../shared/newsletterNotifications.js';
import { buildWormCastingsCouponEmail } from '../shared/wormCastingsCampaign.js';

test('staff signup alerts share one generic subject', () => {
  const newsletter = buildNewsletterAdminNotification({
    subscriber: { name: 'Alex Rivera', email: 'alex@example.com', source: 'website_newsletter_signup' },
    testing: false,
  });
  const gardenClass = buildNewsletterAdminNotification({
    subscriber: { name: 'Jordan Lee', email: 'jordan@example.com', source: 'fall-garden-workshop-2026-08-website' },
    testing: false,
  });
  const wormCastings = buildNewsletterAdminNotification({
    subscriber: { name: 'Sam Patel', email: 'sam@example.com', source: 'july-community-gift' },
    testing: true,
  });

  assert.equal(newsletter.subject, STAFF_SIGNUP_SUBJECT);
  assert.equal(gardenClass.subject, STAFF_SIGNUP_SUBJECT);
  assert.equal(wormCastings.subject, STAFF_SIGNUP_SUBJECT);
  assert.equal(STAFF_SIGNUP_SUBJECT, 'SSW signup');
  assert.equal(newsletter.subject, gardenClass.subject);
  assert.equal(newsletter.subject, wormCastings.subject);
});

test('person, email, source, and type stay in the body', () => {
  const message = buildNewsletterAdminNotification({
    subscriber: {
      name: 'Alex Rivera',
      email: 'alex@example.com',
      source: 'fall-garden-workshop-2026-08-website',
    },
    testing: false,
  });

  assert.match(message.html, /Alex Rivera/);
  assert.match(message.html, /alex@example.com/);
  assert.match(message.html, /Fall Garden Workshop 2026 08 Website/);
  assert.match(message.html, />Type</);
  assert.match(message.html, /Garden class/);
  assert.doesNotMatch(message.subject, /Alex/);
  assert.doesNotMatch(message.subject, /Jordan/);
  assert.doesNotMatch(message.subject, /\[INTERNAL TEST\]/);
});

test('staff signup recipient list does not include Dan Nowell', () => {
  assert.equal(
    ADMIN_TEAM.some((person) => /nowell/i.test(`${person.name} ${person.email}`)),
    false,
  );
});

test('customer coupon email subjects are unchanged', () => {
  const coupon = buildWormCastingsCouponEmail({
    fullName: 'Alex Rivera',
    token: '11111111-1111-4111-8111-111111111111',
  });
  assert.equal(coupon.subject, 'Your free 9-lb worm castings coupon');
  assert.notEqual(coupon.subject, STAFF_SIGNUP_SUBJECT);
});

test('worm castings routing still uses the generic staff subject', () => {
  const message = buildNewsletterAdminNotification({
    subscriber: {
      name: 'Sam Patel',
      email: 'sam@example.com',
      source: 'community-print',
      customerCategory: 'homeowner',
      zipCode: '85009',
      gardenStatus: 'existing',
      propertyProfile: 'Turf/grass, Palms',
      offer: 'free-9lb-mikeys-worm-poop',
      nextAction: 'yard_pickup_then_existing_garden_upsell',
    },
    testing: true,
  });
  assert.equal(message.subject, 'SSW signup');
  assert.match(message.html, /85009/);
  assert.match(message.html, /Turf\/grass, Palms/);
});
