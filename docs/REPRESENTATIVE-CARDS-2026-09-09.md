# Representative cards and public profiles

Approved public pages: /rep/rodolfo, /rep/sabrina, /rep/jonathan, /rep/astrid, and /rep/vanessa. These permanent URLs are encoded in the printed QR codes. Keep them working when designs change.

Rodolfo Alvarez — Chief Operating Officer — (602) 833-0615 — ralvarez@soilseedandwater.com.
Sabrina Moses — Soil Health — (602) 975-3224 — sabrina@soilseedandwater.com.
Jonathan Carrasco — Logistics Coordinator & Product Developer — (928) 232-4022 — jcarrasco@soilseedandwater.com.
Astrid Lopez — Sales — (602) 584-1535 — astrid@soilseedandwater.com.
Vanessa Martinez — Sales — (480) 771-9889 — vanessa@soilseedandwater.com.
Sabrina Kills Bugs uses her separate personal/product line (520) 479-6360.

These direct numbers were explicitly approved by Rodolfo. The general OSW support number remains (623) 263-3386. Existing /rep/ CallRail exclusions are retained.

The approved design is in RepresentativeCardLanding.tsx with scoped CSS and static contact data. Other /rep/:slug profiles continue to use the existing representative system. Static vCards under /representative-assets match all five public profiles. Update page data and vCards together when contact details change. The representative database records were synchronized September 9: Rodolfo id 6, Sabrina id 7, Jonathan id 8, Astrid id 9, Vanessa id 10.

Jonathan already accepted his Quo invitation and chose his number; it was retained. Vanessa and Astrid numbers were reserved at $5/month each plus taxes/fees, currently assigned to Rodolfo for administration. They still need employee assignment. Astrid starts September 14; no Quo employee account or invitation was created for her. Her surname was verified from her shared Messages contact identity. User supplied Vanessa and Astrid work emails; mailbox provisioning was not performed.

This release excludes Turf Daddy, new landscape landing pages, and unrelated product/catalog changes.

Validation: production build, client typecheck, existing phone-link/CallRail suites, and scripts/test-representative-pages.mjs at 390px and 1440px. The latter validates phone/email links, canonical URL, saved vCard, image loading, 44px primary controls, and no horizontal overflow. It also accepts REP_BASE_URL for production checks. No physical-device call or dial-sheet test has been performed; this release does not resolve the earlier CallRail incident.

Print package: 3.5 × 2 inches, front then back, 0.125-inch bleed, variants with and without crop marks, embedded fonts, vector QR codes. QR codes decoded from final 300-dpi PDF renders. Production printing assets live in the SSW workspace output/pdf/Business Cards - Print Files.
