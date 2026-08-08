# OSW CallRail malformed mobile dial target incident

- Discovery date: 2026-08-07
- Severity: P0 call-conversion regression
- Status: Mitigated in code; production deployment and physical-device verification pending
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

- Official source number is `(602) 637-0032`; source dial target is `tel:+16026370032`.
- All US telephone links are canonicalized to `tel:+1` plus ten digits.
- A mutation observer synchronizes visible phone text, `href`, `aria-label`, and `data-phone-number` after CallRail changes.
- Excluded operational/campaign/checkout routes remain locked to the official number.
- Double-`tel:` source defects were removed.
- The homepage now has separate `Request a Quote` and `Get Soil Today` primary paths; calling is supporting assistance.

## Verification evidence

- Automated source and rendered-route regression test: `scripts/test-phone-links.mjs`.
- CallRail fixture must convert `tel:+(602) 313-3897` to `tel:+16023133897` while retaining `(602) 313-3897` consistently in visible text and `aria-label`.
- Mobile routes checked: header, hero, floating call button, footer, products, campaign, checkout, and quote flow.
- Production deployment, production browser evidence, dial-intent evidence, and physical-device result must be appended before status becomes Resolved.

## Prevention controls

1. Run `npm run build`, `npm run test:phone-links`, and `node scripts/test-call-tracking.mjs` before release.
2. Any phone, CallRail, GTM, header, footer, hero, campaign, checkout, or quote change requires real mobile dial-intent verification across all phone CTAs.
3. Verify displayed text, `href`, and `aria-label` after CallRail finishes loading.
4. Never hardcode a CallRail tracking number in application code.
5. Never place punctuation after `tel:+`; E.164 dial targets contain digits only after `+`.

