import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  SURVEY_COUPON_LABEL,
  SURVEY_COUPON_OFFER,
  SURVEY_COUPON_RESTRICTIONS,
  SURVEY_COUPON_VALID_DAYS,
  SURVEY_KIND_GARDEN_CLASS,
  SURVEY_KIND_PURCHASE,
  SURVEY_SOURCE,
  GARDEN_CLASS_EVENT_KEY,
  buildPublicSurveyCoupon,
  generateSurveyCouponCode,
  isSurveyCouponCode,
  listSurveyInbox,
  normalizeSurveyResponse,
  parseSurveyCouponQrRequest,
  readGardenClassSurveyPrefill,
  saveSurveyResponse,
  surveyCouponExpiresAt,
  surveyCouponQrPath,
  validateSurveyResponse,
} from "../shared/surveyResponses.js";

function createSurveyDb({ customerId = 42 } = {}) {
  const rows = [];
  return {
    rows,
    from(table) {
      if (table === "sp_customers") {
        return {
          select() { return this; },
          ilike() { return this; },
          limit: async () => ({
            data: customerId == null ? [] : [{ id: customerId }],
            error: customerId == null ? { message: "no match" } : null,
          }),
        };
      }
      if (table === "sp_survey_responses") {
        const state = { filters: {}, notNull: null, insertRow: null, orderCol: null, orderAsc: false, limitN: null };
        const matches = (row) => {
          for (const [col, val] of Object.entries(state.filters)) {
            if (row[col] !== val) return false;
          }
          if (state.notNull && (row[state.notNull] == null || row[state.notNull] === "")) return false;
          return true;
        };
        const snapshot = () => {
          let result = rows.filter(matches);
          if (state.orderCol) {
            result = [...result].sort((a, b) => {
              const av = a[state.orderCol];
              const bv = b[state.orderCol];
              if (av < bv) return state.orderAsc ? -1 : 1;
              if (av > bv) return state.orderAsc ? 1 : -1;
              return 0;
            });
          }
          if (state.limitN != null) result = result.slice(0, state.limitN);
          if (state.selectCols === "survey_kind") {
            result = result.map((row) => ({ survey_kind: row.survey_kind }));
          }
          return { data: result, error: null };
        };
        const api = {
          select(cols) { state.selectCols = cols; return api; },
          eq(col, val) { state.filters[col] = val; return api; },
          not(col, kind, val) {
            if (kind === "is" && val == null) state.notNull = col;
            return api;
          },
          order(col, { ascending } = {}) {
            state.orderCol = col;
            state.orderAsc = Boolean(ascending);
            return api;
          },
          limit(n) {
            state.limitN = n;
            return api;
          },
          insert(row) {
            state.insertRow = row;
            return api;
          },
          then(resolve, reject) {
            return Promise.resolve(snapshot()).then(resolve, reject);
          },
          maybeSingle: async () => {
            const match = rows.find(matches);
            return { data: match || null, error: null };
          },
          single: async () => {
            if (!state.insertRow) {
              const match = rows.find(matches);
              return { data: match || null, error: match ? null : { message: "not found" } };
            }
            const row = state.insertRow;
            if (row.coupon_code && rows.some((existing) => existing.email_normalized === row.email_normalized && existing.coupon_code)) {
              return {
                data: null,
                error: {
                  code: "23505",
                  message: 'duplicate key value violates unique constraint "sp_survey_responses_one_coupon_per_email_idx"',
                },
              };
            }
            if (row.coupon_code && rows.some((existing) => existing.coupon_code === row.coupon_code)) {
              return {
                data: null,
                error: {
                  code: "23505",
                  message: 'duplicate key value violates unique constraint "sp_survey_responses_coupon_code_idx"',
                },
              };
            }
            const saved = {
              id: `row-${rows.length + 1}`,
              created_at: "2026-08-19T00:00:00.000Z",
              customer_id: row.customer_id ?? null,
              coupon_code: null,
              coupon_issued_at: null,
              coupon_expires_at: null,
              coupon_redeemed_at: null,
              survey_kind: "purchase",
              event_key: null,
              scores: {},
              notes: null,
              ...row,
            };
            rows.push(saved);
            return { data: saved, error: null };
          },
        };
        return api;
      }
      throw new Error(`unexpected table ${table}`);
    },
  };
}

