# OSW canonical phone source of truth

## Canonical public number

- Display: `(623) 263-3386`
- E.164: `+16232633386`
- Link: `tel:+16232633386`
- Retired: `(602) 637-0032` / `+16026370032`

The client source is `client/src/config/contact.ts`. The server source is `server/config/contact.ts`. Structured data and generated SEO must match both.

## CallRail requirements

1. The DNI source number must be `(623) 263-3386`.
2. Every OSW tracking number must route to `(623) 263-3386`.
3. CallRail may replace the displayed number, but the site synchronizer must update visible text, `href`, `aria-label`, and `data-phone-number` together.
4. Every US dial link must use `tel:+1XXXXXXXXXX` with digits only after `+`.
5. Never commit CallRail credentials or a tracking-pool number as the canonical application number.

## Replacement checklist

1. Update client and server contact constants.
2. Search active source, environment/config references, structured data, SEO, templates, generated output, tests, and operational guidance for the retired number.
3. Run the production build, `npm run test:phone-links`, and `node scripts/test-call-tracking.mjs`.
4. Verify mobile and desktop sessions with CallRail blocked; every official CTA must show `(623) 263-3386` and dial `tel:+16232633386`.
5. Verify a fresh production session after CallRail loads; text, link, and accessible label must agree.
6. Inspect CallRail source-number and destination routing. Get approval before changing routing or placing a real test call.
7. After approval, place one real mobile test call, confirm the correct phone rings, and confirm the conversion appears in CallRail.
8. Record deployment, browser/dial-intent evidence, CallRail evidence, and real-device evidence in the incident record.
