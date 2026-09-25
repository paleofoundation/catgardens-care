CREATE TABLE `care_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`mode` text NOT NULL,
	`animal_id` text NOT NULL,
	`data` text NOT NULL,
	`active` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_careplans_owner_mode` ON `care_plans` (`owner`,`mode`);--> statement-breakpoint
CREATE TABLE `members` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`role` text NOT NULL,
	`identity_id` text,
	`active` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_members_email` ON `members` (`owner`,`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_members_identity` ON `members` (`owner`,`identity_id`);--> statement-breakpoint
CREATE TABLE `points` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`mode` text NOT NULL,
	`member_id` text NOT NULL,
	`points` integer NOT NULL,
	`at` text NOT NULL,
	`reason` text NOT NULL,
	`event_key` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_points_event` ON `points` (`owner`,`mode`,`event_key`);--> statement-breakpoint
CREATE INDEX `idx_points_team` ON `points` (`owner`,`mode`,`member_id`);