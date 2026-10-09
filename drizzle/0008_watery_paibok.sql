CREATE TABLE `webhooks` (
	`id` text PRIMARY KEY NOT NULL,
	`route_id` text NOT NULL,
	`url` text NOT NULL,
	`method` text DEFAULT 'POST' NOT NULL,
	`payload_template` text DEFAULT '{}',
	`delay_ms` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`route_id`) REFERENCES `routes`(`id`) ON UPDATE no action ON DELETE cascade
);
