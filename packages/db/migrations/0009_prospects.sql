CREATE TABLE `prospect_companies` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`search_name` text NOT NULL,
	`search_text` text NOT NULL,
	`legal_name` text,
	`siren` text,
	`naf_code` text,
	`legal_form` text,
	`address` text,
	`postal_code` text,
	`city` text,
	`department` text NOT NULL,
	`latitude` real,
	`longitude` real,
	`phone` text,
	`email` text,
	`website` text,
	`activity` text,
	`headcount` text,
	`founded_on` text,
	`registry_status` text,
	`notes` text,
	`stage` text NOT NULL,
	`owner_user_id` text,
	`source_ref` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `prospect_companies_source_ref_idx` ON `prospect_companies` (`source_ref`);--> statement-breakpoint
CREATE INDEX `prospect_companies_department_stage_search_name_idx` ON `prospect_companies` (`department`,`stage`,`search_name`);--> statement-breakpoint
CREATE INDEX `prospect_companies_department_search_name_idx` ON `prospect_companies` (`department`,`search_name`);--> statement-breakpoint
CREATE INDEX `prospect_companies_stage_search_name_idx` ON `prospect_companies` (`stage`,`search_name`);--> statement-breakpoint
CREATE INDEX `prospect_companies_search_name_idx` ON `prospect_companies` (`search_name`);--> statement-breakpoint
CREATE TABLE `prospect_contacts` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`first_name` text,
	`last_name` text NOT NULL,
	`search_name` text NOT NULL,
	`job_title` text,
	`is_leader` integer DEFAULT false NOT NULL,
	`is_main` integer DEFAULT false NOT NULL,
	`phone` text,
	`mobile` text,
	`email` text,
	`best_time` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `prospect_companies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `prospect_contacts_company_id_idx` ON `prospect_contacts` (`company_id`);--> statement-breakpoint
CREATE INDEX `prospect_contacts_search_name_idx` ON `prospect_contacts` (`search_name`);--> statement-breakpoint
CREATE TABLE `prospect_events` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`contact_id` text,
	`author_user_id` text,
	`kind` text NOT NULL,
	`body` text,
	`from_stage` text,
	`to_stage` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `prospect_companies`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`contact_id`) REFERENCES `prospect_contacts`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`author_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `prospect_events_company_id_created_at_idx` ON `prospect_events` (`company_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `prospect_events_contact_id_created_at_idx` ON `prospect_events` (`contact_id`,`created_at`);