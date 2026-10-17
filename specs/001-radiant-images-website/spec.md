# Feature Specification: Radiant Images Photography Website

**Feature Branch**: `001-radiant-images-website`

**Created**: 2026-10-17

**Status**: Draft

**Input**: User description: "Radiant Images MVP Technical Feature Specification — a photography business website for Rebekah (owner) offering maternity, newborn, and family photo shoots, with public information pages, a responsive portfolio gallery, pricing (printable + PDF), FAQs, a CAPTCHA-protected inquiry form that emails a configurable recipient, and an authenticated owner administration area for gallery, banner scheduling, and contact-form configuration."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Discover Services and Submit an Inquiry (Priority: P1)

A prospective client (typically an expecting mother or a parent) lands on the Radiant Images home page, sees the branded header and a responsive gallery of Rebekah's work, reads about the maternity, newborn, or family session type they're interested in (including a "How It Works" walk-through), checks the FAQ, and then selects **Book Now** to reach the Contact page. There they enter their details, session preferences, and a message, complete the CAPTCHA, and submit. The inquiry is delivered by email to Rebekah's configured inbox and the visitor sees honest feedback about what happened.

**Why this priority**: This is the core business value of the site — turning visitors into inquiries. Without it, the site is a brochure with no conversion path. Every other story supports or enhances this one.

**Independent Test**: Can be fully tested by publishing static service content, opening the site as an anonymous visitor, navigating to each service page, selecting Book Now, completing the form with valid data and CAPTCHA, and confirming the inquiry email arrives at the configured recipient. Delivers a working lead-capture website on its own.

**Acceptance Scenarios**:

1. **Given** the desktop site is loaded, **When** a visitor views the header, **Then** the logo is centered, Maternity / Newborn / Family links appear to its left, About / Contact / FAQ links appear to its right, and each link opens its destination.
2. **Given** content is published for each shoot type, **When** a visitor opens Maternity, Newborn, or Family, **Then** the page describes that service in a consistent, welcoming voice and includes a "How It Works" section.
3. **Given** a visitor is on any page showing **Book Now**, **When** they select it, **Then** the Contact page opens.
4. **Given** FAQ content is published, **When** a visitor opens FAQ, **Then** answers are present for at least: what to expect, what to wear, when payment is due, and deposits.
5. **Given** a visitor opens Contact, **When** the form renders, **Then** every field in the Contact Form Inputs list is present, including CAPTCHA and Submit; contact-method choices are Email / Call / Text and shoot-type choices are Maternity / Newborn / Family.
6. **Given** a visitor completes the form with valid values and passes CAPTCHA, **When** they submit and email dispatch is accepted, **Then** the submitted information is emailed to the configured recipient and the visitor sees a confirmation that their inquiry was sent (not that a booking is confirmed).
7. **Given** a visitor has not passed CAPTCHA or has invalid/missing required fields, **When** they attempt to submit, **Then** no email is dispatched, field-level errors are shown, and valid entered values are preserved.
8. **Given** a visitor selects "Call" or "Text" as preferred contact method, **When** they submit without a phone number, **Then** the form rejects the submission and indicates phone is required for that method.
9. **Given** the email service is unavailable, **When** a visitor submits a valid inquiry, **Then** the visitor is shown a clear "we couldn't send your inquiry, please try again" message rather than a success confirmation, and their entered values are preserved.
10. **Given** a visitor is on a narrow (mobile) viewport, **When** they load any public page, **Then** the gallery reflows to fit the screen and navigation remains usable via a collapsed menu.

---

### User Story 2 - Review, Print, and Download Pricing (Priority: P2)

A visitor who is comparing photographers wants to see what Radiant Images charges for maternity, newborn, and family sessions. They open the pricing page, read the packages for all three shoot types, and either print the page or download a PDF to share with a partner or keep for later. From the pricing page they can select **Book Now** to start an inquiry.

**Why this priority**: Pricing transparency is a primary decision input for clients and a frequent pre-inquiry question; the print/PDF capability was explicitly requested. It is secondary only because inquiries can still be made without it.

**Independent Test**: Can be tested by publishing pricing content, opening the pricing page, verifying all three shoot types are covered, invoking print and confirming a readable printed layout, and invoking PDF download and confirming the downloaded document contains the same pricing.

