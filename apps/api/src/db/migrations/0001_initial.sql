CREATE TABLE `audit_events` (
	`id` text PRIMARY KEY NOT NULL,
	`at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`entity_type` text,
	`entity_id` text,
	`outcome` text NOT NULL,
	`request_id` text NOT NULL,
	`detail` text,
	CONSTRAINT "audit_outcome" CHECK("audit_events"."outcome" IN ('ok','error'))
);
--> statement-breakpoint
CREATE INDEX `audit_at` ON `audit_events` (`at`);--> statement-breakpoint
CREATE TABLE `banners` (
	`id` text PRIMARY KEY NOT NULL,
	`message` text NOT NULL,
	`link_url` text,
	`starts_at` text NOT NULL,
	`ends_at` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	CONSTRAINT "banner_window" CHECK("banners"."ends_at">"banners"."starts_at"),
	CONSTRAINT "banner_message" CHECK(length("banners"."message") BETWEEN 1 AND 200)
);
--> statement-breakpoint
CREATE INDEX `banner_window_idx` ON `banners` (`starts_at`,`ends_at`);--> statement-breakpoint
CREATE TABLE `checklist_items` (
	`id` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`sort_order` integer NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	CONSTRAINT "checklist_label" CHECK(length(trim("checklist_items"."label")) BETWEEN 1 AND 120)
);
--> statement-breakpoint
CREATE TABLE `client_checklist_state` (
	`client_id` text NOT NULL,
	`item_id` text NOT NULL,
	`completed_at` text,
	PRIMARY KEY(`client_id`, `item_id`),
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`item_id`) REFERENCES `checklist_items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `client_emails` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`template_id` text,
	`questionnaire_invite_id` text,
	`subject` text NOT NULL,
	`body` text NOT NULL,
	`gmail_message_id` text NOT NULL,
	`sent_at` text NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`template_id`) REFERENCES `email_templates`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`questionnaire_invite_id`,`client_id`) REFERENCES `questionnaire_invites`(`id`,`client_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `emails_by_client` ON `client_emails` (`client_id`,`sent_at`);--> statement-breakpoint
CREATE TABLE `clients` (
	`id` text PRIMARY KEY NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text,
	`shoot_type` text NOT NULL,
	`session_date` text,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	CONSTRAINT "client_shoot" CHECK("clients"."shoot_type" IN ('maternity','newborn','family')),
	CONSTRAINT "client_lengths" CHECK(length(trim("clients"."first_name")) BETWEEN 1 AND 80 AND length(trim("clients"."last_name")) BETWEEN 1 AND 80 AND length("clients"."notes")<=4000)
);
--> statement-breakpoint
CREATE INDEX `clients_name` ON `clients` (`last_name`,`first_name`);--> statement-breakpoint
CREATE TABLE `email_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`subject` text NOT NULL,
	`body` text NOT NULL,
	`sort_order` integer NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	CONSTRAINT "template_limits" CHECK(length("email_templates"."name") BETWEEN 1 AND 80 AND length("email_templates"."subject") BETWEEN 1 AND 200 AND length("email_templates"."body") BETWEEN 1 AND 10000)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `email_templates_name_unique` ON `email_templates` (`name`);--> statement-breakpoint
CREATE TABLE `exchange_codes` (
	`code_hash` text PRIMARY KEY NOT NULL,
	`owner_email` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`expires_at` text NOT NULL,
	CONSTRAINT "grant_hash" CHECK(length("exchange_codes"."code_hash")=64)
);
--> statement-breakpoint
CREATE INDEX `grant_expiry` ON `exchange_codes` (`expires_at`);--> statement-breakpoint
CREATE TABLE `faq_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`question` text NOT NULL,
	`answer` text NOT NULL,
	`sort_order` integer NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	CONSTRAINT "faq_lengths" CHECK(length(trim("faq_entries"."question")) BETWEEN 1 AND 200 AND length(trim("faq_entries"."answer")) BETWEEN 1 AND 2000)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `faq_entries_sort_order_unique` ON `faq_entries` (`sort_order`);--> statement-breakpoint
CREATE TABLE `gallery_images` (
	`id` text PRIMARY KEY NOT NULL,
	`tag` text NOT NULL,
	`alt_text` text NOT NULL,
	`sort_order` integer NOT NULL,
	`width` integer NOT NULL,
	`height` integer NOT NULL,
	`original_mime` text NOT NULL,
	`original_bytes` integer NOT NULL,
	`original_width` integer NOT NULL,
	`original_height` integer NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	CONSTRAINT "gallery_tag" CHECK("gallery_images"."tag" IN ('maternity','newborn','family','general')),
	CONSTRAINT "gallery_alt" CHECK(length(trim("gallery_images"."alt_text")) BETWEEN 1 AND 200),
	CONSTRAINT "gallery_pixels" CHECK("gallery_images"."width" BETWEEN 1 AND 2000 AND "gallery_images"."height" BETWEEN 1 AND 2000 AND "gallery_images"."original_width" BETWEEN 1 AND 16384 AND "gallery_images"."original_height" BETWEEN 1 AND 16384 AND "gallery_images"."original_width" * "gallery_images"."original_height" <= 40000000),
	CONSTRAINT "gallery_bytes" CHECK("gallery_images"."original_bytes" BETWEEN 1 AND 10485760),
	CONSTRAINT "gallery_mime" CHECK("gallery_images"."original_mime" IN ('image/jpeg','image/png','image/webp'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `gallery_images_sort_order_unique` ON `gallery_images` (`sort_order`);--> statement-breakpoint
CREATE TABLE `inquiry_dedupe` (
	`hash` text PRIMARY KEY NOT NULL,
	`expires_at` text NOT NULL,
	CONSTRAINT "dedupe_hash" CHECK(length("inquiry_dedupe"."hash")=64)
);
--> statement-breakpoint
CREATE INDEX `dedupe_expiry` ON `inquiry_dedupe` (`expires_at`);--> statement-breakpoint
CREATE TABLE `oauth_states` (
	`state_hash` text PRIMARY KEY NOT NULL,
	`browser_hash` text NOT NULL,
	`nonce_hash` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`expires_at` text NOT NULL,
	CONSTRAINT "oauth_hashes" CHECK(length("oauth_states"."state_hash")=64 AND length("oauth_states"."browser_hash")=64 AND length("oauth_states"."nonce_hash")=64)
);
--> statement-breakpoint
CREATE TABLE `page_content` (
	`page` text PRIMARY KEY NOT NULL,
	`intro_md` text NOT NULL,
	`how_it_works` text NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	CONSTRAINT "page_name" CHECK("page_content"."page" IN ('about','maternity','newborn','family')),
	CONSTRAINT "page_content_limits" CHECK(length("page_content"."intro_md")<=4000 AND json_valid("page_content"."how_it_works") AND json_array_length("page_content"."how_it_works")<=8)
);
--> statement-breakpoint
CREATE TABLE `pricing_packages` (
	`id` text PRIMARY KEY NOT NULL,
	`revision_id` text NOT NULL,
	`shoot_type` text NOT NULL,
	`sort_order` integer NOT NULL,
	`name` text NOT NULL,
	`price_cents` integer NOT NULL,
	`description` text NOT NULL,
	`inclusions` text NOT NULL,
	FOREIGN KEY (`revision_id`) REFERENCES `pricing_revisions`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "package_shoot" CHECK("pricing_packages"."shoot_type" IN ('maternity','newborn','family')),
	CONSTRAINT "package_price" CHECK("pricing_packages"."price_cents">=0),
	CONSTRAINT "package_name" CHECK(length(trim("pricing_packages"."name")) BETWEEN 1 AND 60),
	CONSTRAINT "package_description" CHECK(length("pricing_packages"."description")<=500),
	CONSTRAINT "package_inclusions" CHECK(json_valid("pricing_packages"."inclusions") AND json_array_length("pricing_packages"."inclusions") BETWEEN 1 AND 15)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `package_order` ON `pricing_packages` (`revision_id`,`shoot_type`,`sort_order`);--> statement-breakpoint
CREATE TABLE `pricing_publication` (
	`id` integer PRIMARY KEY NOT NULL,
	`current_revision_id` text NOT NULL,
	FOREIGN KEY (`current_revision_id`) REFERENCES `pricing_revisions`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "pricing_singleton" CHECK("pricing_publication"."id"=1)
);
--> statement-breakpoint
CREATE TABLE `pricing_revisions` (
	`id` text PRIMARY KEY NOT NULL,
	`published_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`created_by` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `questionnaire_invites` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`questions_snapshot` text NOT NULL,
	`sent_at` text NOT NULL,
	`expires_at` text NOT NULL,
	`submitted_at` text,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "invite_hash" CHECK(length("questionnaire_invites"."token_hash")=64),
	CONSTRAINT "invite_snapshot" CHECK(json_valid("questionnaire_invites"."questions_snapshot"))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `questionnaire_invites_token_hash_unique` ON `questionnaire_invites` (`token_hash`);--> statement-breakpoint
CREATE UNIQUE INDEX `invite_client` ON `questionnaire_invites` (`id`,`client_id`);--> statement-breakpoint
CREATE INDEX `invites_by_client` ON `questionnaire_invites` (`client_id`);--> statement-breakpoint
CREATE TABLE `questionnaire_questions` (
	`id` text PRIMARY KEY NOT NULL,
	`prompt` text NOT NULL,
	`kind` text NOT NULL,
	`options` text,
	`required` integer NOT NULL,
	`sort_order` integer NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	CONSTRAINT "question_prompt" CHECK(length(trim("questionnaire_questions"."prompt")) BETWEEN 1 AND 300),
	CONSTRAINT "question_kind" CHECK("questionnaire_questions"."kind" IN ('short_text','long_text','single_choice')),
	CONSTRAINT "question_options" CHECK(("questionnaire_questions"."kind"='single_choice' AND "questionnaire_questions"."options" IS NOT NULL AND json_valid("questionnaire_questions"."options") AND json_array_length("questionnaire_questions"."options") BETWEEN 2 AND 10) OR ("questionnaire_questions"."kind"<>'single_choice' AND "questionnaire_questions"."options" IS NULL))
);
--> statement-breakpoint
CREATE TABLE `questionnaire_responses` (
	`invite_id` text PRIMARY KEY NOT NULL,
	`answers` text NOT NULL,
	`submitted_at` text NOT NULL,
	FOREIGN KEY (`invite_id`) REFERENCES `questionnaire_invites`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "response_json" CHECK(json_valid("questionnaire_responses"."answers"))
);
--> statement-breakpoint
CREATE TABLE `rate_limit_windows` (
	`group_name` text NOT NULL,
	`subject_hash` text NOT NULL,
	`window_start` integer NOT NULL,
	`request_count` integer NOT NULL,
	`expires_at` integer NOT NULL,
	PRIMARY KEY(`group_name`, `subject_hash`, `window_start`),
	CONSTRAINT "rate_count" CHECK("rate_limit_windows"."request_count">0)
);
--> statement-breakpoint
CREATE INDEX `rate_expiry` ON `rate_limit_windows` (`expires_at`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`token_hash` text NOT NULL,
	`owner_email` text NOT NULL,
	`last_seen_at` text NOT NULL,
	`absolute_expires_at` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	CONSTRAINT "session_hash" CHECK(length("sessions"."token_hash")=64)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_hash_unique` ON `sessions` (`token_hash`);--> statement-breakpoint
CREATE INDEX `session_expiry` ON `sessions` (`absolute_expires_at`);--> statement-breakpoint
CREATE TABLE `site_config` (
	`id` integer PRIMARY KEY NOT NULL,
	`inquiry_recipient` text NOT NULL,
	`sender_address` text NOT NULL,
	`public_contact_email` text NOT NULL,
	`shoot_locations` text NOT NULL,
	`referral_sources` text NOT NULL,
	`timezone` text NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	CONSTRAINT "config_singleton" CHECK("site_config"."id"=1),
	CONSTRAINT "public_email_required" CHECK(length(trim("site_config"."public_contact_email")) BETWEEN 3 AND 254),
	CONSTRAINT "config_lists" CHECK(json_valid("site_config"."shoot_locations") AND json_array_length("site_config"."shoot_locations") BETWEEN 1 AND 20 AND json_valid("site_config"."referral_sources") AND json_array_length("site_config"."referral_sources") BETWEEN 1 AND 20)
);

--> statement-breakpoint
CREATE TRIGGER gallery_capacity BEFORE INSERT ON gallery_images
WHEN (SELECT COUNT(*) FROM gallery_images) >= 60
BEGIN SELECT RAISE(ABORT, 'gallery_full'); END;
