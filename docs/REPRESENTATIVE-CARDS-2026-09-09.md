# Representative cards and public profiles

Approved public pages: /rep/rodolfo and /rep/sabrina. These permanent URLs are encoded in the printed QR codes. Keep them working when designs change.

Rodolfo Alvarez — Owner — (602) 833-0615 — ralvarez@soilseedandwater.com.
Sabrina Moses — Soil Health & Sales — (602) 975-3224 — sabrina@soilseedandwater.com.
Sabrina Kills Bugs uses her separate personal/product line (520) 479-6360.

These direct numbers were explicitly approved by Rodolfo. The general OSW support number remains (623) 263-3386. Existing /rep/ CallRail exclusions are retained.

The approved design is in RepresentativeCardLanding.tsx with scoped CSS and static contact data. Other /rep/:slug profiles continue to use the existing representative system. Static vCards under /representative-assets match the two public profiles. Update page data and vCards together when contact details change. The representative database records were also synchronized September 9: Rodolfo id 6 and Sabrina id 7.

Astrid, Jonathan Carrasco, and Vanessa Martinez remain private drafts while their business contacts are pending. Astrid starts September 14; no onboarding action was taken here.

Validation: production build, client typecheck, existing phone-link/CallRail suites, and scripts/test-representative-pages.mjs at 390px and 1440px. The latter validates phone/email links, canonical URL, saved vCard, image loading, 44px primary controls, and no horizontal overflow. It also accepts REP_BASE_URL for production checks. No physical-device call or dial-sheet test has been performed; this release does not resolve the earlier CallRail incident.

Print package: 3.5 × 2 inches, front then back, 0.125-inch bleed, variants with and without crop marks, embedded fonts, vector QR codes. QR codes decoded from final 300-dpi PDF renders. Production printing assets live in the SSW workspace output/pdf/Business Cards - Print Files.
