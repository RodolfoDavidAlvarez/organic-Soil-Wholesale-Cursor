# OSW CallRail malformed mobile dial target incident

- Discovery date: 2026-08-07
- Severity: P0 call-conversion regression
- Status: Reopened for canonical destination correction; website deployment, CallRail destination verification, and physical-device verification pending
- Affected window: Start is not yet determinable. The defect was confirmed on production on 2026-08-07 before the corrective deployment.

## Customer-visible symptom

An Arizona CallRail tracking number could display correctly while the link retained stale accessibility text and a malformed dial target. Confirmed example:

- Visible text: `(602) 313-3897`
- Dial target: `tel:+(602) 313-3897`
- Accessible label: `Call (623) 263-3386`

Because a plus sign must be followed by country-code digits in E.164, iOS could parse `tel:+(602)...` as the international prefix `+60` for Malaysia. A customer tapping the correct-looking Arizona number could therefore see a Malaysian dial destination.

## Business impact

Phone leads may have abandoned the call or attempted an incorrect international number. This directly affects paid-search and mobile conversion. The exact number of lost calls is not yet confirmed; CallRail/GTM click and connected-call evidence must be compared for the affected period.

## Root cause

The React source supplied a visible number, `href`, and `aria-label` independently. CallRail dynamic-number insertion could replace visible text and rewrite the link as `tel:+(602)...` without synchronizing the accessible label. The site had route-specific protection for official-number pages, but no global post-injection canonicalizer for marketing-page telephone links. Three components also incorrectly prepended `tel:` to a constant that already included `tel:`.

## Corrective changes

- Superseding canonical correction on 2026-08-07: the sole current source number is `(623) 263-3386`; source dial target is `tel:+16232633386`.
- `(602) 637-0032` was temporarily treated as official during the first mitigation. It is now retired. References below to it are retained only as historical deployment evidence, not as active configuration.
- All US telephone links are canonicalized to `tel:+1` plus ten digits.
- A mutation observer synchronizes visible phone text, `href`, `aria-label`, and `data-phone-number` after CallRail changes.
- Excluded operational/campaign/checkout routes remain locked to the official number.
- Double-`tel:` source defects were removed.
- The homepage now has separate `Request a Quote` and `Get Soil Today` primary paths; calling is supporting assistance.

## Verification evidence

- Automated source and rendered-route regression test: `scripts/test-phone-links.mjs`.
- CallRail fixture must convert `tel:+(602) 313-3897` to `tel:+16023133897` while retaining `(602) 313-3897` consistently in visible text and `aria-label`.
- Mobile routes checked: header, hero, floating call button, footer, products, campaign, checkout, and quote flow.
- Production code deployment: `dpl_2HLkxqjdY3UP5JwCC9tQqTrKpjAC`, commit `2284badf42a30b0ea016a7f412bfa8fdf570f03b`, Ready on 2026-08-07 and aliased to `https://www.organicsoilwholesale.com`.
- Production cold-load test at 390x844: CallRail `swap.js` and `swap_session.json` loaded; every rendered phone link used `tel:+16026370032` with `Call (602) 637-0032`; the captured browser dial intent was exactly `tel:+16026370032` and no call was placed.
- Production routes checked: home/header/hero/floating/footer, products, campaign, checkout, and quote. No non-canonical rendered `tel:` target was found.
- The homepage review section existed without scrolling and started at the hero boundary (both 673px); CLS was 0. The quote action preserved `utm_source`, `utm_campaign`, and `source` into `/order`.
- Production Lighthouse mobile sanity: performance 88, LCP 3,123ms, CLS 0, TBT 222ms, transfer 1,586,765 bytes.
- Vercel reported no production runtime errors in the 30 minutes after deployment.
- Physical iPhone/Android dial-sheet verification is still required before changing this incident to Resolved.

## Canonical correction gate

- Active website source, generated output, structured data, email templates, and test fixtures must use `(623) 263-3386` / `tel:+16232633386`.
- CallRail DNI must recognize the new canonical source number and every assigned tracking number must route to `(623) 263-3386`.
- A real test call and CallRail conversion-log confirmation require explicit approval before placing the call or changing external routing.
- See `docs/PHONE_SOURCE_OF_TRUTH.md` for the permanent replacement checklist.

## Impact evidence and limits

- Confirmed: the malformed production combination was observed on 2026-08-07, and website phone clicks enter the site's analytics event pipeline.
- Not confirmed: the defect start date, affected click count, completed/connected CallRail call count, or lost-conversion count. No authenticated CallRail call-log dataset was available during remediation.
- Inference: any mobile tap made while CallRail had produced the malformed `tel:+(602)...` target was at risk of an incorrect international dial intent. Quantification requires comparing GA4/GTM phone-click events with CallRail connected-call records for the affected window.

## Prevention controls

1. Run `npm run build`, `npm run test:phone-links`, and `node scripts/test-call-tracking.mjs` before release.
2. Any phone, CallRail, GTM, header, footer, hero, campaign, checkout, or quote change requires real mobile dial-intent verification across all phone CTAs.
3. Verify displayed text, `href`, and `aria-label` after CallRail finishes loading.
4. Never hardcode a CallRail tracking number in application code.
5. Never place punctuation after `tel:+`; E.164 dial targets contain digits only after `+`.
