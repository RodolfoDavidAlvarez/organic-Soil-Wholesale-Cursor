import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  SURVEY_SOURCE,
  normalizeSurveyResponse,
  saveSurveyResponse,
  validateSurveyResponse,
} from "../shared/surveyResponses.js";

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

test("inserts a row without newsletter fields and allows repeats", async () => {
  const inserts = [];
  const db = {
    from(table) {
      if (table === "sp_customers") {
        return {
          select() { return this; },
          ilike() { return this; },
          limit: async () => ({ data: [{ id: 42 }], error: null }),
        };
      }
      if (table === "sp_survey_responses") {
        return {
          insert(row) {
            inserts.push(row);
            return {
              select() { return this; },
              single: async () => ({
                data: { id: `row-${inserts.length}`, created_at: "2026-08-19T00:00:00.000Z", customer_id: row.customer_id },
                error: null,
              }),
            };
          },
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  };

  const first = validateSurveyResponse({
    firstName: "Jordan",
    email: "jordan@example.com",
    visitFeedback: "Pickup was quick.",
    whatFeltEasy: "Finding the pile.",
    wouldComeBack: "yes",
    wouldSendFriend: "yes",
  }, { userAgent: "SurveyTest/1.0" });
  const saved = await saveSurveyResponse({ db, response: first.response });
  assert.equal(saved.response.customer_id, 42);
  assert.equal(inserts.length, 1);
  assert.equal(inserts[0].source, SURVEY_SOURCE);
  assert.equal(inserts[0].user_agent, "SurveyTest/1.0");
  assert.equal("newsletter_subscribed" in inserts[0], false);

  await saveSurveyResponse({ db, response: first.response });
  assert.equal(inserts.length, 2);
});

test("missing customer rows do not fail the insert", async () => {
  const db = {
    from(table) {
      if (table === "sp_customers") {
        return {
          select() { return this; },
          ilike() { return this; },
          limit: async () => ({ data: [], error: { message: "no match" } }),
        };
      }
      return {
        insert(row) {
          return {
            select() { return this; },
            single: async () => ({
              data: { id: "anon-1", created_at: "2026-08-19T00:00:00.000Z", customer_id: row.customer_id },
              error: null,
            }),
          };
        },
      };
    },
  };
  const validation = validateSurveyResponse({
    firstName: "Sam",
    email: "new-neighbor@example.com",
    visitFeedback: "First time at the yard.",
  });
  const saved = await saveSurveyResponse({ db, response: validation.response });
  assert.equal(saved.response.customer_id, null);
});

test("survey write path never touches newsletter subscribe", async () => {
  const survey = await readFile(new URL("../shared/surveyResponses.js", import.meta.url), "utf8");
  const route = await readFile(new URL("../server/routes/survey.ts", import.meta.url), "utf8");
  const newsletter = await readFile(new URL("../server/routes/newsletter.ts", import.meta.url), "utf8");
  const page = await readFile(new URL("../client/src/pages/ClientSurvey.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(survey, /newsletter/i);
  assert.doesNotMatch(route, /newsletter/i);
  assert.doesNotMatch(page, /newsletter\/subscribe/);
  assert.doesNotMatch(newsletter, /sp_survey_responses/);
});
