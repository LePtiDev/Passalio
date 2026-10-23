CREATE TABLE `plate_readings` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	`day` text NOT NULL,
	`status` text NOT NULL,
	`field_count` integer NOT NULL,
	`model` text,
	`input_tokens` integer,
	`output_tokens` integer,
	`trace_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `plate_readings_organization_id_day_idx` ON `plate_readings` (`organization_id`,`day`);