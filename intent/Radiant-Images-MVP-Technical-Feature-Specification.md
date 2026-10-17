# Radiant Images — Technical Feature Specification

## Goal, value, and stakeholders

- **What capability or change is needed?** Create a photography business website for Radiant Images, owned by Rebekah, offering maternity, newborn, and family photo shoots. Provide public information, a responsive portfolio gallery, pricing, FAQs, an inquiry form, and authenticated owner administration.
- **Why is it needed?** Help prospective clients understand the services, prepare for sessions, review pricing, and contact Rebekah. Allow Rebekah to maintain gallery images and publish scheduled promotions or alerts.
- **Who is affected or who receives value?** Rebekah as business owner and administrator; expecting mothers, families, and prospective clients as visitors; the configured recipient of inquiry emails.
- **What observable outcome should improve?** Visitors can find relevant services and pricing, print or download pricing, understand session expectations, and submit inquiries. Rebekah can update gallery content and schedule banners. Conversion, response-time, and other numerical success targets are **TBD**.

## Scope and boundaries

- **In scope:**
  - Public home page with a responsive image gallery.
  - Centered-logo header with Maternity, Newborn, and Family navigation on the left; About, Contact, and FAQ on the right.
  - Content for all three photo shoot types, including a “How It Works” section for each.
  - Configurable, schedulable promotion and miscellaneous alert banner beneath the header.
  - Pricing page covering all three photo shoot types, with print and PDF download capabilities.
  - **Book Now** button that routes to the Contact page.
  - FAQ content covering what to expect, what to wear, when payment is due, and deposits.
  - Contact form with CAPTCHA and email delivery to a configurable recipient.
  - Owner administration protected by authentication and an OAuth login, accessed through a private route.
  - Admin sections for email templates, session checklist, and client questionnaire.
  - Owner-controlled gallery additions/removals and configurable contact-form options.
  - The warm organic visual palette specified below.
- **Out of scope:** No additional capabilities are authorized by this brief. Online payment processing, confirmed appointment booking, availability calendars, client accounts, client proofing/delivery galleries, and automated marketing campaigns are **not specified** and require separate scope approval.
- **Existing behavior that must remain unchanged:** No existing implementation or migration requirements were provided. Existing URLs, content, customer records, integrations, or search rankings to preserve are **TBD** if this replaces a live site.

## Context, assumptions, and dependencies

- **Relevant existing behavior:** The supplied brief is the source of requirements; no existing application behavior is documented.
- **External actors or systems:** Site visitors, Rebekah, an OAuth-capable identity provider, a CAPTCHA service, an email delivery service, hosting, and image/content storage. Providers and implementation choices are **TBD**.
- **Assumptions:**
  - Rebekah is the initial administrator; additional administrators and roles are **TBD**.
  - **Book Now** begins an inquiry through the Contact page; the brief does not define an appointment-confirmation workflow.
  - Gallery, banner, recipient, and dropdown configuration require an owner editing interface; placement within the Admin page is **Proposed**.
  - `tbd@gmail.com` is the initial configured inquiry recipient supplied in the brief. Whether it is a placeholder or a monitored mailbox must be confirmed before launch.
  - Final copy, photographs, logo assets, prices, and session policies will be supplied or approved by Rebekah.
