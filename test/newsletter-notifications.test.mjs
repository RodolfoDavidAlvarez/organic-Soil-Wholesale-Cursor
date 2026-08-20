import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ADMIN_TEAM,
  STAFF_GARDEN_CLASS_SUBJECT,
  STAFF_GARDEN_CLASS_THREAD_ID,
  STAFF_NEWSLETTER_THREAD_ID,
  STAFF_SIGNUP_SUBJECT,
  buildGardenClassAdminNotification,
  buildNewsletterAdminNotification,
  isGardenClassRegistrationSource,
  sendGardenClassAdminNotifications,
  sendNewsletterAdminNotifications,
} from '../shared/newsletterNotifications.js';
import { buildWormCastingsCouponEmail } from '../shared/wormCastingsCampaign.js';

test('newsletter and class staff alerts never share a subject', () => {
  const newsletter = buildNewsletterAdminNotification({
    subscriber: { name: 'Alex Rivera', email: 'alex@example.com', source: 'website_newsletter_signup' },
    testing: false,
  });
  const gardenClass = buildGardenClassAdminNotification({
    registration: {
      full_name: 'Jordan Lee',
      email: 'jordan@example.com',
      phone: '6232633386',
      source: 'fall-garden-workshop-2026-08-website',
      event_name: 'The Garden Reset',
    },
    testing: false,
  });
  const wormCastings = buildNewsletterAdminNotification({
    subscriber: { name: 'Sam Patel', email: 'sam@example.com', source: 'july-community-gift' },
    testing: true,
  });

  assert.equal(newsletter.subject, 'SSW signup');
  assert.equal(STAFF_SIGNUP_SUBJECT, 'SSW signup');
  assert.equal(gardenClass.subject, 'New Garden Class Registration');
  assert.equal(STAFF_GARDEN_CLASS_SUBJECT, 'New Garden Class Registration');
  assert.notEqual(newsletter.subject, gardenClass.subject);
  assert.equal(wormCastings.subject, STAFF_SIGNUP_SUBJECT);
  assert.doesNotMatch(newsletter.subject, /Alex|Rivera|Jordan|Lee|Sam|Patel/i);
  assert.doesNotMatch(gardenClass.subject, /Alex|Rivera|Jordan|Lee|Sam|Patel/i);
  assert.doesNotMatch(wormCastings.subject, /\[INTERNAL TEST\]/);
});

test('class and newsletter alerts use different Gmail thread headers', () => {
  const newsletter = buildNewsletterAdminNotification({
    subscriber: { name: 'Alex Rivera', email: 'alex@example.com', source: 'website_newsletter_signup' },
    testing: false,
  });
  const gardenClass = buildGardenClassAdminNotification({
    registration: {
      full_name: 'Jordan Lee',
      email: 'jordan@example.com',
      source: 'fall-garden-workshop-2026-08-customer-email',
      event_name: 'The Garden Reset',
    },
    testing: false,
  });

  assert.equal(newsletter.headers['In-Reply-To'], STAFF_NEWSLETTER_THREAD_ID);
  assert.equal(newsletter.headers.References, STAFF_NEWSLETTER_THREAD_ID);
  assert.equal(gardenClass.headers['In-Reply-To'], STAFF_GARDEN_CLASS_THREAD_ID);
  assert.equal(gardenClass.headers.References, STAFF_GARDEN_CLASS_THREAD_ID);
  assert.notEqual(newsletter.headers['In-Reply-To'], gardenClass.headers['In-Reply-To']);
  assert.notEqual(newsletter.headers['X-Entity-Ref-ID'], gardenClass.headers['X-Entity-Ref-ID']);
});

test('class staff body includes name, email, phone, event, and source', () => {
  const message = buildGardenClassAdminNotification({
    registration: {
      full_name: 'Jordan Lee',
      email: 'jordan@example.com',
      phone: '6232633386',
      source: 'fall-garden-workshop-2026-08-website',
      event_name: 'The Garden Reset',
      customer_type: 'home-gardener',
    },
    testing: false,
  });

  assert.match(message.html, /Jordan Lee/);
  assert.match(message.html, /jordan@example.com/);
  assert.match(message.html, /6232633386/);
  assert.match(message.html, /The Garden Reset/);
  assert.match(message.html, /Fall Garden Workshop 2026 08 Website/);
  assert.match(message.html, />Event</);
  assert.equal(message.subject, STAFF_GARDEN_CLASS_SUBJECT);
});

test('building a newsletter alert from a class source is refused', () => {
  assert.equal(isGardenClassRegistrationSource('fall-garden-workshop-2026-08-customer-email'), true);
  assert.equal(isGardenClassRegistrationSource('website_newsletter_signup'), false);
  assert.throws(
    () => buildNewsletterAdminNotification({
      subscriber: { name: 'Jordan Lee', email: 'jordan@example.com', source: 'fall-garden-workshop-2026-08-website' },
      testing: false,
    }),
    /cannot use the SSW signup staff alert/,
  );
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
  assert.notEqual(coupon.subject, STAFF_GARDEN_CLASS_SUBJECT);
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
  assert.equal(message.headers['In-Reply-To'], STAFF_NEWSLETTER_THREAD_ID);
});

test('sending a class alert never uses the newsletter subject', async () => {
  const sent = [];
  const resend = {
    emails: {
      send: async (payload) => {
        sent.push(payload);
        return { data: { id: `re_${sent.length}` } };
      },
    },
  };

  await sendGardenClassAdminNotifications({
    resend,
    recipients: [{ name: 'Rodolfo Alvarez', email: 'ralvarez@soilseedandwater.com' }],
    registration: {
      full_name: 'Jordan Lee',
      email: 'jordan@example.com',
      phone: '6232633386',
      source: 'fall-garden-workshop-2026-08-website',
      event_name: 'The Garden Reset',
    },
  });

  assert.equal(sent.length, 1);
  assert.equal(sent[0].subject, STAFF_GARDEN_CLASS_SUBJECT);
  assert.equal(sent[0].headers['In-Reply-To'], STAFF_GARDEN_CLASS_THREAD_ID);
  assert.notEqual(sent[0].subject, STAFF_SIGNUP_SUBJECT);
});

test('sending a newsletter alert refuses a class source', async () => {
  await assert.rejects(
    () => sendNewsletterAdminNotifications({
      resend: { emails: { send: async () => ({ data: { id: 'nope' } }) } },
      subscriber: { name: 'Jordan Lee', email: 'jordan@example.com', source: 'fall-garden-workshop-2026-08-website' },
    }),
    /cannot use the SSW signup staff alert/,
  );
});
