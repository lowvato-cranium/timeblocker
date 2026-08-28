ALTER TABLE `tasks` ADD `status_changed_at` integer;
--> statement-breakpoint
UPDATE `tasks` SET `status_changed_at` = `created_at` WHERE `status_changed_at` IS NULL;