import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  SURVEY_COUPON_LABEL,
  SURVEY_COUPON_OFFER,
  SURVEY_COUPON_RESTRICTIONS,
  SURVEY_COUPON_VALID_DAYS,
  SURVEY_SOURCE,
  buildPublicSurveyCoupon,
  generateSurveyCouponCode,
  isSurveyCouponCode,
  normalizeSurveyResponse,
  parseSurveyCouponQrRequest,
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
        const state = { filters: {}, notNull: null, insertRow: null };
        const matches = (row) => {
          for (const [col, val] of Object.entries(state.filters)) {
            if (row[col] !== val) return false;
          }
          if (state.notNull && (row[state.notNull] == null || row[state.notNull] === "")) return false;
          return true;
        };
        const api = {
          select() { return api; },
          eq(col, val) { state.filters[col] = val; return api; },
          not(col, kind, val) {
            if (kind === "is" && val == null) state.notNull = col;
            return api;
          },
          insert(row) {
            state.insertRow = row;
            return api;
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
