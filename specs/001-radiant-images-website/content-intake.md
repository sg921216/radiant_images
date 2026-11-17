# Supplied content intake — November 17, 2026

Scope: local preparation for T063, with candidate alt-text evidence for T061. This is not publication, owner approval, a provider upload test, or completion of either release task. The original supplied files are unchanged.

## Source findings

| Source | Finding and disposition |
| --- | --- |
| `apps/web/assets/Portfolio/` | 17 photos, all maternity: nine PNGs and eight JPEGs. Eleven exceed the 10 MiB upload limit; all are 3456 × 5184 or 5184 × 3456 (17,915,904 pixels), within 40 MP. Eight JPEGs contain EXIF/ICC metadata. No newborn or family-session examples supplied. Hidden AppleDouble files are filesystem sidecars, not photographs. |
| `Business card.pdf` | Both pages rendered and inspected. Rebekah Galarza; maternity/newborn/family; public email matches the approved `radiantimages.ct@gmail.com`. Card website `radiantimagesphoto.com` differs from approved `radiantimagesct.com`; reconcile before reprinting/linking. Phone 203.815.2385 and Instagram `radiant_images_photography` are source content, not newly verified publication choices. |
| `Monochrome Lavender Sprig Sketch.png` | Detailed grayscale botanical art on a white background. Suitable as a decorative accent with empty alt text if used next to the brand name; it is not a portfolio photo. No automatic replacement of the approved logo. |
| `Radiant Images Brand Moodboard.png` | Warm linen, wine, muted sage/olive/taupe, espresso; serif titles, script signature, botanical details, warm natural portraiture. Reference-layout photos and mockup contacts are not approved gallery/contact assets. |
| `Radiant_Images_Session_Pricing_Guide.docx` | Full body/table text extracted from OOXML. Pricing transcribed below. Document layout was not rendered; no print/layout approval is claimed. |
| `README.md` (root and assets) | Root describes reproducible local setup, synthetic seed data and provider/release boundaries. Assets README documents the already-approved logo. Synthetic fixtures must remain synthetic; supplied prices are prepared separately rather than overwriting test data. |
| `Water Mark .jpg` | Opaque black background with dark taupe brand lettering; JPEG has no alpha transparency. Not suitable as a transparent photo overlay as supplied. Keep separate from photographs and retain original. |

## Brand mapping

The moodboard labels: Warm Linen `#F3EDE4`, Vintage Wine `#814F5A`, Dusty Sage `#9AA092`, Antique Olive `#777D6D`, Mushroom Taupe `#B9A99E`, Espresso `#403A38`. Typography references are Bodoni Moda (or similar serif), Brittany Signature (or similar script), and Lora or Source Serif for readable body text. These are references, not bundled/licensed font files.

Current theme uses sage `#9CAF88`, olive `#6E7A5F`, cream `#F9F6F0`, ink `#2F3431`, and rose `#EADBC8`: broadly compatible, but not the exact moodboard. A palette change needs contrast verification across controls, focus, text and errors; no untested global recoloring is included in this intake.

The business card and prior owner-selected contact take precedence over decorative moodboard mockup contact details. Keep the approved logo and domain pending an explicit correction.

## Pricing handoff

| Session | USD | Duration | Included edited high-resolution images |
| --- | ---: | --- | --- |
| Family | 325 | 45–60 minutes | 30+ |
| Maternity | 325 | 45–60 minutes | 30+ |
| Lifestyle Newborn | 425 | Up to 90 minutes | 35+ |
| Baby Milestone | 275 | 30–45 minutes | 20+ |
| Couples | 300 | 45–60 minutes | 25+ |
| Mini Sessions | 175 | 15–20 minutes | 8 |
| The Beginning | 675 | Maternity + Lifestyle Newborn | Two complete sessions |
| The First Year | 1,100 | Maternity + Newborn + 6-Month + First Birthday | Four sessions |

