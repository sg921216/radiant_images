CREATE TABLE `lifecycle_state` (
	`id` integer PRIMARY KEY NOT NULL,
	`ledger_id` text DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`initialized` integer DEFAULT 0 NOT NULL,
	CONSTRAINT "lifecycle_singleton" CHECK("lifecycle_state"."id"=1),
	CONSTRAINT "lifecycle_initialized" CHECK("lifecycle_state"."initialized" IN (0,1))
);
--> statement-breakpoint
INSERT INTO lifecycle_state (id) VALUES (1);
