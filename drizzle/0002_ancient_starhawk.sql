CREATE TABLE `identities` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`platform_id` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_identity_email` ON `identities` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_identity_platform` ON `identities` (`platform_id`);