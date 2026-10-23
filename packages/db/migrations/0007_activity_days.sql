CREATE TABLE `activity_days` (
	`user_id` text NOT NULL,
	`day` text NOT NULL,
	PRIMARY KEY(`user_id`, `day`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `activity_days_day_idx` ON `activity_days` (`day`);--> statement-breakpoint
CREATE INDEX `audit_logs_action_created_at_idx` ON `audit_logs` (`action`,`created_at`);