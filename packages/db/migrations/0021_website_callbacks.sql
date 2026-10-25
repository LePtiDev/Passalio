ALTER TABLE `prospect_tasks` ADD `source` text;--> statement-breakpoint
CREATE INDEX `prospect_companies_phone_idx` ON `prospect_companies` (`phone`);--> statement-breakpoint
CREATE INDEX `prospect_contacts_phone_idx` ON `prospect_contacts` (`phone`);--> statement-breakpoint
CREATE INDEX `prospect_contacts_mobile_idx` ON `prospect_contacts` (`mobile`);