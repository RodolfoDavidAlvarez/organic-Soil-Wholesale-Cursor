# OSW production release checklist

## Phone and CallRail gate

Required after any phone, CallRail, GTM, header, footer, hero, campaign, checkout, or quote-flow change:

- Run `npm run test:phone-links` after the production build.
- Run `node scripts/test-call-tracking.mjs`.
- On a real mobile device, load production fresh and wait for CallRail.
- Check every visible phone CTA in the header, hero, floating button, footer, product, campaign, checkout, and quote flows.
- Confirm visible text, accessible label, and dial target describe the same US number.
- Open each dial intent without placing a call; it must show `+1XXXXXXXXXX`, never `+(...)` or an international destination.
- Do not mark a phone incident resolved until this physical-device check is recorded.

See [the 2026-08-07 CallRail incident](./incidents/2026-08-07-callrail-malformed-tel.md).

