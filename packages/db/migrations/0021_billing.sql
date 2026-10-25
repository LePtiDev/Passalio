CREATE TABLE `stripe_events` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`received_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`plan` text NOT NULL,
	`interval` text NOT NULL,
	`is_founder` integer NOT NULL,
	`status` text NOT NULL,
	`stripe_customer_id` text NOT NULL,
	`stripe_subscription_id` text NOT NULL,
	`current_period_end` integer,
	`is_cancel_scheduled` integer NOT NULL,
	`ended_at` integer,
	`payment_failed_at` integer,
	`payment_method_type` text,
	`payment_method_last4` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subscriptions_organization_id_idx` ON `subscriptions` (`organization_id`);