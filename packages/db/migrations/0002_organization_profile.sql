ALTER TABLE `organizations` ADD `siret` text;--> statement-breakpoint
ALTER TABLE `organizations` ADD `address` text;--> statement-breakpoint
ALTER TABLE `organizations` ADD `phone` text;--> statement-breakpoint
ALTER TABLE `organizations` ADD `team_size` text;--> statement-breakpoint
ALTER TABLE `organizations` ADD `trades` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `organizations` ADD `brand_color` text DEFAULT '#0F2A44' NOT NULL;--> statement-breakpoint
ALTER TABLE `organizations` ADD `document_number_prefix` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `organizations` ADD `next_document_number` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `organizations` ADD `onboarding_completed_at` integer;