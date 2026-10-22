CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`kind` text NOT NULL,
	`civility` text,
	`first_name` text,
	`last_name` text,
	`company_name` text,
	`search_name` text NOT NULL,
	`email` text,
	`phone` text,
	`secondary_phone` text,
	`billing_address` text,
	`billing_postal_code` text,
	`billing_city` text,
	`notes` text,
	`reminders_opted_out_at` integer,
	`created_by_user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `customers_organization_id_updated_at_idx` ON `customers` (`organization_id`,`updated_at`);--> statement-breakpoint
CREATE INDEX `customers_organization_id_search_name_idx` ON `customers` (`organization_id`,`search_name`);--> statement-breakpoint
CREATE TABLE `sites` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`label` text,
	`address` text NOT NULL,
	`address_details` text,
	`postal_code` text NOT NULL,
	`city` text NOT NULL,
	`building_type` text NOT NULL,
	`latitude` real,
	`longitude` real,
	`occupant_name` text,
	`occupant_phone` text,
	`access_notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `sites_organization_id_customer_id_idx` ON `sites` (`organization_id`,`customer_id`);--> statement-breakpoint
CREATE INDEX `sites_organization_id_updated_at_idx` ON `sites` (`organization_id`,`updated_at`);--> statement-breakpoint
CREATE TABLE `equipment_photos` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`equipment_id` text NOT NULL,
	`kind` text NOT NULL,
	`storage_key` text NOT NULL,
	`content_type` text NOT NULL,
	`taken_at` integer NOT NULL,
	`created_by_user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`equipment_id`) REFERENCES `equipments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `equipment_photos_organization_id_equipment_id_idx` ON `equipment_photos` (`organization_id`,`equipment_id`);--> statement-breakpoint
CREATE INDEX `equipment_photos_organization_id_updated_at_idx` ON `equipment_photos` (`organization_id`,`updated_at`);--> statement-breakpoint
CREATE TABLE `equipments` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`site_id` text NOT NULL,
	`kind` text NOT NULL,
	`energy` text,
	`brand` text,
	`model` text,
	`serial_number` text,
	`power_kw` real,
	`room` text,
	`details` text NOT NULL,
	`status` text NOT NULL,
	`is_installed_by_us` integer NOT NULL,
	`commissioned_on` text,
	`removed_on` text,
	`replaced_by_equipment_id` text,
	`last_sweeping_on` text,
	`last_service_on` text,
	`next_due_date` text,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `equipments_organization_id_site_id_idx` ON `equipments` (`organization_id`,`site_id`);--> statement-breakpoint
CREATE INDEX `equipments_organization_id_next_due_date_idx` ON `equipments` (`organization_id`,`next_due_date`);--> statement-breakpoint
CREATE INDEX `equipments_organization_id_updated_at_idx` ON `equipments` (`organization_id`,`updated_at`);