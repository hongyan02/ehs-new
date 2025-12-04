CREATE TABLE `dutySwap` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`from_name` text NOT NULL,
	`from_no` text NOT NULL,
	`from_position` text NOT NULL,
	`from_date` text NOT NULL,
	`from_shift` integer NOT NULL,
	`to_name` text NOT NULL,
	`to_no` text NOT NULL,
	`to_position` text NOT NULL,
	`to_date` text NOT NULL,
	`to_shift` integer NOT NULL,
	`status` integer DEFAULT 0 NOT NULL,
	`reason` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
