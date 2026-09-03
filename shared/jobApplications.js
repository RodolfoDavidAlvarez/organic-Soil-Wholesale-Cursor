export const JOB_APPLICATION_BUCKET = 'job-applications';
export const JOB_APPLICATION_POSITION_SLUG = 'sales-representative';
export const JOB_APPLICATION_POSITION_TITLE = 'Sales Representative';
export const JOB_APPLICATION_SOURCE = 'www.organicsoilwholesale.com/careers/sales';
export const JOB_APPLICATION_MAX_FILE_BYTES = 8 * 1024 * 1024;
export const JOB_APPLICATION_MAX_SUPPORTING_FILES = 5;

export const JOB_APPLICATION_ADMIN_RECIPIENTS = Object.freeze([
  { id: 'sabrina', name: 'Sabrina', email: 'sabrina@soilseedandwater.com' },
  { id: 'rodolfo', name: 'Rodolfo', email: 'ralvarez@soilseedandwater.com' },
  { id: 'mike-mcmahon', name: 'Mike McMahon', email: 'mike.mcmahon@agave-inc.com' },
]);

const FILE_TYPES = Object.freeze({
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
});
const RESUME_EXTENSIONS = new Set(['pdf', 'doc', 'docx']);
const SUPPORTING_EXTENSIONS = new Set(Object.keys(FILE_TYPES));
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const ALLOWED = Object.freeze({
  employmentInterest: new Set(['Full-time', 'Part-time', 'Open to either']),
  phoenixAvailability: new Set(['Yes', 'No', 'Relocating to Phoenix']),
  reliableTransportation: new Set(['Yes', 'No', 'Would like to discuss']),
  workAuthorization: new Set(['Yes', 'No']),
  salesExperienceYears: new Set(['Less than 1 year', '1–2 years', '3–5 years', '6–10 years', 'More than 10 years']),
  gardeningExperienceYears: new Set(['New, but actively learning', 'Less than 1 year', '1–2 years', '3–5 years', '6–10 years', 'More than 10 years']),
  computerProficiency: new Set([
    'Beginner — I need regular guidance',
    'Basic — I can complete common tasks',
    'Comfortable — I learn most tools quickly',
    'Advanced — I often help others with technology',
  ]),
  gardeningFocus: new Set([
    'Home gardening',
    'Professional growing or farming',
    'Landscaping or plant care',
    'Nursery, greenhouse, or garden center',
    'Composting or worm farming',
    'Organic growing',
    'Soil biology or soil health',
    'Indoor growing or hydroponics',
    'Used Soil Seed & Water products',
  ]),
  computerSkills: new Set([
    'Email and digital calendars',
    'Data entry and online forms',
    'Spreadsheets',
    'CRM or lead-tracking software',
    'Point-of-sale or order-entry systems',
    'E-commerce or shipping portals',
    'Video meetings',
    'Social media and direct messages',
    'AI productivity tools',
  ]),
});

export class JobApplicationError extends Error {
  constructor(message, status = 400, code = 'invalid_application') {
    super(message);
    this.name = 'JobApplicationError';
    this.status = status;
    this.code = code;
  }
}

export const escapeJobApplicationHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