`evidence/pricing-draft-20261117.json` is a schema-validated, unpublished draft containing the three supported service packages, with cents, complete inclusions, and source durations/image counts. It can be entered through the existing owner pricing editor and published as one revision after content approval. Do not replace the website-generated PDF with the DOCX: web/print/PDF must share the same published revision.

Baby Milestone, Couples, Minis and bundles have no dedicated current shoot-type mapping. Do not misclassify them as family/newborn or add new routes/enums implicitly. Confirm their desired website treatment first. The First Year arithmetic is consistent: 325 + 425 + 275 + 275 = 1,300, saving 200. The Beginning totals 750 individually, saving 75 (derived, not a source marketing claim).

### Policy wording requiring final decisions

- Booking: signed agreement and retainer reserve date. The source explicitly says **suggested** $100 regular / $150 newborn retainer, balance 48 hours before the session. Collections **may** use 25% and installments. No refund/cancellation terms are supplied.
- Travel: approximately 20 miles from Shelton included; beyond that **may** be $1/mile round trip, confirmed before booking. Confirm how the included radius affects chargeable mileage.
- Delivery: sneak peek approximately 3–5 days; gallery approximately 2–3 weeks, 3–4 in fall/holiday season.
- Rescheduling: unsuitable weather complimentary; one client-requested change with at least 48 hours notice complimentary; $50 **may** apply otherwise, with illness/emergency flexibility.
- Usage: personal printing rights and photographer copyright do not establish permission to publish clients' portraits. Obtain per-photo permission (and guardian permission where applicable) separately.
- Style: natural lifestyle newborn sessions, no elaborate studio props; minis only on announced dates. Service area: Shelton, Fairfield County, New Haven County and surrounding areas.

## Portfolio preparation and acceptance

All 17 originals were fully decoded locally. Upload candidates are in ignored `.wrangler/asset-review/uploads/`, numbered `maternity-01.jpg` through `maternity-17.jpg` in the manifest's order. Preparation uses pinned Sharp 0.35.5, auto-orientation, maximum 3000-pixel long edge, JPEG quality 92 with mozjpeg, and default metadata stripping. Every candidate was decoded again and checked for byte/pixel bounds and absent EXIF/XMP/ICC. This preserves complete compositions without crops. Source files/hashes, dimensions, byte sizes, candidate hashes and individual descriptive alt text are in `evidence/content-intake-20261117.json`.

The contact sheet was visually reviewed for all 17 compositions; draft alt text avoids filenames and personal names, is nonempty and within 200 characters. These are candidate descriptions, not a claim of final owner/editorial approval or assistive-technology acceptance. Near-duplicate poses/color variants can be curated by the owner; none was deleted. Newborn and family coverage remains missing. No permission record accompanied these files.

Upload only approved selections through the authenticated gallery pipeline so the existing strict validator, capacity controls, R2 privacy and derivative generation remain authoritative. Do not import the originals or local candidates into the frontend bundle or public directory. The local output directory is disposable and is not included in Git or deployment.

## Task disposition

Completed content substeps: source inventory and visual brand/card/photo review; 17 bounded metadata-stripped upload candidates and draft alt text; supported pricing draft and mismatch/policy register. T061/T063 remain open for final selection, permissions, content/policy decisions and existing human/device/release gates. Existing Google review, scheduled-health and operations tasks are unaffected. Overall full-task count remains 57/67.

## Validation recorded

- 17/17 original and candidate SHA-256 pairs verified after preparation; candidates total 22,589,825 bytes.
- 17/17 prepared JPEGs fully decoded and passed byte/pixel/metadata checks; 17/17 alt descriptions passed 1–200 character bounds.
- Pricing draft parsed successfully with the existing `pricingDraftSchema` (three packages).
- Git ignores prepared files and AppleDouble sidecars. Existing Node/Python/ESLint/Prettier ignore coverage was verified; no publishable npm package, Docker, Terraform or Helm setup was introduced.
- No executable application behavior changed; application/browser suites were not rerun for this documentation and local asset-preparation change. Existing live acceptance evidence is not superseded.
