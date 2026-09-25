ALTER TABLE `animals` ADD `microchip` text;--> statement-breakpoint
ALTER TABLE `animals` ADD `external_id` text;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_animal_chip_unique` ON `animals` (`owner`,`mode`,`microchip`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_animal_external_unique` ON `animals` (`owner`,`mode`,`external_id`);