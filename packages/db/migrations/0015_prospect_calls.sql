CREATE TABLE `prospect_calls` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`contact_id` text,
	`author_user_id` text,
	`outcome` text NOT NULL,
	`next_action` text,
	`notes` text,
	`called_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `prospect_companies`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`contact_id`) REFERENCES `prospect_contacts`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`author_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `prospect_calls_company_id_called_at_idx` ON `prospect_calls` (`company_id`,`called_at`);--> statement-breakpoint
CREATE INDEX `prospect_calls_author_user_id_called_at_idx` ON `prospect_calls` (`author_user_id`,`called_at`);--> statement-breakpoint
CREATE INDEX `prospect_calls_contact_id_idx` ON `prospect_calls` (`contact_id`);--> statement-breakpoint
CREATE TABLE `prospect_follow_ups` (
	`company_id` text PRIMARY KEY NOT NULL,
	`last_call_at` integer,
	`last_call_outcome` text,
	`last_call_by_user_id` text,
	`interest` text,
	`team_size` text,
	`tool_kind` text,
	`certificate_volume` text,
	`decision_maker` text,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `prospect_companies`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`last_call_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `prospect_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`contact_id` text,
	`owner_user_id` text,
	`kind` text NOT NULL,
	`due_at` integer NOT NULL,
	`notify` text NOT NULL,
	`notify_at` integer,
	`notified_at` integer,
	`status` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `prospect_companies`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`contact_id`) REFERENCES `prospect_contacts`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `prospect_tasks_owner_user_id_status_due_at_idx` ON `prospect_tasks` (`owner_user_id`,`status`,`due_at`);--> statement-breakpoint
CREATE INDEX `prospect_tasks_company_id_status_idx` ON `prospect_tasks` (`company_id`,`status`);--> statement-breakpoint
CREATE INDEX `prospect_tasks_contact_id_idx` ON `prospect_tasks` (`contact_id`);