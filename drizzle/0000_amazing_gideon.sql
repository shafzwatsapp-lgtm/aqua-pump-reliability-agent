CREATE TABLE `case_events` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`scenario` text NOT NULL,
	`kind` text NOT NULL,
	`body` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `case_events_owner_scenario` ON `case_events` (`owner`,`scenario`);