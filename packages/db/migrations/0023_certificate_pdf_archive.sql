ALTER TABLE `documents` ADD `pdf_key` text;--> statement-breakpoint
ALTER TABLE `documents` ADD `pdf_sha256` text;--> statement-breakpoint
ALTER TABLE `documents` ADD `pdf_archived_at` integer;--> statement-breakpoint
ALTER TABLE `documents` ADD `pdf_archive_attempts` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX `documents_pdf_archive_pending_idx` ON `documents` (`pdf_archive_attempts`,`signed_at`) WHERE pdf_archived_at IS NULL AND deleted_at IS NULL;