export const safeJobApplicationFileName = (fileName) => {
  const cleaned = String(fileName || '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(-160);
  return cleaned || 'document';
};

function assertApplicationId(applicationId) {
  const normalized = String(applicationId || '').trim();
  if (!UUID_V4.test(normalized)) {
    throw new JobApplicationError('Please refresh the page and try again.', 400, 'invalid_application_id');
  }
  return normalized.toLowerCase();
}

function extensionFor(fileName) {
  return String(fileName || '').split('.').pop()?.toLowerCase() || '';
}

export function validateJobApplicationUpload(input) {
  const applicationId = assertApplicationId(input?.applicationId);
  const kind = input?.kind === 'resume' ? 'resume' : input?.kind === 'supporting' ? 'supporting' : null;
  if (!kind) throw new JobApplicationError('Invalid document type.', 400, 'invalid_document_type');

  const originalName = String(input?.name || '').trim();
  const extension = extensionFor(originalName);
  const acceptedExtensions = kind === 'resume' ? RESUME_EXTENSIONS : SUPPORTING_EXTENSIONS;
  if (!originalName || originalName.length > 200 || !acceptedExtensions.has(extension)) {
    throw new JobApplicationError(
      kind === 'resume'
        ? 'The resume must be a PDF, DOC, or DOCX file.'
        : 'Supporting documents must be PDF, DOC, DOCX, JPG, or PNG files.',
      400,
      'invalid_document_extension',
    );
  }

  const size = Number(input?.size);
  if (!Number.isInteger(size) || size < 1 || size > JOB_APPLICATION_MAX_FILE_BYTES) {
    throw new JobApplicationError('Each document must be 8 MB or smaller.', 400, 'invalid_document_size');
  }

  const contentType = String(input?.contentType || '').toLowerCase();
  if (contentType !== FILE_TYPES[extension]) {
    throw new JobApplicationError('The document type does not match its filename.', 400, 'invalid_document_content_type');
  }

  let index = null;
  if (kind === 'supporting') {
    index = Number(input?.index);
    if (!Number.isInteger(index) || index < 1 || index > JOB_APPLICATION_MAX_SUPPORTING_FILES) {
      throw new JobApplicationError('Invalid supporting document number.', 400, 'invalid_document_index');
    }
  }

  const prefix = kind === 'resume' ? 'resume' : `supporting-${index}`;
  const path = `${JOB_APPLICATION_POSITION_SLUG}/${applicationId}/${prefix}-${safeJobApplicationFileName(originalName)}`;
  return { applicationId, kind, index, name: originalName, size, contentType, path };
}

function requiredText(value, label, min, max) {
  const normalized = String(value || '').trim();
  if (normalized.length < min || normalized.length > max) {
    throw new JobApplicationError(`${label} must be between ${min} and ${max} characters.`);
  }
  return normalized;
}

function optionalText(value, label, max) {
  const normalized = String(value || '').trim();
  if (normalized.length > max) throw new JobApplicationError(`${label} is too long.`);
  return normalized || null;
}

function allowedValue(value, key, label) {
  const normalized = String(value || '');
  if (!ALLOWED[key].has(normalized)) throw new JobApplicationError(`Please select a valid ${label}.`);
  return normalized;
}

function allowedList(value, key, label) {
  if (!Array.isArray(value) || value.length < 1 || value.length > ALLOWED[key].size) {
    throw new JobApplicationError(`Please select at least one ${label}.`);
  }
  const normalized = [...new Set(value.map((item) => String(item)))];
  if (normalized.some((item) => !ALLOWED[key].has(item))) {
    throw new JobApplicationError(`Please select valid ${label}.`);
  }
  return normalized;
}

function normalizedDocument(raw, applicationId, kind, index = null) {
  const document = validateJobApplicationUpload({ ...raw, applicationId, kind, index });
  if (raw?.path !== document.path) {
    throw new JobApplicationError('A document path is invalid. Please attach the file again.', 400, 'invalid_document_path');
  }
  return document;
}

export function normalizeJobApplication(body) {
  if (String(body?.website || '').trim()) {
    throw new JobApplicationError('Unable to submit this application.', 400, 'bot_submission');
  }
  const applicationId = assertApplicationId(body?.applicationId);
  const form = body?.form && typeof body.form === 'object' ? body.form : {};
  const email = requiredText(form.email, 'Email', 3, 254).toLowerCase();
  if (!EMAIL.test(email)) throw new JobApplicationError('Please enter a valid email address.');
  const phone = requiredText(form.phone, 'Phone', 7, 40);
  if (phone.replace(/\D/g, '').length < 7) throw new JobApplicationError('Please enter a valid phone number.');

  const earliestStartDate = String(form.earliestStartDate || '');
  const parsedStartDate = new Date(`${earliestStartDate}T00:00:00Z`);
  if (!ISO_DATE.test(earliestStartDate) || Number.isNaN(parsedStartDate.valueOf()) || parsedStartDate.toISOString().slice(0, 10) !== earliestStartDate) {
    throw new JobApplicationError('Please enter a valid earliest start date.');
  }

  let linkedInUrl = optionalText(form.linkedInUrl, 'LinkedIn URL', 500);
  if (linkedInUrl) {
    try {
      const parsed = new URL(linkedInUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('protocol');
      linkedInUrl = parsed.toString();
    } catch {
      throw new JobApplicationError('Please enter a valid LinkedIn or portfolio URL.');
    }
  }

  if (form.certification !== true) throw new JobApplicationError('Please certify your application before submitting.');

  const resume = normalizedDocument(body?.resume, applicationId, 'resume');
  const rawSupporting = Array.isArray(body?.supportingDocuments) ? body.supportingDocuments : [];
  if (rawSupporting.length > JOB_APPLICATION_MAX_SUPPORTING_FILES) {
    throw new JobApplicationError(`Please choose no more than ${JOB_APPLICATION_MAX_SUPPORTING_FILES} supporting documents.`);
  }
  const supportingDocuments = rawSupporting.map((document, index) => normalizedDocument(document, applicationId, 'supporting', index + 1));
  if (new Set([resume.path, ...supportingDocuments.map((document) => document.path)]).size !== supportingDocuments.length + 1) {
    throw new JobApplicationError('Duplicate document paths are not allowed.');
  }

  const record = {
    id: applicationId,
    position_slug: JOB_APPLICATION_POSITION_SLUG,
    position_title: JOB_APPLICATION_POSITION_TITLE,
    first_name: requiredText(form.firstName, 'First name', 1, 80),
    last_name: requiredText(form.lastName, 'Last name', 1, 80),
    preferred_name: optionalText(form.preferredName, 'Preferred name', 80),
    email,
    phone,
    city: requiredText(form.city, 'City', 1, 100),
    state: requiredText(form.state, 'State', 2, 2).toUpperCase(),
    linkedin_url: linkedInUrl,
    employment_interest: allowedValue(form.employmentInterest, 'employmentInterest', 'preferred schedule'),
    phoenix_availability: allowedValue(form.phoenixAvailability, 'phoenixAvailability', 'Phoenix availability'),
    reliable_transportation: allowedValue(form.reliableTransportation, 'reliableTransportation', 'transportation answer'),
    work_authorization: allowedValue(form.workAuthorization, 'workAuthorization', 'work authorization answer'),
    earliest_start_date: earliestStartDate,
    compensation_expectation: optionalText(form.compensationExpectation, 'Compensation expectation', 160),
    sales_experience_years: allowedValue(form.salesExperienceYears, 'salesExperienceYears', 'sales experience range'),
    sales_background: requiredText(form.salesBackground, 'Sales background', 40, 1500),
    gardening_experience_years: allowedValue(form.gardeningExperienceYears, 'gardeningExperienceYears', 'gardening experience range'),
    gardening_focus: allowedList(form.gardeningFocus, 'gardeningFocus', 'gardening focus area'),
    plants_grown: requiredText(form.plantsGrown, 'Plants and growing experience', 20, 1200),
    organic_practices: requiredText(form.organicPractices, 'Organic practices', 20, 1500),
    product_experience: requiredText(form.productExperience, 'Product experience', 40, 1500),
    why_ssw: requiredText(form.whySsw, 'Reason for applying', 40, 1500),
    soil_knowledge: requiredText(form.soilKnowledge, 'Soil knowledge answer', 40, 1500),
    computer_proficiency: allowedValue(form.computerProficiency, 'computerProficiency', 'computer proficiency'),
    computer_skills: allowedList(form.computerSkills, 'computerSkills', 'computer skill'),
    software_tools: requiredText(form.softwareTools, 'Software tools', 10, 1200),
    computer_task_example: requiredText(form.computerTaskExample, 'Computer task example', 40, 1500),
    sales_example: requiredText(form.salesExample, 'Sales example', 40, 1500),
    referral_source: optionalText(form.referralSource, 'Referral source', 250),
    experience_tags: allowedList(form.gardeningFocus, 'gardeningFocus', 'experience tag'),
    resume_bucket: JOB_APPLICATION_BUCKET,
    resume_path: resume.path,
    additional_document_paths: supportingDocuments.map((document) => document.path),
    source: JOB_APPLICATION_SOURCE,
    consent_to_contact: true,
    application_version: 2,
  };

  return { applicationId, record, resume, supportingDocuments };
}

export async function verifyJobApplicationDocuments(storage, documents) {
  await Promise.all(documents.map(async (document) => {
    const { data, error } = await storage.info(document.path);
    if (error || !data) {
      throw new JobApplicationError(`The uploaded document “${document.name}” could not be verified.`, 400, 'document_not_found');
    }
    if (Number(data.size) !== document.size || String(data.contentType || '').toLowerCase() !== document.contentType) {
      throw new JobApplicationError(`The uploaded document “${document.name}” did not match the selected file.`, 400, 'document_mismatch');
    }
  }));
}

function display(value) {
  if (Array.isArray(value)) return value.join(', ');
  return value || '—';
}

function detailsTable(rows) {
  return `<table role="presentation" style="width:100%;border-collapse:collapse;margin:20px 0">${rows.map(([label, value]) => `<tr><th align="left" valign="top" style="width:34%;padding:8px;border-bottom:1px solid #dfe7e1;color:#183a23">${escapeJobApplicationHtml(label)}</th><td style="padding:8px;border-bottom:1px solid #dfe7e1;color:#334155;white-space:pre-wrap">${escapeJobApplicationHtml(display(value))}</td></tr>`).join('')}</table>`;
}

export function buildApplicantConfirmationEmail(record) {
  const name = record.preferred_name || record.first_name;
  return {
    from: 'Soil Seed & Water <info@soilseedandwater.com>',
    replyTo: 'ralvarez@soilseedandwater.com',
    to: record.email,
    subject: 'We received your Sales Representative application',
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#24352a;max-width:640px;margin:auto"><h1 style="color:#183a23">Application received</h1><p>Hi ${escapeJobApplicationHtml(name)},</p><p>Thank you for applying for the Sales Representative position with Soil Seed &amp; Water. Your application and documents were received successfully.</p><p>Our team will review your experience and contact you if there is a fit for the next step.</p><p>Questions? Reply to this email or call <a href="tel:+16232633386">(623) 263-3386</a>.</p><p>Soil Seed &amp; Water<br><a href="https://www.organicsoilwholesale.com">www.organicsoilwholesale.com</a></p></div>`,
    text: `Hi ${name},\n\nThank you for applying for the Sales Representative position with Soil Seed & Water. Your application and documents were received successfully. Our team will review your experience and contact you if there is a fit for the next step.\n\nQuestions? Reply to this email or call (623) 263-3386.`,
  };
}

export function buildAdminApplicationEmail(record, documentLinks) {
  const applicantName = `${record.first_name} ${record.last_name}`;
  const links = documentLinks.map((document) => `<li style="margin:8px 0"><a href="${escapeJobApplicationHtml(document.url)}">${escapeJobApplicationHtml(document.label)}</a> <span style="color:#64748b">(private link expires in 7 days)</span></li>`).join('');
  const rows = [
    ['Applicant', applicantName], ['Email', record.email], ['Phone', record.phone], ['Location', `${record.city}, ${record.state}`],
    ['Preferred schedule', record.employment_interest], ['Phoenix availability', record.phoenix_availability], ['Reliable transportation', record.reliable_transportation],
    ['Work authorization', record.work_authorization], ['Earliest start', record.earliest_start_date], ['Compensation expectation', record.compensation_expectation],
    ['Sales experience', record.sales_experience_years], ['Sales background', record.sales_background], ['Why Soil Seed & Water', record.why_ssw],
    ['Gardening experience', record.gardening_experience_years], ['Gardening focus', record.gardening_focus], ['Plants and environments', record.plants_grown],
    ['Organic practices', record.organic_practices], ['Product experience', record.product_experience], ['Soil biology answer', record.soil_knowledge],
    ['Computer proficiency', record.computer_proficiency], ['Computer skills', record.computer_skills], ['Software and tools', record.software_tools],
    ['Follow-up workflow answer', record.computer_task_example], ['Customer trust example', record.sales_example], ['Referral source', record.referral_source],
    ['LinkedIn / portfolio', record.linkedin_url], ['Application ID', record.id],
  ];
  return {
    from: 'Soil Seed & Water Careers <info@soilseedandwater.com>',
    replyTo: record.email,
    subject: `New Sales Representative application — ${applicantName}`,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#24352a;max-width:760px;margin:auto"><h1 style="color:#183a23">New Sales Representative application</h1><p><strong>${escapeJobApplicationHtml(applicantName)}</strong> submitted a complete application.</p><h2 style="color:#183a23">Private documents</h2><ul>${links}</ul>${detailsTable(rows)}<p style="color:#64748b">Submitted through ${escapeJobApplicationHtml(JOB_APPLICATION_SOURCE)}.</p></div>`,
    text: `New Sales Representative application from ${applicantName}.\n\nEmail: ${record.email}\nPhone: ${record.phone}\nLocation: ${record.city}, ${record.state}\n\nPrivate document links:\n${documentLinks.map((document) => `${document.label}: ${document.url}`).join('\n')}\n\nApplication ID: ${record.id}`,
  };
}

async function sendEmail(resend, payload, idempotencyKey) {
  const result = await resend.emails.send(payload, { idempotencyKey });
  if (result?.error || !result?.data?.id) throw new Error(result?.error?.message || 'Email provider did not accept the message.');
  return result.data.id;
}

export async function sendJobApplicationNotifications({ resend, record, documentLinks, prior = {} }) {
  const providerIds = { ...(prior.adminProviderIds || {}) };
  const jobs = [];
  if (prior.applicantStatus !== 'sent') {
    jobs.push({
      type: 'applicant',
      promise: sendEmail(resend, buildApplicantConfirmationEmail(record), `job-application-${record.id}-applicant`),
    });
  }
  for (const recipient of JOB_APPLICATION_ADMIN_RECIPIENTS) {
    if (providerIds[recipient.id]) continue;
    jobs.push({
      type: 'admin',
      recipient,
      promise: sendEmail(
        resend,
        { ...buildAdminApplicationEmail(record, documentLinks), to: recipient.email },
        `job-application-${record.id}-admin-${recipient.id}`,
      ),
    });
  }

  const settled = await Promise.allSettled(jobs.map((job) => job.promise));
  let applicantProviderId = prior.applicantProviderId || null;
  const errors = [];
  settled.forEach((result, index) => {
    const job = jobs[index];
    if (result.status === 'fulfilled') {
      if (job.type === 'applicant') applicantProviderId = result.value;
      else providerIds[job.recipient.id] = result.value;
    } else {
      errors.push(`${job.type === 'applicant' ? 'applicant' : job.recipient.id}: ${result.reason?.message || String(result.reason)}`);
    }
  });

  return {
    applicantStatus: applicantProviderId ? 'sent' : 'failed',
    applicantProviderId,
    adminStatus: JOB_APPLICATION_ADMIN_RECIPIENTS.every((recipient) => providerIds[recipient.id]) ? 'sent' : Object.keys(providerIds).length ? 'partial' : 'failed',
    adminProviderIds: providerIds,
    errors,
  };
}

async function privateDocumentLinks(storage, documents) {
  const links = await Promise.all(documents.map(async (document, index) => {
    const { data, error } = await storage.createSignedUrl(document.path, 7 * 24 * 60 * 60, { download: document.name });
    if (error || !data?.signedUrl) throw new Error(`Could not create a private link for ${document.name}.`);
    return { label: index === 0 ? `Resume — ${document.name}` : `Supporting document ${index} — ${document.name}`, url: data.signedUrl };
  }));
  return links;
}

function sameExistingApplication(existing, normalized) {
  return existing.email === normalized.record.email
    && existing.resume_path === normalized.record.resume_path
    && JSON.stringify(existing.additional_document_paths || []) === JSON.stringify(normalized.record.additional_document_paths);
}

export async function processJobApplication({ db, resend, body }) {
  const normalized = normalizeJobApplication(body);
  const storage = db.storage.from(JOB_APPLICATION_BUCKET);
  const documents = [normalized.resume, ...normalized.supportingDocuments];
  await verifyJobApplicationDocuments(storage, documents);

  const { data: existing, error: lookupError } = await db.from('job_applications')
    .select('*').eq('id', normalized.applicationId).maybeSingle();
  if (lookupError) throw lookupError;
  let saved = existing;
  if (existing && !sameExistingApplication(existing, normalized)) {
    throw new JobApplicationError('This application could not be retried safely. Please refresh the page.', 409, 'application_conflict');
  }
  if (!existing) {
    const { data, error } = await db.from('job_applications').insert(normalized.record).select('*').single();
    if (error) throw error;
    saved = data;
  }

  let documentLinks = Array.isArray(saved.notification_document_links) ? saved.notification_document_links : [];
  const reusableLinks = documentLinks.length === documents.length
    && documentLinks.every((link) => typeof link?.label === 'string' && typeof link?.url === 'string' && link.url.startsWith('https://'));
  if (!reusableLinks) {
    documentLinks = await privateDocumentLinks(storage, documents);
    const { error: linkUpdateError } = await db.from('job_applications')
      .update({ notification_document_links: documentLinks, updated_at: new Date().toISOString() })
      .eq('id', normalized.applicationId);
    if (linkUpdateError) throw linkUpdateError;
    saved.notification_document_links = documentLinks;
  }
  const delivery = await sendJobApplicationNotifications({
    resend,
    record: saved,
    documentLinks,
    prior: {
      applicantStatus: saved.applicant_confirmation_status,
      applicantProviderId: saved.applicant_confirmation_provider_id,
      adminProviderIds: saved.admin_notification_provider_ids || {},
    },
  });

  const now = new Date().toISOString();
  const updates = {
    applicant_confirmation_status: delivery.applicantStatus,
    applicant_confirmation_provider_id: delivery.applicantProviderId,
    applicant_confirmation_sent_at: delivery.applicantStatus === 'sent' ? (saved.applicant_confirmation_sent_at || now) : null,
    admin_notification_status: delivery.adminStatus,
    admin_notification_provider_ids: delivery.adminProviderIds,
    admin_notification_sent_at: delivery.adminStatus === 'sent' ? (saved.admin_notification_sent_at || now) : null,
    notification_last_error: delivery.errors.length ? delivery.errors.join(' | ').slice(0, 2000) : null,
    updated_at: now,
  };
  const { error: updateError } = await db.from('job_applications').update(updates).eq('id', normalized.applicationId);
  if (updateError) throw updateError;

  if (delivery.errors.length) {
    throw new JobApplicationError('Your application was saved, but a confirmation could not be delivered. Please try once more.', 502, 'notification_failed');
  }
  return { ok: true, applicationId: normalized.applicationId, applicantConfirmation: 'sent', adminNotifications: 'sent' };
}

export async function cleanupUnsavedJobApplication({ db, applicationId }) {
  const id = assertApplicationId(applicationId);
  const { data: existing, error: lookupError } = await db.from('job_applications').select('id').eq('id', id).maybeSingle();
  if (lookupError) throw lookupError;
  if (existing) throw new JobApplicationError('Saved application documents cannot be removed here.', 409, 'application_saved');

  const storage = db.storage.from(JOB_APPLICATION_BUCKET);
  const folder = `${JOB_APPLICATION_POSITION_SLUG}/${id}`;
  const { data: files, error: listError } = await storage.list(folder, { limit: 10 });
  if (listError) throw listError;
  const paths = (files || []).filter((file) => file?.name && file.id).map((file) => `${folder}/${file.name}`);
  if (paths.length) {
    const { error: removeError } = await storage.remove(paths);
    if (removeError) throw removeError;
  }
  return { ok: true, removed: paths.length };
}