const validAnswers = {
  firstName: "Jordan",
  email: "jordan@example.com",
  visitFeedback: "Pickup was quick.",
  whatFeltEasy: "Finding the pile.",
  wouldComeBack: "yes",
  wouldSendFriend: "yes",
};

test("honeypot submissions look successful and never write", async () => {
  const validation = validateSurveyResponse({
    firstName: "Bot",
    email: "bot@example.com",
    visitFeedback: "spam",
    website: "https://example.com",
  });
  assert.equal(validation.ok, true);
  assert.equal(validation.bot, true);
});

test("requires first name, email, and visit feedback", () => {
  assert.equal(validateSurveyResponse({ email: "a@b.com", visitFeedback: "Good" }).ok, false);
  assert.equal(validateSurveyResponse({ firstName: "Alex", visitFeedback: "Good" }).ok, false);
  assert.equal(validateSurveyResponse({ firstName: "Alex", email: "not-an-email", visitFeedback: "Good" }).ok, false);
  assert.equal(validateSurveyResponse({ firstName: "Alex", email: "alex@example.com" }).ok, false);
  const ok = validateSurveyResponse({
    firstName: "Alex",
    email: "Alex@Example.com",
    visitFeedback: "Yard was easy.",
  });
  assert.equal(ok.ok, true);
  assert.equal(ok.bot, false);
  assert.equal(ok.response.email, "alex@example.com");
  assert.equal(ok.response.source, SURVEY_SOURCE);
  assert.equal(ok.response.surveyKind, SURVEY_KIND_PURCHASE);
  assert.equal(ok.response.eventKey, "");
});

test("phone is optional but validated when present", () => {
  const blank = validateSurveyResponse({
    firstName: "Alex",
    email: "alex@example.com",
    visitFeedback: "Fine",
  });
  assert.equal(blank.ok, true);
  const bad = validateSurveyResponse({
    firstName: "Alex",
    email: "alex@example.com",
    phone: "123",
    visitFeedback: "Fine",
  });
  assert.equal(bad.ok, false);
  const good = validateSurveyResponse({
    firstName: "Alex",
    email: "alex@example.com",
    phone: "(623) 555-1212",
    visitFeedback: "Fine",
  });
  assert.equal(good.ok, true);
});

test("source stays on the osw-survey namespace", () => {
  assert.equal(normalizeSurveyResponse({}).source, SURVEY_SOURCE);
  assert.equal(normalizeSurveyResponse({ source: "osw-survey:qr" }).source, "osw-survey:qr");
  assert.equal(normalizeSurveyResponse({ source: "gate-sign" }).source, "osw-survey:gate-sign");
});

test("garden class survey keeps source garden-class-2026-08 and does not prefix osw-survey", () => {
  assert.equal(normalizeSurveyResponse({ source: "garden-class-2026-08" }).source, "garden-class-2026-08");
  assert.equal(normalizeSurveyResponse({ source: "garden-class" }).source, "garden-class-2026-08");
  assert.equal(normalizeSurveyResponse({ source: "osw-survey:garden-class-2026-08" }).source, "garden-class-2026-08");
});

