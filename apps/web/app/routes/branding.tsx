import { renderToStaticMarkup } from 'react-dom/server';
import * as React from 'react';
import { HomeIntro } from '../components/HomeIntro';

export interface BrandingConfig {
  origin: string;
  contactEmail: string;
}

export function validateBrandingConfig(config: BrandingConfig) {
  const origin = new URL(config.origin);
  if (
    origin.protocol !== 'https:' ||
    origin.username ||
    origin.password ||
    origin.port ||
    origin.pathname !== '/' ||
    origin.search ||
    origin.hash ||
    !origin.hostname.includes('.') ||
    /(?:\.invalid|\.localhost|\.test)$|replace-|localhost/i.test(origin.hostname)
  )
    throw new Error('BRANDING_ORIGIN must be the real HTTPS origin without a path or credentials.');
  if (
    !/^[^\s<>"@]+@[^\s<>"@]+\.[^\s<>"@]+$/.test(config.contactEmail) ||
    /\.invalid$|replace-/i.test(config.contactEmail)
  )
    throw new Error('BRANDING_CONTACT_EMAIL must be the approved monitored public email.');
}

export function PrivacyPolicy({ contactEmail }: { contactEmail: string }) {
  return (
    <>
      <p className="eyebrow">Your information, handled with care</p>
      <h1>Privacy policy</h1>
      <p>Last updated November 17, 2026</p>
      <p>
        Radiant Images is Rebekah’s maternity, newborn and family photography business. This policy
        explains how Radiant Images handles information through its website and private business
        application.
      </p>
      <section>
        <h2>Information we use</h2>
        <p>
          If you email us, we receive the information you choose to send, such as your name, email
          address and session details. Email is handled through our business mailbox.
        </p>
        <p>
          The business application supports session inquiries, client contact records, session notes
          and checklists, client questionnaires and client email history. Inquiry form contents are
          forwarded by email and are not saved as an inquiry record in the application database.
          Rebekah may separately create a client record from an inquiry. Questionnaire answers and
          client records are private to authorized business access.
        </p>
        <p>
          Portfolio photographs are published only with permission, including guardian permission
          where applicable. Public image versions remove GPS and unnecessary camera metadata;
          originals and recovery copies are private.
        </p>
      </section>
      <section>
        <h2>Google sign-in and Gmail access</h2>
        <p>
          Google sign-in is for the authorized business owner. We use the owner’s Google account
          identifier, verified email address and sign-in information to control access. Visitors do
          not need to connect a Google account.
        </p>
        <p>
          The owner authorizes <code>gmail.send</code> so the application can forward inquiries and
          send owner-initiated client messages and questionnaire invitations through the connected
          business Gmail account. It receives Gmail message identifiers to record accepted client
          sends.
        </p>
        <p>
          The owner also authorizes <code>gmail.settings.basic</code>. Although this permission
          allows broader settings operations, this application only reads send-as address settings
          to check that the configured sender is the primary address or a verified alias. It does
          not change Gmail settings or read inbox messages.
        </p>
        <p>
          Google authorization tokens are stored as server-side secrets and used to obtain
          short-lived access tokens. They are not included in public pages. Authorized email
          delivery uses recipient addresses and message contents; client email history stores the
          sent subject and body with questionnaire links omitted.
        </p>
        <p>
          Radiant Images’ use and transfer of information received from Google APIs adheres to the{' '}
          <a href="https://developers.google.com/terms/api-services-user-data-policy">
            Google API Services User Data Policy
          </a>
          , including the Limited Use requirements. Google data is used to provide these business
          communication and access features. We do not sell it, use it for advertising, or use it to
          train generalized AI models. Access is limited to operating these features, necessary
          security work, legal obligations, or assistance with the account holder’s consent.
        </p>
        <p>
          The account holder can revoke access at{' '}
          <a href="https://myaccount.google.com/connections">Google Account connections</a> and
          contact us to request removal of the stored connection. Revocation stops future authorized
          access; it does not erase messages already delivered or independently retained business
          records.
        </p>
      </section>
      <section>
        <h2>Service providers and sharing</h2>
        <p>
          Cloudflare hosts the website and application, database, private photo storage and recovery
          copies. Google provides owner sign-in and Gmail delivery. Pixieset is used separately for
          client photo delivery and has its own privacy and retention practices. Email recipients
          and their providers receive messages addressed to them. We may also disclose information
          when required by law.
        </p>
        <p>
          These informational pages do not run advertising trackers, analytics scripts, a sign-in
          widget or a contact form. Hosting providers may process network information, such as IP
          addresses and request details, to deliver and secure the site. If you later use the
          application’s inquiry form, Cloudflare Turnstile processes anti-abuse information. Private
          sign-in uses session credentials; security controls use limited rate-limit and
          duplicate-submission data.
        </p>
      </section>
      <section>
        <h2>Retention and deletion</h2>
        <p>
          Live client records, questionnaire answers and email history remain until the business
          owner removes them; the application does not automatically expire all client records after
          a fixed period. Unsubmitted questionnaire links expire after 30 days. Security logs avoid
          inquiry bodies, client contact details, questionnaire answers and raw invitation links.
        </p>
        <p>
          Application recovery copies become ineligible for restoration at 28 days, when verified
          deletion attempts begin. Removal targets 30 days. Minimal deletion receipts, containing
          record identifiers and deletion times, target cleanup at 31 days, but are preserved while
          needed to prevent deleted records from returning through a restore. These periods describe
          recovery-copy age, not a promise that every live record expires after 30 days.
        </p>
        <p>
          Provider deletion delays can occur. Cleanup is retried and monitored; overdue copies
          remain ineligible for restoration. Removing an application record does not remove messages
          from a Gmail mailbox or a recipient’s mailbox, or delete separate Pixieset collections.
          Those copies follow their provider and business retention processes.
        </p>
      </section>
      <section>
        <h2>Contact and requests</h2>
        <p>
          For questions about this policy, access or correction requests, deletion requests, or to
          withdraw photo-publication permission, email{' '}
          <a href={`mailto:${contactEmail}`}>{contactEmail}</a>. We may need to verify your identity
          before changing or disclosing private information. Please avoid sending sensitive
          information that is unnecessary for your request.
        </p>
        <p>We will update this page when our practices change.</p>
      </section>
    </>
  );
}

function BrandingHome({ contactEmail }: { contactEmail: string }) {
  return (
    <>
      <HomeIntro>
        <a className="button" href={`mailto:${contactEmail}`}>
          Let’s plan your session
        </a>
      </HomeIntro>
      <section>
        <div className="section-heading">
          <p className="eyebrow">Your next chapter</p>
          <h2>A little of life, kept forever.</h2>
        </div>
        <div className="collections">
          <article>
            <h3>Maternity</h3>
            <p>Celebrate the anticipation of a new beginning.</p>
          </article>
          <article>
            <h3>Newborn</h3>
            <p>Remember the small details of your earliest days together.</p>
          </article>
          <article>
            <h3>Family</h3>
            <p>Hold on to the connections that make your family yours.</p>
          </article>
        </div>
        <p>
          To ask about a session, email <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
        </p>
      </section>
      <section>
        <h2>About the Radiant Images application</h2>
        <p>
          Radiant Images also uses a private business application to manage photography inquiries,
          client details, session checklists, questionnaires and client communications. Google
          sign-in restricts business access to the authorized owner. The owner connects the business
          Gmail account to send inquiry notifications and client messages and to verify the sending
          address. Visitors do not need to grant Gmail access.
        </p>
        <p>
          Read our <a href="/privacy">privacy policy</a> for how information and Google data are
          used, stored and deleted.
        </p>
      </section>
    </>
  );
}

export function renderBrandingPage(path: string, config: BrandingConfig): string {
  validateBrandingConfig(config);
  let content: React.ReactNode;
  if (path === '/') content = <BrandingHome contactEmail={config.contactEmail} />;
  else if (path === '/privacy') content = <PrivacyPolicy contactEmail={config.contactEmail} />;
  else throw new Error('Unknown branding page');
  const title =
    path === '/' ? 'Radiant Images | Photography by Rebekah' : 'Privacy Policy | Radiant Images';
  return (
    '<!doctype html>' +
    renderToStaticMarkup(
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>{title}</title>
          <meta
            name="description"
            content={
              path === '/'
                ? 'Maternity, newborn and family photography by Rebekah. Contact Radiant Images to plan your session.'
                : 'How Radiant Images uses, stores and deletes personal information and Google account data.'
            }
          />
          <link rel="canonical" href={new URL(path, config.origin).href} />
          <link rel="stylesheet" href="/styles.css" />
        </head>
        <body>
          <a className="skip-link" href="#main">
            Skip to content
          </a>
          <header>
            <a href="/" aria-label="Radiant Images home">
              <img
                src="/logo-320.webp"
                srcSet="/logo-320.webp 320w, /logo-640.webp 640w"
                sizes="(max-width: 600px) 160px, 260px"
                width="320"
                height="160"
                alt="Radiant Images Photography by Rebekah Galarza"
              />
            </a>
            <nav aria-label="Main navigation">
              <a href="/" aria-current={path === '/' ? 'page' : undefined}>
                Home
              </a>
              <a href="/privacy" aria-current={path === '/privacy' ? 'page' : undefined}>
                Privacy
              </a>
              <a href={`mailto:${config.contactEmail}`}>Contact</a>
            </nav>
          </header>
          <main id="main" className={path === '/privacy' ? 'policy' : undefined}>
            {content}
          </main>
          <footer>
            <a href="/">Radiant Images</a>
            <p>Maternity · Newborn · Family</p>
            <a href="/privacy">Privacy policy</a>
            <p>
              <a href={`mailto:${config.contactEmail}`}>{config.contactEmail}</a>
            </p>
          </footer>
        </body>
      </html>,
    )
  );
}
