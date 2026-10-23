CREATE TABLE `document_number_blocks` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	`device_id` text NOT NULL,
	`number_prefix` text NOT NULL,
	`first_number` integer NOT NULL,
	`last_number` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `document_number_blocks_organization_id_user_id_last_number_idx` ON `document_number_blocks` (`organization_id`,`user_id`,`last_number`);--> statement-breakpoint
CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`intervention_id` text NOT NULL,
	`equipment_id` text NOT NULL,
	`trade` text NOT NULL,
	`kind` text NOT NULL,
	`template_version` integer NOT NULL,
	`number` integer NOT NULL,
	`number_prefix` text NOT NULL,
	`device_id` text NOT NULL,
	`signed_by_user_id` text NOT NULL,
	`signed_at` integer NOT NULL,
	`completed_on` text NOT NULL,
	`cancels_document_id` text,
	`data` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`intervention_id`) REFERENCES `interventions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`equipment_id`) REFERENCES `equipments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `documents_organization_id_number_idx` ON `documents` (`organization_id`,`number`);--> statement-breakpoint
CREATE UNIQUE INDEX `documents_organization_id_cancels_document_id_idx` ON `documents` (`organization_id`,`cancels_document_id`);--> statement-breakpoint
CREATE INDEX `documents_organization_id_updated_at_idx` ON `documents` (`organization_id`,`updated_at`);--> statement-breakpoint
CREATE INDEX `documents_organization_id_signed_by_user_id_updated_at_idx` ON `documents` (`organization_id`,`signed_by_user_id`,`updated_at`);--> statement-breakpoint
CREATE TABLE `interventions` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`site_id` text NOT NULL,
	`technician_user_id` text NOT NULL,
	`scheduled_date` text NOT NULL,
	`start_time` text,
	`duration_minutes` integer NOT NULL,
	`equipment_ids` text NOT NULL,
	`announced_price_cents` integer,
	`notes` text,
	`status` text NOT NULL,
	`completed_on` text,
	`payment_method` text,
	`paid_amount_cents` integer,
	`created_by_user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `interventions_organization_id_updated_at_idx` ON `interventions` (`organization_id`,`updated_at`);