test("inserts a row with a unique coupon and allows repeat answers without a second code", async () => {
  const db = createSurveyDb();
  const first = validateSurveyResponse(validAnswers, { userAgent: "SurveyTest/1.0" });
  const saved = await saveSurveyResponse({
    db,
    response: first.response,
    now: new Date("2026-08-19T17:00:00.000Z"),
    createCouponCode: () => "SSW30-ABCD2EFG",
  });

  assert.equal(saved.response.customer_id, 42);
  assert.equal(db.rows.length, 1);
  assert.equal(db.rows[0].source, SURVEY_SOURCE);
  assert.equal(db.rows[0].user_agent, "SurveyTest/1.0");
  assert.equal(db.rows[0].survey_kind, SURVEY_KIND_PURCHASE);
  assert.equal(db.rows[0].event_key, null);
  assert.equal(db.rows[0].notes, "Pickup was quick.");
  assert.equal(db.rows[0].scores.wouldComeBack, "yes");
  assert.equal(db.rows[0].scores.wouldSendFriend, "yes");
  assert.equal("newsletter_subscribed" in db.rows[0], false);
  assert.equal(saved.coupon.code, "SSW30-ABCD2EFG");
  assert.equal(saved.coupon.reused, false);
  assert.equal(saved.coupon.label, SURVEY_COUPON_LABEL);
  assert.equal(saved.coupon.offer, SURVEY_COUPON_OFFER);
  assert.equal(saved.coupon.restrictions, SURVEY_COUPON_RESTRICTIONS);
  assert.equal(saved.coupon.firstName, "Jordan");
  assert.equal(saved.coupon.email, "jordan@example.com");
  assert.equal(saved.coupon.issuedAt, "2026-08-19T17:00:00.000Z");
  assert.equal(saved.coupon.expiresAt, "2026-09-18T17:00:00.000Z");
  assert.equal(saved.coupon.qrUrl, "/api/public/survey-coupon/qr/SSW30-ABCD2EFG.png");
  assert.equal(db.rows[0].coupon_code, "SSW30-ABCD2EFG");

  const second = await saveSurveyResponse({
    db,
    response: first.response,
    now: new Date("2026-08-20T17:00:00.000Z"),
    createCouponCode: () => "SSW30-ZZZZZZZZ",
  });
  assert.equal(db.rows.length, 2);
  assert.equal(db.rows[1].coupon_code, null);
  assert.equal(second.coupon.code, "SSW30-ABCD2EFG");
  assert.equal(second.coupon.reused, true);
  assert.equal(second.coupon.issuedAt, "2026-08-19T17:00:00.000Z");
});

test("a second email still earns its own coupon", async () => {
  const db = createSurveyDb();
  const jordan = validateSurveyResponse(validAnswers);
  const sam = validateSurveyResponse({
    firstName: "Sam",
    email: "sam@example.com",
    visitFeedback: "First time at the yard.",
  });
  const first = await saveSurveyResponse({
    db,
    response: jordan.response,
    createCouponCode: () => "SSW30-JORDANXX",
  });
  const second = await saveSurveyResponse({
    db,
    response: sam.response,
    createCouponCode: () => "SSW30-SAMFRESH",
  });
  assert.equal(first.coupon.code, "SSW30-JORDANXX");
  assert.equal(second.coupon.code, "SSW30-SAMFRESH");
  assert.equal(second.coupon.reused, false);
  assert.equal(db.rows.filter((row) => row.coupon_code).length, 2);
});

test("retries when a generated coupon code already exists", async () => {
  const db = createSurveyDb();
  await saveSurveyResponse({
    db,
    response: validateSurveyResponse(validAnswers).response,
    createCouponCode: () => "SSW30-TAKENAAA",
  });
  let calls = 0;
  const other = validateSurveyResponse({
    firstName: "Sam",
    email: "sam@example.com",
    visitFeedback: "Good yard.",
  });
  const saved = await saveSurveyResponse({
    db,
    response: other.response,
    createCouponCode() {
      calls += 1;
      return calls === 1 ? "SSW30-TAKENAAA" : "SSW30-FRESHBBB";
    },
  });
  assert.equal(calls, 2);
  assert.equal(saved.coupon.code, "SSW30-FRESHBBB");
});

test("missing customer rows do not fail the insert", async () => {
  const db = createSurveyDb({ customerId: null });
  const validation = validateSurveyResponse({
    firstName: "Sam",
    email: "new-neighbor@example.com",
    visitFeedback: "First time at the yard.",
  });
  const saved = await saveSurveyResponse({
    db,
    response: validation.response,
    createCouponCode: () => "SSW30-NEIGHBOR",
  });
  assert.equal(saved.response.customer_id, null);
  assert.equal(saved.coupon.code, "SSW30-NEIGHBOR");
});

