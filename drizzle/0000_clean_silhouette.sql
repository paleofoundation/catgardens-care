CREATE TABLE `animals` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`mode` text NOT NULL,
	`data` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_animals_owner_mode` ON `animals` (`owner`,`mode`);--> statement-breakpoint
CREATE TABLE `entries` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`mode` text NOT NULL,
	`animal_id` text NOT NULL,
	`kind` text NOT NULL,
	`at` text NOT NULL,
	`author` text NOT NULL,
	`data` text NOT NULL,
	`dose_key` text
);
--> statement-breakpoint
CREATE INDEX `idx_entries_owner_mode` ON `entries` (`owner`,`mode`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_dose_unique` ON `entries` (`owner`,`mode`,`dose_key`);--> statement-breakpoint
CREATE TABLE `files` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`mode` text NOT NULL,
	`animal_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`object_key` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_files_owner` ON `files` (`owner`);--> statement-breakpoint
CREATE TABLE `medications` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`mode` text NOT NULL,
	`animal_id` text NOT NULL,
	`data` text NOT NULL,
	`active` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_meds_owner_mode` ON `medications` (`owner`,`mode`);--> statement-breakpoint
CREATE TABLE `settings` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL
);
