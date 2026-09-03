import assert from 'node:assert/strict';
import test from 'node:test';
import {
  JOB_APPLICATION_ADMIN_RECIPIENTS,
  buildAdminApplicationEmail,
  buildApplicantConfirmationEmail,
  normalizeJobApplication,
  sendJobApplicationNotifications,
  validateJobApplicationUpload,
  verifyJobApplicationDocuments,
} from '../shared/jobApplications.js';

const applicationId = 'a7782093-e50d-4b7a-97ce-b7b546a0081f';

function validBody() {
  const resume = validateJobApplicationUpload({
    applicationId,
    kind: 'resume',
    name: 'RÉSUMÉ Test.pdf',
    size: 412,
    contentType: 'application/pdf',
  });
  const supporting = validateJobApplicationUpload({
    applicationId,
    kind: 'supporting',
    index: 1,
    name: 'Certificate.png',
    size: 218,
    contentType: 'image/png',
  });
  return {
    applicationId,
    website: '',
    form: {
      firstName: 'Test', lastName: 'Applicant', preferredName: '', email: 'test@example.com', phone: '(623) 263-3386', city: 'Phoenix', state: 'az', linkedInUrl: '',
      employmentInterest: 'Full-time', phoenixAvailability: 'Yes', reliableTransportation: 'Yes', workAuthorization: 'Yes', earliestStartDate: '2026-09-15', compensationExpectation: '',
      salesExperienceYears: '3–5 years', salesBackground: 'I have helped customers select useful products and followed up carefully for several years.',
      gardeningExperienceYears: '3–5 years', gardeningFocus: ['Home gardening', 'Organic growing'], plantsGrown: 'Vegetables, citrus trees, herbs, and native flowers in raised beds.',
      organicPractices: 'I use compost, mulch, soil testing, worm castings, and reduced chemical inputs.',
      productExperience: 'I have used compost, biological soil amendments, and Soil Seed & Water products in a home garden.',
      whySsw: 'I want to help customers improve their soil while working with practical organic products I believe in.',
      soilKnowledge: 'Healthy soil biology cycles nutrients, supports roots, improves structure, and helps plants handle stress.',
      computerProficiency: 'Comfortable — I learn most tools quickly', computerSkills: ['Email and digital calendars', 'CRM or lead-tracking software'],
      softwareTools: 'Google Workspace, spreadsheets, calendars, and HubSpot CRM.',
      computerTaskExample: 'I would answer clearly, record the customer and question in the CRM, create a dated follow-up task, and check it next week.',
      salesExample: 'I listened to a customer’s goals, explained two suitable options without pressure, and followed up after purchase to confirm success.',
      referralSource: 'Instagram', certification: true,
    },
    resume,
    supportingDocuments: [supporting],
  };
}

test('normalizes a complete three-part application and exact private paths', () => {
  const normalized = normalizeJobApplication(validBody());
  assert.equal(normalized.record.email, 'test@example.com');
  assert.equal(normalized.record.state, 'AZ');
  assert.equal(normalized.record.resume_path, `sales-representative/${applicationId}/resume-r-sum-test.pdf`);
  assert.deepEqual(normalized.record.gardening_focus, ['Home gardening', 'Organic growing']);
  assert.deepEqual(normalized.record.computer_skills, ['Email and digital calendars', 'CRM or lead-tracking software']);
});

test('rejects mismatched content types, oversized files, forged paths, and invalid dates', () => {
  assert.throws(() => validateJobApplicationUpload({ applicationId, kind: 'resume', name: 'resume.pdf', size: 10, contentType: 'image/png' }), /does not match/);
  assert.throws(() => validateJobApplicationUpload({ applicationId, kind: 'resume', name: 'resume.pdf', size: 8 * 1024 * 1024 + 1, contentType: 'application/pdf' }), /8 MB/);
  const forged = validBody();
  forged.resume.path = `sales-representative/${applicationId}/../../private.pdf`;
  assert.throws(() => normalizeJobApplication(forged), /path is invalid/);
  const badDate = validBody();
  badDate.form.earliestStartDate = '2026-02-31';
  assert.throws(() => normalizeJobApplication(badDate), /valid earliest start date/);
});

test('verifies uploaded file size and MIME type before saving', async () => {
  const normalized = normalizeJobApplication(validBody());
  const documents = [normalized.resume, ...normalized.supportingDocuments];
  const storage = { info: async (path) => {
    const document = documents.find((entry) => entry.path === path);
    return { data: { size: document.size, contentType: document.contentType }, error: null };
  } };
  await verifyJobApplicationDocuments(storage, documents);
  await assert.rejects(
    verifyJobApplicationDocuments({ info: async () => ({ data: { size: 1, contentType: 'application/pdf' }, error: null }) }, documents),
    /did not match/,
  );
});

test('email templates escape applicant content and keep private links', () => {
  const { record } = normalizeJobApplication(validBody());
  record.first_name = '<img src=x onerror=alert(1)>';
  const applicant = buildApplicantConfirmationEmail(record);
  const admin = buildAdminApplicationEmail(record, [{ label: 'Resume', url: 'https://private.example/signed?a=1&b=2' }]);
  assert.doesNotMatch(applicant.html, /<img src=x/);
  assert.match(applicant.html, /&lt;img/);
  assert.doesNotMatch(admin.html, /<img src=x/);
  assert.match(admin.html, /https:\/\/private\.example\/signed\?a=1&amp;b=2/);
});

test('sends applicant confirmation and all three admin notices concurrently and separately', async () => {
  const { record } = normalizeJobApplication(validBody());
  const calls = [];
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const resend = { emails: { send: async (payload, options) => {
    calls.push({ payload, options });
    await gate;
    return { data: { id: `email-${calls.indexOf(calls.find((call) => call.payload === payload))}` }, error: null };
  } } };

  const pending = sendJobApplicationNotifications({
    resend,
    record,
    documentLinks: [{ label: 'Resume', url: 'https://private.example/resume' }],
  });
  await Promise.resolve();
  assert.equal(calls.length, 4, 'all four sends should start before any resolves');
  release();
  const result = await pending;
  assert.equal(result.applicantStatus, 'sent');
  assert.equal(result.adminStatus, 'sent');
  assert.deepEqual(
    calls.slice(1).map((call) => call.payload.to).sort(),
    JOB_APPLICATION_ADMIN_RECIPIENTS.map((recipient) => recipient.email).sort(),
  );
  assert.equal(calls.every((call) => typeof call.payload.to === 'string'), true);
  assert.equal(new Set(calls.map((call) => call.options.idempotencyKey)).size, 4);
});

test('retries only missing notifications', async () => {
  const { record } = normalizeJobApplication(validBody());
  const calls = [];
  const resend = { emails: { send: async (payload) => {
    calls.push(payload.to);
    return { data: { id: `new-${calls.length}` }, error: null };
  } } };
  const result = await sendJobApplicationNotifications({
    resend,
    record,
    documentLinks: [{ label: 'Resume', url: 'https://private.example/resume' }],
    prior: {
      applicantStatus: 'sent', applicantProviderId: 'existing-applicant',
      adminProviderIds: { sabrina: 'existing-sabrina', rodolfo: 'existing-rodolfo' },
    },
  });
  assert.deepEqual(calls, ['mike.mcmahon@agave-inc.com']);
  assert.equal(result.adminStatus, 'sent');
  assert.equal(result.applicantProviderId, 'existing-applicant');
});