test("coupon helpers match the worm-castings QR style and 30-day window", () => {
  assert.equal(isSurveyCouponCode("SSW30-ABCD2EFG"), true);
  assert.equal(isSurveyCouponCode("SSW30-ABCD0EFG"), false);
  assert.equal(parseSurveyCouponQrRequest("SSW30-ABCD2EFG.png")?.code, "SSW30-ABCD2EFG");
  assert.equal(parseSurveyCouponQrRequest("not-a-coupon.png"), null);
  assert.equal(surveyCouponQrPath("ssw30-abcd2efg"), "/api/public/survey-coupon/qr/SSW30-ABCD2EFG.png");
  assert.equal(
    surveyCouponExpiresAt(new Date("2026-08-19T17:00:00.000Z")).toISOString(),
    "2026-09-18T17:00:00.000Z",
  );
  assert.equal(SURVEY_COUPON_VALID_DAYS, 30);
  const publicCoupon = buildPublicSurveyCoupon({
    first_name: "Jordan",
    email: "jordan@example.com",
    coupon_code: "SSW30-ABCD2EFG",
    coupon_issued_at: "2026-08-19T17:00:00.000Z",
    coupon_expires_at: "2026-09-18T17:00:00.000Z",
    coupon_redeemed_at: null,
  });
  assert.equal(publicCoupon.label, "SSW survey thank-you");
  assert.match(publicCoupon.offer, /30% off one item, one time, Phoenix yard pickup/);
});

test("generated codes stay unique enough and skip ambiguous characters", () => {
  const codes = new Set(Array.from({ length: 80 }, () => generateSurveyCouponCode()));
  assert.equal(codes.size, 80);
  for (const code of codes) {
    assert.equal(isSurveyCouponCode(code), true);
    assert.doesNotMatch(code.slice(6), /[01IOL]/);
  }
});

test("survey coupon QR is issued only for a real code", async () => {
  const { buildSurveyCouponQr } = await import("../shared/surveyCouponQr.js");
  const missing = await buildSurveyCouponQr({
    db: {
      from() {
        return {
          select() { return this; },
          eq() { return this; },
          maybeSingle: async () => ({ data: null, error: null }),
        };
      },
    },
    fileName: "SSW30-ABCD2EFG.png",
  });
  assert.equal(missing.status, 404);

  const found = await buildSurveyCouponQr({
    db: {
      from() {
        return {
          select() { return this; },
          eq() { return this; },
          maybeSingle: async () => ({ data: { id: "row-1" }, error: null }),
        };
      },
    },
    fileName: "SSW30-ABCD2EFG.png",
  });
  assert.equal(found.status, 200);
  assert.equal(found.contentType, "image/png");
  assert.ok(Buffer.isBuffer(found.body));
  assert.ok(found.body.length > 100);
});

