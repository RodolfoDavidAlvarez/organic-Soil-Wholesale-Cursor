# OSW production release checklist

## Phone and CallRail gate

Canonical source of truth: `(623) 263-3386` / `tel:+16232633386`. The former `(602) 637-0032` number is retired and must not appear in active output or CallRail destination settings.

Required after any phone, CallRail, GTM, header, footer, hero, campaign, checkout, or quote-flow change:

- Run `npm run test:phone-links` after the production build.
- Run `node scripts/test-call-tracking.mjs`.
- On a real mobile device, load production fresh and wait for CallRail.
- Check every visible phone CTA in the header, hero, floating button, footer, product, campaign, checkout, and quote flows.
- Confirm visible text, accessible label, and dial target describe the same US number.
- Confirm a fresh session without DNI shows `(623) 263-3386` and `tel:+16232633386` everywhere.
- In CallRail, confirm the DNI source number and every tracking-number destination route to `(623) 263-3386`; record the dashboard check without exposing credentials.
- Open each dial intent without placing a call; it must show `+1XXXXXXXXXX`, never `+(...)` or an international destination.
- Do not mark a phone incident resolved until this physical-device check is recorded.

See [the 2026-08-07 CallRail incident](./incidents/2026-08-07-callrail-malformed-tel.md).
