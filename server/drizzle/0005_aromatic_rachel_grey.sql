ALTER TABLE `timer_settings` ADD `notification_mode` text DEFAULT 'sound' NOT NULL;--> statement-breakpoint
ALTER TABLE `timer_settings` ADD `custom_sound_filename` text;