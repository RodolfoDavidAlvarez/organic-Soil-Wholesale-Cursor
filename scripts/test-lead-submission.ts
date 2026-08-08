import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  completeLeadSuccess,
  LeadSubmissionRequestError,
  submitLeadPayload,
} from "../client/src/lib/leadSubmissionClient.ts";

const accepted = await submitLeadPayload(
  { name: "Test Fixture" },
  async () => new Response(JSON.stringify({ success: true, leadId: 61 }), {
    status: 200,
    headers: { "Content-Type": "application/json", "X-OSW-Request-ID": "fixture-accepted" },
  }),
);
assert.equal(accepted.success, true);
assert.equal(accepted.requestId, "fixture-accepted");
assert.equal(accepted.leadId, 61);

const acceptedWithoutJson = await submitLeadPayload(
  { name: "Proxy Fixture" },
  async () => new Response("upstream accepted", {
    status: 200,
    headers: { "Content-Type": "text/plain", "X-OSW-Request-ID": "fixture-no-json" },
  }),
);
assert.equal(acceptedWithoutJson.success, true);
assert.equal(acceptedWithoutJson.requestId, "fixture-no-json");

await assert.rejects(
  submitLeadPayload(
    { name: "Rejected Fixture" },
    async () => new Response(JSON.stringify({ error: "Fixture validation failed", requestId: "fixture-rejected" }), {
      status: 422,
      headers: { "Content-Type": "application/json" },
    }),
  ),
  (error: unknown) => {
    assert.ok(error instanceof LeadSubmissionRequestError);
    assert.equal(error.status, 422);
    assert.equal(error.requestId, "fixture-rejected");
    assert.equal(error.message, "Fixture validation failed");
    return true;
  },
);

let successVisible = false;
let laterActionRan = false;
const capturedErrors: unknown[] = [];
completeLeadSuccess(
  () => { successVisible = true; },
  [
    () => { throw new Error("analytics fixture failure"); },
    () => { laterActionRan = true; },
  ],
  (error) => capturedErrors.push(error),
);
assert.equal(successVisible, true, "accepted leads remain visibly successful");
assert.equal(laterActionRan, true, "one non-critical failure does not stop later actions");
assert.equal(capturedErrors.length, 1);

const productionApiSource = await readFile(new URL("../api/index.js", import.meta.url), "utf8");
assert.match(productionApiSource, /path === '\/api\/leads\/submit'/, "the deployed monolith retains the lead route");
assert.match(productionApiSource, /X-OSW-Request-ID/, "the deployed lead route emits a trace header");
assert.match(productionApiSource, /lead_submission_succeeded/, "the deployed lead route logs accepted writes");
assert.match(productionApiSource, /lead_submission_failed/, "the deployed lead route logs failed writes");

console.log("Lead submission: actual production route, accepted/rejected responses, request IDs, and post-success failure isolation ok");
