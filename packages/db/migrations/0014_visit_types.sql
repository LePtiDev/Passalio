ALTER TABLE `interventions` ADD `visit_types` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `organizations` ADD `visit_durations` text DEFAULT '{}' NOT NULL;