CREATE TABLE `services` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`duration_minutes` integer NOT NULL,
	`price_cents` integer,
	`document` text NOT NULL,
	`trade` text,
	`archived_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `services_organization_id_created_at_idx` ON `services` (`organization_id`,`created_at`);--> statement-breakpoint
ALTER TABLE `interventions` ADD `technician_user_ids` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `interventions` ADD `service_lines` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
UPDATE `interventions` SET `technician_user_ids` = json_array(`technician_user_id`);--> statement-breakpoint
ALTER TABLE `organizations` DROP COLUMN `visit_durations`;