test("survey write path never touches newsletter subscribe or emails Dan Nowell", async () => {
  const survey = await readFile(new URL("../shared/surveyResponses.js", import.meta.url), "utf8");
  const qr = await readFile(new URL("../shared/surveyCouponQr.js", import.meta.url), "utf8");
  const route = await readFile(new URL("../server/routes/survey.ts", import.meta.url), "utf8");
  const newsletter = await readFile(new URL("../server/routes/newsletter.ts", import.meta.url), "utf8");
  const page = await readFile(new URL("../client/src/pages/ClientSurvey.tsx", import.meta.url), "utf8");
  const api = await readFile(new URL("../api/index.js", import.meta.url), "utf8");
  const notifications = await readFile(new URL("../shared/newsletterNotifications.js", import.meta.url), "utf8");
  assert.doesNotMatch(survey, /newsletter/i);
  assert.doesNotMatch(qr, /newsletter/i);
  assert.doesNotMatch(route, /newsletter/i);
  assert.doesNotMatch(page, /newsletter\/subscribe/);
  assert.doesNotMatch(newsletter, /sp_survey_responses/);
  assert.doesNotMatch(survey, /nowell/i);
  assert.doesNotMatch(route, /nowell/i);
  assert.doesNotMatch(page, /nowell/i);
  assert.doesNotMatch(page, /Founder/);
  assert.doesNotMatch(page, /\u2014|\u2013/);
  assert.doesNotMatch(notifications, /nowell/i);
  assert.match(api, /coupon: result\.coupon/);
  assert.match(api, /survey-coupon/);
  assert.match(page, /Finish this and we'll give you 30% off one item at the yard/);
  assert.match(page, /Show this at the yard/);
  assert.match(survey, /SSW survey thank-you/);
  assert.match(page, /coupon\.label/);
  assert.match(page, /coupon\.qrUrl/);
  assert.doesNotMatch(page, /SSW30-[A-Z0-9]{8}/);
  assert.doesNotMatch(route, /resend/i);
  assert.doesNotMatch(survey, /resend/i);
});

const classAnswers = {
  firstName: "Rodo",
  email: "rodo@example.com",
  source: "garden-class-2026-08",
  notes: "The fan helped.",
  saturday: 8,
  heat: 4,
  teaching: 9,
  comeAgain: "yes",
};

test("garden class survey requires 1-10 scores, not a yard visit writeup", () => {
  const missingScore = validateSurveyResponse({
    firstName: "Rodo",
    email: "rodo@example.com",
    source: "garden-class-2026-08",
    notes: "The fan helped.",
  });
  assert.equal(missingScore.ok, false);

  const oldHeatChip = validateSurveyResponse({
    firstName: "Rodo",
    email: "rodo@example.com",
    source: "garden-class-2026-08",
    saturday: 8,
    heatCall: "yes",
    teaching: 9,
    comeAgain: "yes",
  });
  assert.equal(oldHeatChip.ok, false);
  assert.equal(oldHeatChip.error, "Please tell us how the heat felt.");
  assert.doesNotMatch(oldHeatChip.error || "", /8am/);

  const oldSaturdayChip = validateSurveyResponse({
    firstName: "Rodo",
    email: "rodo@example.com",
    source: "garden-class-2026-08",
    saturdayFeel: "great",
    heat: 4,
    teaching: 9,
    comeAgain: "yes",
  });
  assert.equal(oldSaturdayChip.ok, false);

  const oldTeachingChip = validateSurveyResponse({
    firstName: "Rodo",
    email: "rodo@example.com",
    source: "garden-class-2026-08",
    saturday: 8,
    heat: 4,
    teaching: "loved-it",
    comeAgain: "yes",
  });
  assert.equal(oldTeachingChip.ok, false);

  const ok = validateSurveyResponse(classAnswers);
  assert.equal(ok.ok, true);
  assert.equal(ok.bot, false);
  assert.equal(ok.response.source, "garden-class-2026-08");
  assert.equal(ok.response.surveyKind, SURVEY_KIND_GARDEN_CLASS);
  assert.equal(ok.response.eventKey, GARDEN_CLASS_EVENT_KEY);
  assert.equal(ok.response.saturday, 8);
  assert.equal(ok.response.heat, 4);
  assert.equal(ok.response.teaching, 9);
  assert.equal(ok.response.wouldComeBack, "yes");
  assert.equal(ok.response.notes, "The fan helped.");
  assert.equal(ok.response.visitFeedback, "The fan helped.");
  assert.deepEqual(ok.response.scores, {
    saturday: 8,
    heat: 4,
    teaching: 9,
    comeAgain: "yes",
  });
});

test("garden class survey comment can be blank", () => {
  const ok = validateSurveyResponse({ ...classAnswers, notes: "", visitFeedback: "" });
  assert.equal(ok.ok, true);
  assert.equal(ok.response.visitFeedback, "");
  assert.equal(ok.response.notes, "");
});

test("garden class survey writes to sp_survey_responses with no coupon", async () => {
  const db = createSurveyDb();
  const validation = validateSurveyResponse(classAnswers);
  let couponCalls = 0;
  const saved = await saveSurveyResponse({
    db,
    response: validation.response,
    createCouponCode() {
      couponCalls += 1;
      return "SSW30-SHOULDNT";
    },
  });
  assert.equal(couponCalls, 0);
  assert.equal(saved.coupon, null);
  assert.equal(db.rows.length, 1);
  assert.equal(db.rows[0].source, "garden-class-2026-08");
  assert.equal(db.rows[0].survey_kind, SURVEY_KIND_GARDEN_CLASS);
  assert.equal(db.rows[0].event_key, GARDEN_CLASS_EVENT_KEY);
  assert.equal(db.rows[0].visit_feedback, "The fan helped.");
  assert.equal(db.rows[0].notes, "The fan helped.");
  assert.equal(db.rows[0].what_felt_easy, "8");
  assert.equal(db.rows[0].what_felt_confusing, "4");
  assert.equal(db.rows[0].what_to_add_next, "9");
  assert.equal(db.rows[0].would_come_back, "yes");
  assert.equal(db.rows[0].coupon_code, null);
  assert.deepEqual(db.rows[0].scores, {
    saturday: 8,
    heat: 4,
    teaching: 9,
    comeAgain: "yes",
  });
});

test("garden class survey page is not the yard apology coupon form", async () => {
  const page = await readFile(new URL("../client/src/pages/GardenClassSurvey.tsx", import.meta.url), "utf8");
  const entry = await readFile(new URL("../client/src/pages/SurveyEntry.tsx", import.meta.url), "utf8");
  const app = await readFile(new URL("../client/src/App.tsx", import.meta.url), "utf8");
  const sources = await readFile(new URL("../shared/surveySources.js", import.meta.url), "utf8");
  const contact = await readFile(new URL("../client/src/config/contact.ts", import.meta.url), "utf8");
  const ig = await readFile(new URL("../client/src/pages/InstagramLinks.tsx", import.meta.url), "utf8");
  const yard = await readFile(new URL("../client/src/pages/ClientSurvey.tsx", import.meta.url), "utf8");
  assert.match(page, /How did Saturday feel\?/);
  assert.match(page, /Was it too hot\?/);
  assert.match(page, /How was the teaching\?/);
  assert.match(page, /Would you come to another class\?/);
  assert.match(page, /Anything else you want us to hear\?/);
  assert.match(page, /type="range"/);
  assert.match(page, /window\.location\.search/);
  assert.match(page, /readGardenClassSurveyPrefill/);
  assert.match(sources, /first_name/);
  assert.match(sources, /firstName/);
  assert.match(sources, /last_name/);
  assert.match(sources, /params\.get\('name'\)|pick\('name'\)/);
  assert.match(sources, /pick\('email'\)/);
  assert.match(page, /GARDEN_CLASS_SURVEY_SOURCE/);
  assert.match(page, /GARDEN_CLASS_EVENT_KEY/);
  assert.match(sources, /garden-class-2026-08/);
  assert.match(page, /PHOENIX_YARD_ADDRESS/);
  assert.match(page, /CUSTOMER_SUPPORT_PHONE_DISPLAY/);
  assert.match(page, /Tue-Sat, 8 AM-4 PM, closed 1-2 PM/);
  assert.match(contact, /1634 N 19th Ave/);
  assert.match(contact, /\(623\) 263-3386/);
  assert.ok(page.indexOf("class-survey-first-name") < page.indexOf("class-survey-saturday"));
  assert.ok(page.indexOf("class-survey-email") < page.indexOf("class-survey-saturday"));
  assert.doesNotMatch(page, /moving to 8am/i);
  assert.doesNotMatch(page, /moving the class/i);
  assert.doesNotMatch(page, /right call/);
  assert.doesNotMatch(page, /readOnly|disabled=\{true\}/);
  assert.doesNotMatch(page, /30%/);
  assert.doesNotMatch(page, /SSW30/);
  assert.doesNotMatch(page, /Finish this and we'll give you/);
  assert.doesNotMatch(page, /2 minutes|takes a minute|under a minute/i);
  assert.doesNotMatch(page, /We owe you an apology/);
  assert.doesNotMatch(page, /How did the yard feel\?/);
  assert.doesNotMatch(page, /\u2014/);
  assert.match(entry, /isGardenClassSurveySource/);
  assert.match(app, /path="\/survey\/garden-class"/);
  assert.match(app, /path="\/survey"/);
  assert.match(app, /path="\/admin\/surveys"/);
  assert.match(ig, /Tell me about the next class/);
  assert.doesNotMatch(ig, /Register for The Garden Reset/);
  assert.doesNotMatch(ig, /Aug 22/);
  assert.match(yard, /We owe you an apology/);
  assert.match(yard, /30% off/);
});

test("garden class named scores write saturday, heat, teaching, comeAgain and no coupon", async () => {
  const db = createSurveyDb();
  const validation = validateSurveyResponse({
    firstName: "Rodo",
    email: "rodo@example.com",
    source: "garden-class-2026-08",
    notes: "The fan helped.",
    saturday: 8,
    heat: 4,
    teaching: 9,
    comeAgain: "yes",
    eventKey: GARDEN_CLASS_EVENT_KEY,
  });
  assert.equal(validation.ok, true);
  const saved = await saveSurveyResponse({
    db,
    response: validation.response,
    createCouponCode: () => "SSW30-SHOULDNT",
  });
  assert.equal(saved.coupon, null);
  assert.equal(db.rows[0].survey_kind, SURVEY_KIND_GARDEN_CLASS);
  assert.equal(db.rows[0].event_key, "fall-garden-workshop-2026-08-22");
  assert.equal(db.rows[0].notes, "The fan helped.");
  assert.equal(db.rows[0].coupon_code, null);
  assert.deepEqual(db.rows[0].scores, {
    saturday: 8,
    heat: 4,
    teaching: 9,
    comeAgain: "yes",
  });
});

test("garden class survey prefill reads first_name, name, and email without locking", () => {
  assert.deepEqual(
    readGardenClassSurveyPrefill(
      "?source=garden-class-2026-08&first_name=Haylee&email=haylee@example.com",
    ),
    { firstName: "Haylee", email: "haylee@example.com", lastName: "" },
  );
  assert.equal(readGardenClassSurveyPrefill("?firstName=Haylee&email=haylee@example.com").firstName, "Haylee");
  assert.equal(readGardenClassSurveyPrefill("?name=Haylee%20Smith&email=haylee@example.com").firstName, "Haylee");
  assert.equal(
    readGardenClassSurveyPrefill("?first_name=Haylee&last_name=Smith&email=haylee@example.com").lastName,
    "Smith",
  );
  assert.equal(readGardenClassSurveyPrefill("?name=Haylee&first_name=Rodo").firstName, "Rodo");
});

test("inbox lists all rows and can filter class-only", async () => {
  const db = createSurveyDb();
  await saveSurveyResponse({
    db,
    response: validateSurveyResponse(validAnswers).response,
    createCouponCode: () => "SSW30-PURCHASE",
  });
  await saveSurveyResponse({
    db,
    response: validateSurveyResponse(classAnswers).response,
  });

  const all = await listSurveyInbox(db, { kind: "all" });
  assert.equal(all.counts.all, 2);
  assert.equal(all.counts.purchase, 1);
  assert.equal(all.counts["garden-class"], 1);
  assert.equal(all.rows.length, 2);

  const classes = await listSurveyInbox(db, { kind: "garden-class" });
  assert.equal(classes.kind, "garden-class");
  assert.equal(classes.rows.length, 1);
  assert.equal(classes.rows[0].survey_kind, SURVEY_KIND_GARDEN_CLASS);
  assert.equal(classes.rows[0].notes, "The fan helped.");
});

test("one landing table: class and purchase share sp_survey_responses", async () => {
  const survey = await readFile(new URL("../shared/surveyResponses.js", import.meta.url), "utf8");
  const migration = await readFile(new URL("../supabase/migrations/20260824_survey_kinds.sql", import.meta.url), "utf8");
  const api = await readFile(new URL("../api/index.js", import.meta.url), "utf8");
  assert.match(survey, /from\('sp_survey_responses'\)/);
  assert.doesNotMatch(survey, /sp_garden_class_survey/);
  assert.doesNotMatch(migration, /create table/i);
  assert.match(migration, /survey_kind/);
  assert.match(migration, /event_key/);
  assert.match(migration, /sp_survey_garden_class/);
  assert.match(api, /\/api\/admin\/surveys/);
});

test("garden class validator no longer requires chip enums or the 8am heatCall error", async () => {
  const survey = await readFile(new URL("../shared/surveyResponses.js", import.meta.url), "utf8");
  assert.match(survey, /parseGardenClassScore/);
  assert.match(survey, /Please tell us how the heat felt\./);
  assert.doesNotMatch(survey, /8am was the right call/);
  assert.doesNotMatch(survey, /GARDEN_CLASS_SATURDAY_FEEL/);
  assert.doesNotMatch(survey, /GARDEN_CLASS_HEAT_CALL/);
  assert.doesNotMatch(survey, /GARDEN_CLASS_TEACHING/);
  assert.doesNotMatch(survey, /loved-it/);
  assert.doesNotMatch(survey, /new Set\(\['great', 'okay', 'rough'\]\)/);
  assert.doesNotMatch(survey, /new Set\(\['yes', 'not-sure', 'no'\]\)/);
});
