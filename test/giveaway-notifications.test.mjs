import assert from 'node:assert/strict';
import test from 'node:test';

import {
  STAFF_GIVEAWAY_SUBJECT,
  STAFF_GIVEAWAY_THREAD_ID,
  buildGiveawayAdminNotification,
  sendGiveawayAdminNotifications,
  shouldSendGiveawayAdminNotification,
} from '../shared/giveawayNotifications.js';

const entry = {
  fullName: 'Garden Tester',
  email: 'garden@example.com',
  phone: '(623) 555-0123',
  zipCode: '85009',
  customerTypes: ['homeowner', 'garden-professional'],
  gardenStatus: 'existing',
  growing: ['food-garden', 'roses'],
  followed: { ig: true, fb: false, yt: true },
  submittedAt: '2026-09-02T17:00:00.000Z',
};

test('giveaway alerts use one fixed subject and thread', () => {
  const message = buildGiveawayAdminNotification({ entry });
  assert.equal(message.subject, STAFF_GIVEAWAY_SUBJECT);
  assert.equal(message.headers['In-Reply-To'], STAFF_GIVEAWAY_THREAD_ID);
  assert.equal(message.headers.References, STAFF_GIVEAWAY_THREAD_ID);
  assert.match(message.html, /Garden Tester/);
  assert.match(message.html, /Homeowner, Garden Professional/);
  assert.match(message.html, /IG, YT/);
});

test('only a newly created entry triggers a staff alert', () => {
  assert.equal(shouldSendGiveawayAdminNotification({ status: 201, json: { success: true, alreadyEntered: false } }), true);
  assert.equal(shouldSendGiveawayAdminNotification({ status: 200, json: { success: true, alreadyEntered: true } }), false);
  assert.equal(shouldSendGiveawayAdminNotification({ status: 400, json: { success: false } }), false);
});

test('giveaway alerts are sent to every configured recipient with identical threading', async () => {
  const sent = [];
  const resend = {
    emails: {
      send: async (message) => {
        sent.push(message);
        return { data: { id: `email-${sent.length}` } };
      },
    },
  };
  const recipients = [
    { name: 'Rodolfo', email: 'ralvarez@soilseedandwater.com' },
    { name: 'Team', email: 'team@soilseedandwater.com' },
  ];

  const results = await sendGiveawayAdminNotifications({ resend, entry, recipients });
  assert.equal(results.length, 2);
  assert.equal(sent.length, 2);
  assert.deepEqual(sent.map((message) => message.subject), [STAFF_GIVEAWAY_SUBJECT, STAFF_GIVEAWAY_SUBJECT]);
  assert.deepEqual(sent.map((message) => message.headers.References), [STAFF_GIVEAWAY_THREAD_ID, STAFF_GIVEAWAY_THREAD_ID]);
});

test('provider failures are returned without throwing', async () => {
  const resend = { emails: { send: async () => ({ error: { message: 'provider unavailable' } }) } };
  const results = await sendGiveawayAdminNotifications({
    resend,
    entry,
    recipients: [{ name: 'Rodolfo', email: 'ralvarez@soilseedandwater.com' }],
  });
  assert.equal(results[0].status, 'rejected');
});
