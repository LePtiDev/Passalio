CREATE TABLE `platform_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`is_sign_up_open` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`updated_by_user_id` text,
	FOREIGN KEY (`updated_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
