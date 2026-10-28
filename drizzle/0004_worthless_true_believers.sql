CREATE TABLE `operations` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`mode` text NOT NULL,
	`kind` text NOT NULL,
	`animal_id` text,
	`at` text NOT NULL,
	`created_at` text NOT NULL,
	`author` text NOT NULL,
	`member_id` text NOT NULL,
	`data` text NOT NULL,
	`resolved` integer DEFAULT 0 NOT NULL,
	`resolved_by` text,
	`public_state` text DEFAULT 'internal' NOT NULL,
	`public_cat_id` text,
	`public_title` text DEFAULT '' NOT NULL,
	`public_detail` text DEFAULT '' NOT NULL,
	`public_version` integer DEFAULT 0 NOT NULL,
	`delivered_version` integer DEFAULT 0 NOT NULL,
	`approved_by` text,
	`approved_at` text,
	`last_error` text
);
--> statement-breakpoint
CREATE INDEX `idx_operations_scope` ON `operations` (`owner`,`mode`);--> statement-breakpoint
CREATE INDEX `idx_operations_outbox` ON `operations` (`owner`,`mode`,`public_state`);