**Acceptance Scenarios**:

1. **Given** pricing is published, **When** a visitor opens the pricing page, **Then** pricing information is shown for maternity, newborn, and family sessions.
2. **Given** the pricing page is open, **When** the visitor invokes Print, **Then** a readable, print-formatted pricing schedule is produced without navigation chrome.
3. **Given** the pricing page is open, **When** the visitor invokes Download PDF, **Then** a PDF containing the same pricing schedule as the web page is downloaded.
4. **Given** PDF generation fails, **When** the visitor invokes Download PDF, **Then** a clear error is shown and the web pricing page and Print action remain available.
5. **Given** the pricing page is open, **When** the visitor selects **Book Now**, **Then** the Contact page opens.

---

### User Story 3 - Owner Manages the Gallery (Priority: P3)

Rebekah signs in through the OAuth login at the private admin route, opens the gallery management section, uploads new session images, removes images she no longer wants shown, and optionally reorders them. The public home page gallery reflects her changes.

**Why this priority**: Fresh portfolio imagery is central to a photography business and the brief explicitly requires that Rebekah can add/remove images "at any time" without developer involvement. It depends on the authenticated admin area existing.

**Independent Test**: Can be tested by signing in as the owner, adding an image, confirming it appears on the public home page, removing it, and confirming it disappears; plus confirming an unauthenticated or non-owner user cannot reach the gallery controls.

**Acceptance Scenarios**:

1. **Given** Rebekah is authenticated and authorized, **When** she adds a valid image, **Then** the image appears in the public gallery within the publishing window (see SC-005).
2. **Given** Rebekah is authenticated and authorized, **When** she removes an image, **Then** it no longer appears in the public gallery.
3. **Given** an image upload fails (file too large, unsupported type, or save error), **When** the failure occurs, **Then** the previously published gallery is unchanged and Rebekah sees an actionable error.
4. **Given** the gallery has zero images, **When** a visitor opens Home, **Then** the page renders cleanly with a friendly placeholder instead of a broken or empty area.
5. **Given** the gallery has one image or many (up to the configured maximum), **When** a visitor opens Home, **Then** the gallery renders responsively.

---

### User Story 4 - Owner Schedules a Promotion or Alert Banner (Priority: P4)

Rebekah wants to announce a seasonal mini-session promotion or an alert (e.g., "Studio closed Dec 24–26"). In the admin area she creates a banner with a message, start date/time, and end date/time. Visitors see the banner directly beneath the header while it is active; it disappears automatically when the window ends, leaving no empty gap.

**Why this priority**: Promotions drive seasonal bookings and alerts reduce support friction, but the site is fully functional without them.

**Independent Test**: Can be tested by creating a banner with a window spanning "now", confirming it displays beneath the header on public pages, then setting the end time in the past and confirming it no longer displays.

**Acceptance Scenarios**:

1. **Given** a banner has a schedule whose window includes the current time, **When** a visitor loads any public page, **Then** the banner message appears directly beneath the navigation header.
2. **Given** no banner is currently active, **When** a visitor loads a public page, **Then** no banner area or empty gap is shown.
3. **Given** two banners have overlapping active windows, **When** a visitor loads a page, **Then** exactly one banner (the one with the most recent start time) is shown.
4. **Given** Rebekah edits or deletes a banner, **When** the change is saved, **Then** public pages reflect the change on next load.

---

### User Story 5 - Owner Configures Contact-Form Options and Recipient (Priority: P5)

Rebekah changes the email address that receives inquiries, edits the list of shoot locations visitors can choose from, and edits the referral-source options ("How did you hear about us?"). New inquiries go to the updated address and new visitors see the updated dropdown options.

**Why this priority**: Keeps the inquiry pipeline accurate as the business evolves without developer involvement. Lower priority because defaults can be seeded at launch.

**Independent Test**: Can be tested by changing the recipient address and submitting an inquiry (verify delivery to the new address), and by adding/removing a location or referral option and reloading the public contact form (verify the dropdown reflects it).

**Acceptance Scenarios**:

