import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CHECKOUT_ABANDONMENT_STATUSES,
  CHECKOUT_EVENT_STATE,
} from '../shared/checkoutMonitoring.js';

test('abandonment digest excludes failures that already receive immediate alerts', () => {
  assert.deepEqual(CHECKOUT_ABANDONMENT_STATUSES, ['active', 'payment_pending', 'redirected']);
  assert.equal(CHECKOUT_EVENT_STATE.checkout_error.status, 'failed');
  assert.equal(CHECKOUT_EVENT_STATE.payment_failed.status, 'failed');
  assert.equal(CHECKOUT_ABANDONMENT_STATUSES.includes('failed'), false);
});
