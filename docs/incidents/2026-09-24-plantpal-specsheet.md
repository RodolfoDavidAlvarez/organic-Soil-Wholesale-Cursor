# PlantPal outdated spec-sheet incident — 2026-09-24

## Confirmed issue
The live PDF SHA-256 matched the retired file: `ab4d1668345760dbd57147a5b1d857b8c77f8baef5b40b9119a5a663e649bfb0`.
It instructed mixing 1–2 cups per cubic foot of soil/potting mix and monthly top-dressing.
The reviewed master says to fill containers and plant directly, with no mixing required, and lists 1.5 CF packaging.

## Provenance
The website added the retired PDF in commit `8f057170d30c7569604531bebcc6e832ddf63629` on July 23, 2026, in “feat: complete OSW purchase and fulfillment experience”.
The same bytes persisted in workshop reference copies, another site checkout, and generated output. Git establishes when it entered this website; it does not establish who originally authored the PDF.
The updated master and September workshop handouts match exactly. Updating the shared master had not updated the website's independent static copy.

## Prevention
- Canonical source: `Specsheets/PlantPal - Spec Sheet.pdf` in the SSW shared library.
- `docs/specsheet-manifest.json` pins the visually reviewed current file hash and rejects the retired hash.
- Every client build runs `scripts/check-specsheets.mjs`; missing/unreviewed PlantPal files, retired PDFs under any filename, and publicly placed OUTDATED PDFs fail the build.
- Keep archived files outside public directories. Review a replacement before updating the pinned hash.
- Website link gets a revision query and spec-sheet responses require cache revalidation.
- Verify the live PDF hash after deployment. Previously downloaded offline copies cannot be recalled.

## Local copy cleanup
- Replaced with current master: `Regenerative Landscape Supply/client/public/documents/specsheets/PlantPal-All-Stage-Nursery-Mix-Spec-Sheet.pdf`
- Renamed OUTDATED-DO-NOT-USE: `Presentations/September 14, 2026 - Sales Workshop/Reference/Product Specifications/PlantPal - Spec Sheet.pdf`
- Replaced with current master: `Organic Soil Wholesale/output/osw-v7-website/client/dist/documents/specsheets/PlantPal-All-Stage-Nursery-Mix-Spec-Sheet.pdf`
- Replaced with current master: `Organic Soil Wholesale/output/osw-v7-website/client/public/documents/specsheets/PlantPal-All-Stage-Nursery-Mix-Spec-Sheet.pdf`
- Replaced with current master: `Organic Soil Wholesale/Organic Soil Wholesale Website/client/dist/documents/specsheets/PlantPal-All-Stage-Nursery-Mix-Spec-Sheet.pdf`
- Replaced with current master: `Organic Soil Wholesale/Organic Soil Wholesale Website/client/public/documents/specsheets/PlantPal-All-Stage-Nursery-Mix-Spec-Sheet.pdf`
- Renamed OUTDATED-DO-NOT-USE: `Meetings/2026-09-14 - Sales Workshop/Tomorrow Resources/_Onboarding Working Files/Astrid/03 Product Specifications/PlantPal - Spec Sheet.pdf`
- Renamed OUTDATED-DO-NOT-USE: `Meetings/2026-09-14 - Sales Workshop/Tomorrow Resources/Reference/Product Specifications/PlantPal - Spec Sheet.pdf`
- Renamed OUTDATED-DO-NOT-USE: `Meetings/2026-09-14 - Sales Workshop/MacBook source/Workshop Kit/Reference/Product Specifications/PlantPal - Spec Sheet.pdf`
- Replaced with current master: `.worktrees/osw-garden-workshop/.vercel/output/static/documents/specsheets/PlantPal-All-Stage-Nursery-Mix-Spec-Sheet.pdf`
- Replaced with current master: `.worktrees/osw-garden-workshop/client/dist/documents/specsheets/PlantPal-All-Stage-Nursery-Mix-Spec-Sheet.pdf`
- Replaced with current master: `.worktrees/osw-garden-workshop/client/public/documents/specsheets/PlantPal-All-Stage-Nursery-Mix-Spec-Sheet.pdf`