- **Compatibility or regulatory constraints:** Browser support, accessibility target, privacy obligations, image permissions, retention periods, and consent requirements are **TBD**. Do not infer permission to publish client photographs from possession of the files.
- **Content and design references:**

  | Reference                                                                                | Direction supplied in the brief                                             |
  | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
  | [Catherine King Photography](https://catherine-king-photography.com/)                    | Use as inspiration for content style and descriptions of photo shoot types. |
  | [Erin Borzellino](https://www.erinborzellino.com/)                                       | Use as inspiration for the home page and gallery.                           |
  | [Katie Pugliese Photography — Maternity](https://katiepugliesephotography.com/maternity) | Use the “How It Works” approach as a model for all three photo shoot types. |

  Produce original Radiant Images copy; reference sites are inspiration, not a requirement to reproduce their wording or assets.

## Externally observable behavior

- **Actors:** Anonymous visitor; authenticated, authorized owner; identity provider; CAPTCHA service; email delivery service.
- **Triggers:** Page navigation, pricing print/download request, **Book Now** selection, contact-form submission, owner login, owner configuration change, or a scheduled banner boundary.
- **Preconditions:** Public content and configuration are available. Owner changes require an authorized session. Contact submission requires validation and CAPTCHA verification; exact field requirements are **TBD**.
- **Inputs:** Visitor contact and session details; owner images, banner messages/schedules, recipient address, and dropdown values; identity and CAPTCHA responses.
- **Expected outputs:** Rendered public pages, image gallery, current banner when applicable, printable pricing, downloadable pricing PDF, Contact-page navigation, inquiry email, and visible submission feedback. Feedback wording and delivery semantics are **TBD**.
- **State changes and side effects:** Gallery/configuration changes alter subsequent public views; scheduling changes banner visibility; successful contact submission initiates email delivery. Inquiry persistence, email delivery tracking, and admin-section editing behavior are **TBD**.
- **Postconditions:** Public pages reflect published owner changes. An accepted inquiry is processed according to the agreed email-delivery workflow; acceptance must not be described as a confirmed booking.

### Public navigation and content

- Display the logo centered in the header.
- Position Maternity, Newborn, and Family links on the left and About, Contact, and FAQ links on the right in the desktop layout.
- Provide the corresponding destinations. About-page content is **TBD**.
- Describe maternity, newborn, and family services using a consistent, welcoming approach, with a “How It Works” section for each.
- Display the banner directly beneath the navigation header when its configured schedule makes it eligible. Schedule rules and page coverage are **TBD**.
- Display a responsive home-page gallery. Rebekah can add and remove images at any time; publishing latency, ordering, captions, and cropping rules are **TBD**.
- Provide pricing for maternity, newborn, and family sessions on a printable page and in a downloadable PDF.
- Route **Book Now** to Contact.
- Include FAQ answers for all four requested topics.

### Contact form inputs

Required/optional status, defaults, length limits, and numerical ranges are **TBD** unless explicitly stated below.

| Field                                    | Control or value type      | Defined choices or behavior                             |
| ---------------------------------------- | -------------------------- | ------------------------------------------------------- |
| First name                               | Text                       | Visitor's first name                                    |
| Last name                                | Text                       | Visitor's last name                                     |
| Email                                    | Email input                | Visitor's email address                                 |
| Phone number                             | Telephone input            | Visitor's phone number                                  |
| Preferred contact method                 | Choice                     | Email, call, or text                                    |
| Postal code                              | Text                       | Supported countries and formats TBD                     |
| Type of photo shoot                      | Choice                     | Maternity, newborn, or family                           |
| Notes: preferred day                     | Date picker                | Requested date; availability validation TBD             |
| Notes: special requests                  | Text                       | Session-specific requests                               |
| Notes: session length                    | Hour counter               | Minimum, maximum, and increment TBD                     |
| Notes: number of people                  | Integer dropdown           | Minimum and maximum TBD                                 |
| Notes: shoot location                    | Configurable text dropdown | Owner-configured location choices                       |
| How the visitor heard about the business | Configurable dropdown      | Includes business card, word of mouth, and social media |
| Message to Rebekah                       | Text                       | General message, separate from special requests         |
| CAPTCHA                                  | Verification control       | Provider and challenge experience TBD                   |
| Submit                                   | Button                     | Submits the inquiry for validation and email delivery   |

On successful processing, email the submitted information to the configured recipient, initially `tbd@gmail.com`. Email subject, formatting, sender identity, reply-to behavior, and visitor acknowledgment email are **TBD**.

### Owner administration

- Require authentication through the selected OAuth login integration and authorize access specifically for the site owner.
- Use a private admin route known to the owner; exact path is **TBD**.
- Include sections for email templates, session checklist, and client questionnaire. Whether each section supports viewing, editing, sending, downloading, or per-client records is **TBD**.
- Provide owner controls for gallery additions/removals, banner configuration/scheduling, inquiry recipient, shoot locations, and referral-source choices. Grouping these controls under Admin is **Proposed**.

## Rules and invariants

- **Business rules:**
  - The supported photo shoot types are maternity, newborn, and family.
  - The pricing schedule covers all three types and supports printing and PDF download.
  - **Book Now** routes to Contact.
  - Preferred contact method offers email, call, and text.
  - The referral-source dropdown includes business card, word of mouth, and social media and is configurable.
  - Inquiry delivery uses the configured recipient; visitors cannot choose the internal destination address.
  - Gallery management and banner scheduling are owner capabilities.
- **Conditions that must always hold:**
  - Knowing the admin URL does not grant access. Authentication and owner authorization must protect both the page and its underlying operations.
  - CAPTCHA verification is required for contact submissions before email dispatch.
  - **Proposed:** Public pricing, printed pricing, and the downloaded PDF represent the same published pricing revision.
  - **Proposed:** Unsuccessful validation or authorization causes no email dispatch or configuration mutation.
- **Prohibited behavior:**
  - Unauthorized access to private admin content or modification of site settings.
  - Treating a requested date or submitted inquiry as a confirmed reservation.
  - **Proposed:** Reporting successful email delivery when only a submission attempt, queue acceptance, or provider acceptance is known.

## Scenarios: happy, alternate, and edge cases

### Happy path

1. A visitor opens the home page and sees the branded header, eligible banner, and responsive gallery.
2. The visitor opens a service page, reads its description and “How It Works” section, and reviews pricing and FAQs.
3. The visitor prints or downloads pricing and selects **Book Now**.
4. On Contact, the visitor enters their details, session preferences, and message and completes CAPTCHA.
5. The site validates the inquiry and sends its information to the configured recipient, showing feedback consistent with the actual processing state.
6. Rebekah signs in, accesses the authorized admin area, updates gallery images, and schedules a promotion.

### Alternate paths

- A visitor goes directly to Contact or selects Contact from navigation.
- A visitor selects call or text instead of email as their preferred contact method. Conditional phone requirements are **TBD**.
- A visitor reviews the FAQ before submitting an inquiry.
- Rebekah changes the inquiry recipient, available locations, or referral-source options.
- A visitor opens the site on a narrow screen; the gallery adapts and navigation remains usable. The mobile header pattern is **TBD**.
- No banner is eligible for display. **Proposed:** Omit the banner area without leaving an empty gap.

### Edge and boundary cases

- Gallery contains zero images, one image, or many images; empty-state behavior and maximum size are **TBD**.
- A banner reaches its start or end instant; timezone and inclusive/exclusive boundaries are **TBD**.
- Multiple banners overlap; priority, rotation, or stacking behavior is **TBD**.
- The visitor selects a past date, an unavailable date, or a date far in the future; allowable dates are **TBD**.
- Session length or party size is at or beyond configured bounds; bounds are **TBD**.
- Rebekah removes a dropdown option while a visitor has an open form; stale-value handling is **TBD**.
- A visitor double-clicks Submit or retries after a timeout; duplicate handling is **TBD**.
- CAPTCHA expires, login expires, an image cannot load, or an external service is unavailable.

## Error and recovery behavior

The brief does not define a complete failure contract. The following behaviors are **Proposed**, subject to confirmation.

- **Invalid input:** Show clear field-level errors, preserve valid entered values, and prevent dispatch until the submission satisfies the agreed validation rules. Validate on the server as well as in the browser.
- **Unauthorized or prohibited action:** Require login for unauthenticated owner access; deny authenticated non-owner access. Do not expose private content or apply requested changes.
- **Dependency failure:**
  - Identity-provider failure: show a retryable login error and keep admin access protected.
  - CAPTCHA failure or unavailability: do not bypass verification; retain form values where practical and offer a retry.
  - Email-service failure: do not show a misleading delivery confirmation. Retry/queue policy and owner notification are **TBD**.
  - Gallery/configuration save failure: retain the previously published state and show an actionable error.
  - PDF failure: show a clear message and retain access to the web pricing page and print action.
- **Duplicate or repeated request:** Prevent accidental repeated submission while a request is processing. Server deduplication, retry identifiers, and deduplication windows are **TBD**.
- **State after failure:** Do not partially publish a failed owner update. Whether an inquiry remains stored after failed email dispatch depends on the **TBD** persistence policy.
- **Recovery or retry expectations:** Allow safe retries without silently losing input or producing avoidable duplicate emails. Automated retry counts, delays, and terminal-failure handling are **TBD**.

## Quality attributes and constraints

- **Performance:** Responsive image gallery is required. Page-load targets, image limits, optimization strategy, and maximum publishing delay are **TBD**.
- **Security and privacy:** Authenticated OAuth login and owner authorization are required for administration; CAPTCHA is required on Contact. **Proposed:** HTTPS, server-side validation, safe handling of user-supplied text, protected credentials, and request abuse controls. Data retention, access, deletion, and privacy notice requirements are **TBD**.
- **Reliability and availability:** Availability targets, backups, restore requirements, and email retry/delivery guarantees are **TBD**.
- **Usability or accessibility:** Maintain a welcoming, bright, clean, airy presentation that emphasizes photography. **Proposed:** Keyboard-operable navigation and forms, associated labels, meaningful image alternatives, accessible errors, visible focus indicators, and readable color contrast. Formal accessibility conformance target is **TBD**; palette colors must not be assumed to meet contrast requirements in every pairing.
- **Compatibility and interoperability:** Supported browsers/devices, mobile breakpoints, PDF format/page size, OAuth identity provider and authentication protocol details, CAPTCHA provider, and email service are **TBD**. OAuth-based sign-in must establish a verified identity; the specific login flow is not selected by this document.
- **Auditability and observability:** **Proposed:** Record owner configuration changes and inquiry-processing outcomes without unnecessarily logging visitor messages or personal details. Log retention, access, alerting, and metrics are **TBD**.
- **Other measurable constraints:** File-size limits, content lengths, form ranges, request limits, and numerical service targets remain **TBD**.

### Visual design requirements

Use a soft, warm, organic green palette that conveys comfort, tenderness, and natural warmth for families and expecting mothers. Keep backgrounds bright and airy. Use muted sage and olive for subtle accents, buttons, and borders.

| Element          | Color name            | Hex code  | Purpose                                                           |
| ---------------- | --------------------- | --------- | ----------------------------------------------------------------- |
| Primary accent   | Soft Sage             | `#9CAF88` | Booking buttons, main navigation links, or active states          |
| Secondary accent | Muted Olive           | `#6E7A5F` | Footer backgrounds, contact forms, or structural subheadings      |
| Light background | Warm Cream / Linen    | `#F9F6F0` | Main website background; bright and soft                          |
| Dark neutral     | Charcoal / Soft Slate | `#2F3431` | Body text and main logo                                           |
| Highlight        | Soft Linen Rose       | `#EADBC8` | Soft borders or backdrop overlays behind selected portfolio cards |

Typography, final logo, spacing, component states, and responsive compositions are **TBD**.

## Examples and representative data

- **Representative input:** The following fictional inquiry illustrates field coverage; it does not define required fields or valid ranges.

  | Field                    | Example                                             |
  | ------------------------ | --------------------------------------------------- |
  | First name / last name   | Avery / Morgan                                      |
  | Email                    | avery.morgan@example.com                            |
  | Phone number             | 202-555-0142                                        |
  | Preferred contact method | Email                                               |
  | Postal code              | 06484                                               |
  | Type of photo shoot      | Family                                              |
  | Preferred day            | 2027-05-15                                          |
  | Special requests         | Outdoor photos with natural light                   |
  | Session length           | 1 hour, if permitted by the configured range        |
  | Number of people         | 4, if permitted by the configured range             |
  | Shoot location           | An owner-configured location                        |
  | Referral source          | Word of mouth                                       |
  | Message to Rebekah       | Please share your availability and package details. |

- **Representative output:** An inquiry email to the configured recipient containing the submitted contact details, preferred contact method, photo shoot type, session notes, referral source, and message. Exact email layout is **TBD**.
- **Given/When/Then example:** Given published family-session pricing, when a visitor selects its **Book Now** button, then the Contact page opens.
- **Boundary examples:**
  - A gallery with one published image still renders responsively.
  - A number-of-people value outside the final allowed integer choices is rejected under the proposed validation contract.
  - For a banner scheduled from time A to time B, behavior exactly at A and B cannot be finalized until schedule boundary rules and timezone are chosen.
  - A visitor arriving at the private admin URL without authorization cannot view or modify owner content.

## Acceptance Criteria

These criteria cover confirmed brief requirements. Criteria depending on missing content or configuration are executable once those inputs are supplied. Proposed behavior above is not approved merely by inclusion in this draft.

| ID    | Given                                                                        | When                                                                | Then                                                                                                                                                                   |
| ----- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-01 | The desktop header is displayed                                              | A visitor inspects navigation                                       | The logo is centered; Maternity, Newborn, and Family appear to its left; About, Contact, and FAQ appear to its right; each link reaches its corresponding destination. |
| AC-02 | Content is published for each photo shoot type                               | A visitor opens Maternity, Newborn, or Family                       | The page describes that service and includes a “How It Works” section.                                                                                                 |
| AC-03 | Approved gallery images are published                                        | A visitor opens Home at supported viewport sizes                    | The home page displays a responsive image gallery.                                                                                                                     |
| AC-04 | Rebekah is authenticated and authorized                                      | She successfully adds or removes a gallery image                    | Subsequent public gallery views reflect the saved change within the agreed publishing delay.                                                                           |
| AC-05 | A banner has a valid configured schedule                                     | Its display window becomes active under the agreed scheduling rules | The configured message appears beneath the navigation header on the agreed pages.                                                                                      |
| AC-06 | Pricing is published                                                         | A visitor opens the pricing page                                    | Pricing information is available for maternity, newborn, and family sessions.                                                                                          |
| AC-07 | The pricing page is available                                                | A visitor invokes its print capability                              | A readable pricing schedule is available through printing.                                                                                                             |
| AC-08 | The pricing schedule is available                                            | A visitor invokes PDF download                                      | A readable PDF containing the pricing schedule is downloaded.                                                                                                          |
| AC-09 | A visitor can see Book Now                                                   | The visitor selects it                                              | The Contact page opens.                                                                                                                                                |
| AC-10 | FAQ content is published                                                     | A visitor opens FAQ                                                 | Answers cover what to expect, what to wear, when payment is due, and deposits.                                                                                         |
| AC-11 | A visitor opens Contact                                                      | The form renders                                                    | Every field and control in the contact-form input table is present, including CAPTCHA and Submit.                                                                      |
| AC-12 | The contact form is displayed                                                | The visitor chooses a contact method or photo shoot type            | Contact-method choices are email, call, and text; photo shoot choices are maternity, newborn, and family.                                                              |
| AC-13 | Rebekah saves valid location or referral-source configuration                | A visitor loads a new contact form                                  | The relevant dropdown displays the configured options; initial referral options include business card, word of mouth, and social media.                                |
| AC-14 | A submission meets the agreed validation rules and passes CAPTCHA            | The visitor submits and email processing succeeds                   | The submitted information is emailed to the configured recipient, initially tbd@gmail.com.                                                                             |
| AC-15 | Rebekah changes the recipient to another valid address                       | A later valid inquiry is processed                                  | Delivery is directed to the updated configured address.                                                                                                                |
| AC-16 | A visitor has not passed CAPTCHA verification                                | The visitor attempts to submit an inquiry                           | The inquiry is not dispatched by bypassing CAPTCHA.                                                                                                                    |
| AC-17 | An unauthenticated visitor or an authenticated non-owner knows the admin URL | They request the admin page or an owner operation                   | Private owner access and modification are denied.                                                                                                                      |
| AC-18 | Rebekah completes the configured OAuth login and owner authorization         | She opens Admin                                                     | The protected admin area is accessible and includes Email templates, Session checklist, and Client questionnaire sections.                                             |
| AC-19 | Approved design assets and content are available                             | Public pages are reviewed                                           | They use the specified warm organic palette and bright, airy presentation.                                                                                             |

## Known unknowns and clarification need

Resolve these decisions before treating this draft as implementation-ready:

1. **Content and assets:** Final logo, authorized images, About copy, service descriptions, “How It Works” steps, FAQ answers, pricing/packages, deposit terms, and payment timing.
2. **Information architecture:** How visitors reach pricing, whether each service has a distinct page, mobile navigation behavior, banner page coverage, and any existing URLs to preserve.
3. **Gallery management:** Upload formats and limits, image count, ordering, cropping, captions, alternative-text editing, empty state, and publishing delay.
4. **Banner scheduling:** Timezone, start/end boundaries, overlapping banners, optional links, dismissal behavior, preview, and expired-banner handling.
5. **Form validation:** Required fields, conditional email/phone requirements, postal-code regions, text limits, allowed dates, session-length range/increment, party-size range, defaults, and stale dropdown handling.
6. **Inquiry workflow:** Confirm the production recipient; choose email subject/body, sender/reply-to, visitor feedback, optional acknowledgment email, persistence, duplicate handling, retries, and failed-delivery notification.
7. **Admin behavior:** Identity provider, authorized owner account, private path, session/logout behavior, and actual workflows for email templates, session checklist, and client questionnaire.
8. **Pricing distribution:** Who edits pricing, how PDF content stays current, print layout/page size, and where print/download actions appear.
9. **Technology and operations:** Frontend/backend stack, hosting, storage, email and CAPTCHA providers, deployment, backups, and monitoring.
10. **Quality targets and privacy:** Browser/device coverage, accessibility standard, performance/availability targets, retention/deletion rules, image permissions, and privacy/consent text.
11. **Proposed behavior approval:** Confirm or revise the proposed error/recovery contract, pricing consistency rule, admin configuration grouping, and operational safeguards before implementation.
