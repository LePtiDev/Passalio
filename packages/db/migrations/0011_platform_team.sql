CREATE TABLE `platform_invitations` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`role` text NOT NULL,
	`status` text NOT NULL,
	`inviter_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`inviter_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `platform_invitations_status_created_at_idx` ON `platform_invitations` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `platform_invitations_email_status_idx` ON `platform_invitations` (`email`,`status`);--> statement-breakpoint
CREATE INDEX `users_role_idx` ON `users` (`role`);--> statement-breakpoint
UPDATE `users` SET `role` = 'admin' WHERE `role` = 'support';