1. **Given** Rebekah saves a new valid recipient address, **When** a later valid inquiry is submitted, **Then** it is delivered to the new address.
2. **Given** Rebekah saves updated location or referral-source options, **When** a visitor loads a new contact form, **Then** the dropdown shows the updated options.
3. **Given** Rebekah removes a dropdown option while a visitor has a form open with that option selected, **When** the visitor submits, **Then** the submission is rejected with a message asking them to reselect from the current options.
4. **Given** Rebekah enters an invalid recipient address, **When** she tries to save, **Then** the save is rejected and the prior recipient remains in effect.

---

### User Story 6 - Owner Manages Clients with Templates, Checklists, and Questionnaires (Priority: P6)

Within the admin area Rebekah maintains a lightweight list of clients (people she is actively working with, created manually or from an inquiry's details). For each client she can send an email composed from one of her saved email templates, track a per-client session checklist (e.g., deposit received, wardrobe guide sent, location confirmed), and send a client questionnaire whose responses she can review once the client fills it in. She also maintains the library of email templates, the master checklist items, and the questionnaire questions themselves.

**Why this priority**: Explicitly requested in the brief and valuable for Rebekah's day-to-day workflow, but it is an owner-productivity capability rather than a visitor-facing conversion path, so it ships after the public site and core admin controls.

**Independent Test**: Can be tested by signing in as the owner, creating a client, sending a template email to that client and confirming receipt, checking off checklist items and confirming they persist per client, sending the questionnaire link and submitting it as the client, and confirming the responses are visible to Rebekah.

**Acceptance Scenarios**:

1. **Given** Rebekah is authenticated and authorized, **When** she opens Admin, **Then** the Email Templates, Session Checklist, and Client Questionnaire sections are present and navigable.
2. **Given** Rebekah is in Admin, **When** she creates a client record (name, email, optional phone, shoot type, optional session date), **Then** the client appears in her client list and can be opened.
3. **Given** Rebekah has at least one saved email template, **When** she selects a client, chooses a template, optionally edits the message, and sends, **Then** the email is delivered to the client's address from the business sender identity and the send is recorded on the client's history.
4. **Given** Rebekah opens a client's checklist, **When** she marks items complete or incomplete, **Then** the state is saved for that client only and shown on return.
5. **Given** Rebekah edits the master checklist (add, remove, rename, reorder items), **When** she saves, **Then** new clients receive the updated list; existing clients keep their recorded progress for items that still exist.
6. **Given** Rebekah sends the questionnaire to a client, **When** the client opens the unique link and submits answers, **Then** the responses are stored against that client and visible to Rebekah; the link cannot be used to view another client's data.
7. **Given** Rebekah edits the questionnaire questions, **When** she saves, **Then** future questionnaire sends use the new questions and previously collected responses remain readable.
8. **Given** a questionnaire link has already been submitted or is older than 30 days, **When** a client opens it, **Then** they see a message that the questionnaire is closed, and no further submissions are accepted.

---

### Edge Cases

- **Gallery sizing**: zero images shows a placeholder; one image renders responsively; the gallery is capped at a configured maximum (default 60) with uploads beyond it rejected with a clear message.
- **Banner boundaries**: windows are evaluated in the owner's configured timezone (default America/New_York); start is inclusive, end is exclusive. Overlapping banners resolve to the most recently started.
- **Date selection**: the preferred-day picker rejects dates in the past and dates more than 18 months in the future.
- **Numeric bounds**: session length is selectable from 1 to 4 hours in 1-hour steps; number of people is selectable from 1 to 12. Out-of-range values are rejected server-side even if the browser control is bypassed.
- **Stale dropdown values**: a submission containing a location or referral option that no longer exists is rejected with a prompt to reselect.
- **Duplicate submission**: the Submit control is disabled while a request is in flight; an identical submission (same email + message) within 2 minutes is treated as a duplicate and not re-emailed.
- **CAPTCHA expiry**: an expired challenge prompts the visitor to complete a fresh one; entered values are retained.
- **Login expiry**: an expired owner session redirects to login; any unsaved admin changes are not applied.
- **Image load failure**: a broken image shows an unobtrusive placeholder without breaking the gallery layout.
- **External service outage** (identity provider, CAPTCHA, email): the site never bypasses verification or authorization and never reports false success.
- **Unauthorized admin access**: knowing the private admin URL grants nothing; unauthenticated users are sent to login, authenticated non-owners are denied, and the underlying owner operations are equally protected.

## Requirements *(mandatory)*

### Functional Requirements

**Public navigation and content**

- **FR-001**: System MUST display a header with the logo centered, Maternity / Newborn / Family links to its left, and About / Contact / FAQ links to its right on desktop viewports, with each link reaching its destination.
- **FR-002**: System MUST provide a collapsed (menu-toggle) navigation on narrow viewports that exposes all six links.
- **FR-003**: System MUST provide a dedicated page for each shoot type (Maternity, Newborn, Family) containing a service description and a "How It Works" section, written in a consistent, welcoming voice.
- **FR-004**: System MUST provide an About page and an FAQ page; the FAQ MUST cover what to expect, what to wear, when payment is due, and deposits.
- **FR-005**: System MUST display a responsive image gallery on the home page that adapts to desktop, tablet, and mobile viewports.
- **FR-006**: System MUST display a **Book Now** control on the home page, each service page, and the pricing page, which routes to the Contact page.
- **FR-007**: System MUST render all public pages using the specified warm organic palette (Soft Sage `#9CAF88`, Muted Olive `#6E7A5F`, Warm Cream `#F9F6F0`, Charcoal `#2F3431`, Soft Linen Rose `#EADBC8`) with a bright, airy presentation that emphasizes photography.

**Pricing**

- **FR-008**: System MUST provide a pricing page covering maternity, newborn, and family sessions.
- **FR-009**: System MUST allow visitors to print the pricing page in a readable print layout free of navigation chrome.
- **FR-010**: System MUST allow visitors to download the pricing schedule as a PDF whose content matches the currently published web pricing.
- **FR-011**: Owner MUST be able to edit the pricing schedule (packages, descriptions, and prices for each shoot type) in Admin; the web pricing page, print layout, and downloadable PDF MUST all be produced from that single published pricing revision so they can never diverge.

**Promotion / alert banner**

- **FR-012**: System MUST display at most one active banner directly beneath the header on all public pages when the current time falls within a banner's scheduled window.
- **FR-013**: System MUST omit the banner area entirely (no empty gap) when no banner is active.
- **FR-014**: Owner MUST be able to create, edit, and delete banners, each with a message, start date/time, and end date/time.

**Contact / inquiry form**

- **FR-015**: System MUST present a contact form with these inputs: first name, last name, email, phone number, preferred contact method (Email / Call / Text), postal code, type of photo shoot (Maternity / Newborn / Family), preferred day (date picker), special requests, session length (hour selector), number of people (integer selector), shoot location (owner-configured dropdown), how the visitor heard about the business (owner-configured dropdown), message to Rebekah, CAPTCHA, and Submit.
- **FR-016**: System MUST require first name, last name, email, preferred contact method, type of photo shoot, and CAPTCHA; phone number MUST be required when preferred contact method is Call or Text. All other fields are optional.
- **FR-017**: System MUST validate every submission on the server regardless of browser-side validation, enforcing field formats, lengths (max 2,000 characters for free-text fields), the date window, and numeric ranges defined in Edge Cases.
- **FR-018**: System MUST verify the CAPTCHA response before any email dispatch and MUST NOT provide a path to submit that bypasses CAPTCHA.
- **FR-019**: System MUST email the submitted inquiry to the single owner-configured recipient address (initially `tbd@gmail.com`, to be confirmed before launch). Visitors MUST NOT be able to influence the destination address.
- **FR-020**: System MUST show the visitor feedback that reflects the actual outcome: success only when the email provider has accepted the message; a retryable error otherwise. Feedback MUST NOT describe the inquiry as a confirmed booking.
- **FR-021**: System MUST preserve valid entered values when a submission fails validation, CAPTCHA, or dispatch.
- **FR-022**: System MUST prevent duplicate dispatch from repeated clicks or rapid resubmission (see Edge Cases).
- **FR-023**: System MUST NOT persist inquiry content after processing; the email to the configured recipient is the system of record. Only an operational audit entry (timestamp, outcome, no personal details or message body) is retained. If dispatch fails, the visitor is told to retry — the system does not queue or retry on their behalf.

**Owner administration**

- **FR-024**: System MUST expose owner administration at a private route and MUST require sign-in through an OAuth-based identity provider that yields a verified identity.
- **FR-025**: System MUST authorize only the configured owner account(s) for administration; authenticated non-owner identities MUST be denied both the admin pages and all underlying owner operations.
- **FR-026**: System MUST expire owner sessions after 24 hours of inactivity and provide an explicit sign-out.
- **FR-027**: Owner MUST be able to add images to and remove images from the home-page gallery, and reorder them; uploads are limited to JPEG/PNG/WebP up to 10 MB each, and the gallery is capped at 60 images.
- **FR-028**: Owner MUST be able to configure the inquiry recipient address, the shoot-location options, and the referral-source options; referral-source options MUST initially include Business Card, Word of Mouth, and Social Media.
- **FR-029**: System MUST reject invalid configuration (e.g., malformed email, empty option list) and retain the previously saved configuration.
- **FR-030**: System MUST apply owner changes atomically — a failed save MUST NOT partially publish.
- **FR-031**: Owner MUST be able to create, edit, and delete client records (name, email, optional phone, shoot type, optional session date, notes) and view each client's activity history (emails sent, checklist state, questionnaire status).
- **FR-031a**: Owner MUST be able to maintain a library of email templates (name, subject, body with simple placeholders such as client first name and session date) and send a template-based email to a selected client, editing the message before sending; each send MUST be recorded on the client's history.
- **FR-031b**: Owner MUST be able to maintain a master session checklist (ordered items) and mark items complete/incomplete per client; per-client progress MUST persist independently.
- **FR-031c**: Owner MUST be able to maintain the client questionnaire (ordered questions with short-text, long-text, or single-choice answers), send a unique questionnaire link to a client, and review that client's responses. Links MUST be single-use, expire after 30 days, and MUST NOT expose any other client's data.
- **FR-031d**: Owner MUST be able to create a client record pre-filled from an inquiry email's details by manual entry; automatic import from inquiries is not required (inquiries are not stored — see FR-023).
- **FR-032**: System MUST record an audit entry (who, what, when) for each owner configuration change and each inquiry-processing outcome, without storing the visitor's message body or personal details in logs.

**Accessibility, security, and quality**

- **FR-033**: Public pages and forms MUST be keyboard-operable, with labeled inputs, meaningful image alternative text, visible focus indicators, accessible error messaging, and text/background pairings that meet WCAG 2.1 AA contrast (palette colors may be adjusted in pairing to achieve this).
- **FR-034**: All traffic MUST be served over HTTPS; user-supplied text MUST be safely handled to prevent injection; credentials and provider secrets MUST never be exposed to the browser.
- **FR-035**: System MUST apply rate limiting to contact submissions and login attempts to deter abuse.

### Key Entities

- **Shoot Type**: One of Maternity, Newborn, Family. Each has a public service page with description and "How It Works" content and corresponding pricing.
- **Gallery Image**: An owner-uploaded photograph shown on the home page; has display order, alternative text, and published status.
- **Banner**: An owner-authored promotion or alert with message text, start date/time, end date/time, and optional link; displayed beneath the header when active.
- **Pricing Schedule**: The published pricing content for all three shoot types; the same revision drives the web page, print view, and PDF.
- **Inquiry**: A visitor's submitted contact form — contact details, preferred contact method, postal code, shoot type, preferred day, special requests, session length, number of people, shoot location, referral source, and message. Transient: delivered by email and not stored.
- **Site Configuration**: Owner-editable settings — inquiry recipient address, shoot-location options, referral-source options, timezone.
- **Owner Account**: The verified OAuth identity (or identities) authorized to administer the site.
- **FAQ Entry**: A question and answer shown on the FAQ page.
- **Client**: A person Rebekah is actively working with — name, email, optional phone, shoot type, optional session date, notes — with an activity history of emails sent, checklist progress, and questionnaire status.
- **Email Template**: A reusable owner-authored email (name, subject, body with placeholders) used to compose messages to clients.
- **Checklist Item / Client Checklist Progress**: The owner's master list of session preparation steps, and each client's complete/incomplete state per item.
- **Questionnaire / Questionnaire Response**: The owner's ordered set of questions, and a client's submitted answers collected through a unique, single-use, expiring link.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time visitor can navigate from the home page to a service page, pricing, and the Contact page in under 3 clicks each, and can complete and submit an inquiry in under 4 minutes.
- **SC-002**: 100% of valid, CAPTCHA-verified inquiries submitted during acceptance testing are received at the configured recipient address within 5 minutes.
- **SC-003**: 0 inquiries are dispatched without a passing CAPTCHA, and 0 admin pages or owner operations are reachable by unauthenticated or non-owner users during security testing.
- **SC-004**: Public pages become visually usable within 3 seconds on a typical mobile connection, and the gallery renders without horizontal scrolling at 320px, 768px, and 1280px widths.
- **SC-005**: Owner gallery and configuration changes are visible to the public within 60 seconds of a successful save.
- **SC-006**: Printed pricing and downloaded PDF pricing match the published web pricing exactly in 100% of spot checks.
- **SC-007**: Scheduled banners appear and disappear within 60 seconds of their configured start/end times.
- **SC-008**: At least 90% of acceptance-test participants complete an inquiry on the first attempt without assistance.
- **SC-009**: All public pages pass automated WCAG 2.1 AA checks with zero critical violations and are fully operable by keyboard.
- **SC-010**: Rebekah can add an image, remove an image, and schedule a banner without documentation or developer assistance in under 5 minutes total.
- **SC-011**: Rebekah can update a price in Admin and see the change reflected identically on the web page, print view, and PDF within 60 seconds.
- **SC-012**: Rebekah can create a client, send a template email, and send a questionnaire in under 3 minutes; 100% of questionnaire links used in testing resolve only to the intended client's record.

## Assumptions

- Rebekah is the sole administrator at launch; support for additional admin accounts is not required for MVP but must not be precluded.
- **Book Now** starts an inquiry; there is no appointment confirmation, availability calendar, online payment, client account, proofing/delivery gallery, or automated marketing in scope.
- No existing live site, URLs, content, or customer records need to be migrated or preserved.
- `tbd@gmail.com` is a placeholder recipient; the production address will be confirmed and set by Rebekah before launch.
- Final copy, photographs, logo, pricing, deposit terms, and session policies will be supplied or approved by Rebekah; reference sites inform tone and structure only, and no reference wording or assets will be reproduced.
- Rebekah holds the rights and client consent for every image she publishes; the system does not verify this.
- Each shoot type has its own public page; pricing lives on a single shared pricing page linked from each service page and the main navigation footer.
- Pricing is owner-edited in Admin; web, print, and PDF are all rendered from the same published revision (no separately uploaded PDF).
- Inquiries are not stored; the inquiry email is the system of record. Client records in Admin are created manually by Rebekah (typically by copying details from an inquiry email).
- Client-facing emails and questionnaire links are sent from the business sender identity using the same email delivery service as inquiries; client email addresses are entered by Rebekah and not independently verified.
- Client, checklist, and questionnaire data are retained until Rebekah deletes the client record; no automatic purge for MVP.
- Banner schedules use the owner's configured timezone (default America/New_York), inclusive start / exclusive end, and overlapping banners resolve to the most recently started.
- Contact-form defaults: phone required only for Call/Text; postal code free-text (US format expected but not enforced for MVP); preferred day limited to today through 18 months ahead; session length 1–4 hours in 1-hour steps; party size 1–12; free-text fields limited to 2,000 characters.
- Visitors do not receive an automatic acknowledgment email for MVP; on-screen confirmation is sufficient.
- Email delivery is considered successful when the email provider accepts the message; end-to-end delivery tracking is not required.
- Gallery limits: JPEG/PNG/WebP, 10 MB per image, 60 images maximum; images are displayed in owner-defined order with optional alternative text; no cropping or captions for MVP.
- Owner sessions expire after 24 hours of inactivity.
- Browser support targets the current and previous major versions of mainstream desktop and mobile browsers.
- Standard web-hosting availability is acceptable; no formal uptime guarantee is required for MVP, but daily backups of owner-managed content and configuration are expected.
- Privacy notice text will be supplied by Rebekah; because inquiries are not stored (FR-023), visitor data retention is limited to the email inbox Rebekah controls.
