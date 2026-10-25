ALTER TABLE `organizations` ADD `legal_form` text;--> statement-breakpoint
ALTER TABLE `organizations` ADD `share_capital_euros` integer;--> statement-breakpoint
ALTER TABLE `organizations` ADD `registry_kind` text;--> statement-breakpoint
ALTER TABLE `organizations` ADD `registry_city` text;--> statement-breakpoint
ALTER TABLE `organizations` ADD `ape_code` text;--> statement-breakpoint
ALTER TABLE `organizations` ADD `qualification` text;--> statement-breakpoint
ALTER TABLE `organizations` ADD `document_template` text DEFAULT 'banner' NOT NULL;--> statement-breakpoint
ALTER TABLE `organizations` ADD `contact_email` text;--> statement-breakpoint
ALTER TABLE `organizations` ADD `website` text;--> statement-breakpoint
ALTER TABLE `organizations` ADD `customer_message` text;--> statement-breakpoint
ALTER TABLE `organizations` ADD `footer_text` text;