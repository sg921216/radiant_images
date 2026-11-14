import { sql } from 'drizzle-orm';
import {
  sqliteTable,
  text,
  integer,
  primaryKey,
  uniqueIndex,
  index,
  check,
  foreignKey,
} from 'drizzle-orm/sqlite-core';
const id = () => text('id').primaryKey();
const at = (name: string) =>
  text(name)
    .notNull()
    .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`);
const timestamps = () => ({ createdAt: at('created_at'), updatedAt: at('updated_at') });
// The independent recovery ledger is never implicitly recreated after initialization.
export const lifecycleState = sqliteTable(
  'lifecycle_state',
  {
    id: integer('id').primaryKey(),
    ledgerId: text('ledger_id')
      .notNull()
      .default(sql`(lower(hex(randomblob(16))))`),
    initialized: integer('initialized').notNull().default(0),
    restoreStatus: integer('restore_status').notNull().default(0),
  },
  (t) => [
    check('lifecycle_singleton', sql`${t.id}=1`),
    check('lifecycle_initialized', sql`${t.initialized} IN (0,1)`),
    check('lifecycle_restore_status', sql`${t.restoreStatus} IN (0,1,2)`),
  ],
);
export const galleryImages = sqliteTable(
  'gallery_images',
  {
    id: id(),
    tag: text('tag').notNull(),
    altText: text('alt_text').notNull(),
    sortOrder: integer('sort_order').notNull().unique(),
    width: integer('width').notNull(),
    height: integer('height').notNull(),
    originalMime: text('original_mime').notNull(),
    originalBytes: integer('original_bytes').notNull(),
    originalWidth: integer('original_width').notNull(),
    originalHeight: integer('original_height').notNull(),
    ...timestamps(),
  },
  (t) => [
    check('gallery_tag', sql`${t.tag} IN ('maternity','newborn','family','general')`),
    check('gallery_alt', sql`length(trim(${t.altText})) BETWEEN 1 AND 200`),
    check(
      'gallery_pixels',
      sql`${t.width} BETWEEN 1 AND 2000 AND ${t.height} BETWEEN 1 AND 2000 AND ${t.originalWidth} BETWEEN 1 AND 16384 AND ${t.originalHeight} BETWEEN 1 AND 16384 AND ${t.originalWidth} * ${t.originalHeight} <= 40000000`,
    ),
    check('gallery_bytes', sql`${t.originalBytes} BETWEEN 1 AND 10485760`),
    check('gallery_mime', sql`${t.originalMime} IN ('image/jpeg','image/png','image/webp')`),
  ],
);
export const banners = sqliteTable(
  'banners',
  {
    id: id(),
    message: text('message').notNull(),
    linkUrl: text('link_url'),
    startsAt: text('starts_at').notNull(),
    endsAt: text('ends_at').notNull(),
    ...timestamps(),
  },
  (t) => [
    check('banner_window', sql`${t.endsAt}>${t.startsAt}`),
    check('banner_message', sql`length(${t.message}) BETWEEN 1 AND 200`),
    index('banner_window_idx').on(t.startsAt, t.endsAt),
  ],
);
export const pricingRevisions = sqliteTable('pricing_revisions', {
  id: id(),
  publishedAt: at('published_at'),
  createdBy: text('created_by').notNull(),
});
export const pricingPackages = sqliteTable(
  'pricing_packages',
  {
    id: id(),
    revisionId: text('revision_id')
      .notNull()
      .references(() => pricingRevisions.id, { onDelete: 'cascade' }),
    shootType: text('shoot_type').notNull(),
    sortOrder: integer('sort_order').notNull(),
    name: text('name').notNull(),
    priceCents: integer('price_cents').notNull(),
    description: text('description').notNull(),
    inclusions: text('inclusions').notNull(),
  },
  (t) => [
    uniqueIndex('package_order').on(t.revisionId, t.shootType, t.sortOrder),
    check('package_shoot', sql`${t.shootType} IN ('maternity','newborn','family')`),
    check('package_price', sql`${t.priceCents}>=0`),
    check('package_name', sql`length(trim(${t.name})) BETWEEN 1 AND 60`),
    check('package_description', sql`length(${t.description})<=500`),
    check(
      'package_inclusions',
      sql`json_valid(${t.inclusions}) AND json_array_length(${t.inclusions}) BETWEEN 1 AND 15`,
    ),
  ],
);
export const pricingPublication = sqliteTable(
  'pricing_publication',
  {
    id: integer('id').primaryKey(),
    currentRevisionId: text('current_revision_id')
      .notNull()
      .references(() => pricingRevisions.id),
  },
  (t) => [check('pricing_singleton', sql`${t.id}=1`)],
);
export const faqEntries = sqliteTable(
  'faq_entries',
  {
    id: id(),
    question: text('question').notNull(),
    answer: text('answer').notNull(),
    sortOrder: integer('sort_order').notNull().unique(),
    ...timestamps(),
  },
  (t) => [
    check(
      'faq_lengths',
      sql`length(trim(${t.question})) BETWEEN 1 AND 200 AND length(trim(${t.answer})) BETWEEN 1 AND 2000`,
    ),
  ],
);
export const pageContent = sqliteTable(
  'page_content',
  {
    page: text('page').primaryKey(),
    introMd: text('intro_md').notNull(),
    howItWorks: text('how_it_works').notNull(),
    updatedAt: at('updated_at'),
  },
  (t) => [
    check('page_name', sql`${t.page} IN ('about','maternity','newborn','family')`),
    check(
      'page_content_limits',
      sql`length(${t.introMd})<=4000 AND json_valid(${t.howItWorks}) AND json_array_length(${t.howItWorks})<=8`,
    ),
  ],
);
export const siteConfig = sqliteTable(
  'site_config',
  {
    id: integer('id').primaryKey(),
    inquiryRecipient: text('inquiry_recipient').notNull(),
    senderAddress: text('sender_address').notNull(),
    publicContactEmail: text('public_contact_email').notNull(),
    shootLocations: text('shoot_locations').notNull(),
    referralSources: text('referral_sources').notNull(),
    timezone: text('timezone').notNull(),
    updatedAt: at('updated_at'),
  },
  (t) => [
    check('config_singleton', sql`${t.id}=1`),
    check('public_email_required', sql`length(trim(${t.publicContactEmail})) BETWEEN 3 AND 254`),
    check(
      'config_lists',
      sql`json_valid(${t.shootLocations}) AND json_array_length(${t.shootLocations}) BETWEEN 1 AND 20 AND json_valid(${t.referralSources}) AND json_array_length(${t.referralSources}) BETWEEN 1 AND 20`,
    ),
  ],
);
export const inquiryDedupe = sqliteTable(
  'inquiry_dedupe',
  { hash: text('hash').primaryKey(), expiresAt: text('expires_at').notNull() },
  (t) => [check('dedupe_hash', sql`length(${t.hash})=64`), index('dedupe_expiry').on(t.expiresAt)],
);
export const rateLimitWindows = sqliteTable(
  'rate_limit_windows',
  {
    groupName: text('group_name').notNull(),
    subjectHash: text('subject_hash').notNull(),
    windowStart: integer('window_start').notNull(),
    requestCount: integer('request_count').notNull(),
    expiresAt: integer('expires_at').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.groupName, t.subjectHash, t.windowStart] }),
    check('rate_count', sql`${t.requestCount}>0`),
    index('rate_expiry').on(t.expiresAt),
  ],
);
export const sessions = sqliteTable(
  'sessions',
  {
    id: id(),
    tokenHash: text('token_hash').notNull().unique(),
    ownerEmail: text('owner_email').notNull(),
    lastSeenAt: text('last_seen_at').notNull(),
    absoluteExpiresAt: text('absolute_expires_at').notNull(),
    createdAt: at('created_at'),
  },
  (t) => [
    check('session_hash', sql`length(${t.tokenHash})=64`),
    index('session_expiry').on(t.absoluteExpiresAt),
  ],
);
export const oauthStates = sqliteTable(
  'oauth_states',
  {
    stateHash: text('state_hash').primaryKey(),
    browserHash: text('browser_hash').notNull(),
    nonceHash: text('nonce_hash').notNull(),
    createdAt: at('created_at'),
    expiresAt: text('expires_at').notNull(),
  },
  (t) => [
    check(
      'oauth_hashes',
      sql`length(${t.stateHash})=64 AND length(${t.browserHash})=64 AND length(${t.nonceHash})=64`,
    ),
  ],
);
export const exchangeCodes = sqliteTable(
  'exchange_codes',
  {
    codeHash: text('code_hash').primaryKey(),
    ownerEmail: text('owner_email').notNull(),
    createdAt: at('created_at'),
    expiresAt: text('expires_at').notNull(),
  },
  (t) => [
    check('grant_hash', sql`length(${t.codeHash})=64`),
    index('grant_expiry').on(t.expiresAt),
  ],
);
export const auditEvents = sqliteTable(
  'audit_events',
  {
    id: id(),
    at: at('at'),
    actor: text('actor').notNull(),
    action: text('action').notNull(),
    entityType: text('entity_type'),
    entityId: text('entity_id'),
    outcome: text('outcome').notNull(),
    requestId: text('request_id').notNull(),
    detail: text('detail'),
  },
  (t) => [check('audit_outcome', sql`${t.outcome} IN ('ok','error')`), index('audit_at').on(t.at)],
);
export const clients = sqliteTable(
  'clients',
  {
    id: id(),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    email: text('email').notNull(),
    phone: text('phone'),
    shootType: text('shoot_type').notNull(),
    sessionDate: text('session_date'),
    notes: text('notes').notNull().default(''),
    ...timestamps(),
  },
  (t) => [
    check('client_shoot', sql`${t.shootType} IN ('maternity','newborn','family')`),
    check(
      'client_lengths',
      sql`length(trim(${t.firstName})) BETWEEN 1 AND 80 AND length(trim(${t.lastName})) BETWEEN 1 AND 80 AND length(${t.notes})<=4000`,
    ),
    index('clients_name').on(t.lastName, t.firstName),
  ],
);
export const emailTemplates = sqliteTable(
  'email_templates',
  {
    id: id(),
    name: text('name').notNull().unique(),
    subject: text('subject').notNull(),
    body: text('body').notNull(),
    sortOrder: integer('sort_order').notNull(),
    ...timestamps(),
  },
  (t) => [
    check(
      'template_limits',
      sql`length(${t.name}) BETWEEN 1 AND 80 AND length(${t.subject}) BETWEEN 1 AND 200 AND length(${t.body}) BETWEEN 1 AND 10000`,
    ),
  ],
);
export const checklistItems = sqliteTable(
  'checklist_items',
  {
    id: id(),
    label: text('label').notNull(),
    sortOrder: integer('sort_order').notNull(),
    ...timestamps(),
  },
  (t) => [check('checklist_label', sql`length(trim(${t.label})) BETWEEN 1 AND 120`)],
);
export const clientChecklistState = sqliteTable(
  'client_checklist_state',
  {
    clientId: text('client_id')
      .notNull()
      .references(() => clients.id, { onDelete: 'cascade' }),
    itemId: text('item_id')
      .notNull()
      .references(() => checklistItems.id, { onDelete: 'cascade' }),
    completedAt: text('completed_at'),
  },
  (t) => [primaryKey({ columns: [t.clientId, t.itemId] })],
);
export const questionnaireQuestions = sqliteTable(
  'questionnaire_questions',
  {
    id: id(),
    prompt: text('prompt').notNull(),
    kind: text('kind').notNull(),
    options: text('options'),
    required: integer('required', { mode: 'boolean' }).notNull(),
    sortOrder: integer('sort_order').notNull(),
    ...timestamps(),
  },
  (t) => [
    check('question_prompt', sql`length(trim(${t.prompt})) BETWEEN 1 AND 300`),
    check('question_kind', sql`${t.kind} IN ('short_text','long_text','single_choice')`),
    check(
      'question_options',
      sql`(${t.kind}='single_choice' AND ${t.options} IS NOT NULL AND json_valid(${t.options}) AND json_array_length(${t.options}) BETWEEN 2 AND 10) OR (${t.kind}<>'single_choice' AND ${t.options} IS NULL)`,
    ),
  ],
);
export const questionnaireInvites = sqliteTable(
  'questionnaire_invites',
  {
    id: id(),
    clientId: text('client_id')
      .notNull()
      .references(() => clients.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull().unique(),
    questionsSnapshot: text('questions_snapshot').notNull(),
    sentAt: text('sent_at').notNull(),
    expiresAt: text('expires_at').notNull(),
    submittedAt: text('submitted_at'),
  },
  (t) => [
    check('invite_hash', sql`length(${t.tokenHash})=64`),
    check('invite_snapshot', sql`json_valid(${t.questionsSnapshot})`),
    uniqueIndex('invite_client').on(t.id, t.clientId),
    index('invites_by_client').on(t.clientId),
  ],
);
export const questionnaireResponses = sqliteTable(
  'questionnaire_responses',
  {
    inviteId: text('invite_id')
      .primaryKey()
      .references(() => questionnaireInvites.id, { onDelete: 'cascade' }),
    answers: text('answers').notNull(),
    submittedAt: text('submitted_at').notNull(),
  },
  (t) => [check('response_json', sql`json_valid(${t.answers})`)],
);
export const clientEmails = sqliteTable(
  'client_emails',
  {
    id: id(),
    clientId: text('client_id')
      .notNull()
      .references(() => clients.id, { onDelete: 'cascade' }),
    templateId: text('template_id').references(() => emailTemplates.id, { onDelete: 'set null' }),
    questionnaireInviteId: text('questionnaire_invite_id'),
    subject: text('subject').notNull(),
    body: text('body').notNull(),
    gmailMessageId: text('gmail_message_id').notNull(),
    sentAt: text('sent_at').notNull(),
  },
  (t) => [
    foreignKey({
      columns: [t.questionnaireInviteId, t.clientId],
      foreignColumns: [questionnaireInvites.id, questionnaireInvites.clientId],
    }),
    index('emails_by_client').on(t.clientId, t.sentAt),
  ],
);
