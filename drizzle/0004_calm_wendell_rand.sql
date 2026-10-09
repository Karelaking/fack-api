CREATE TABLE `generation_proposals` (
	`id` text PRIMARY KEY NOT NULL,
	`task_id` text NOT NULL,
	`project_id` text NOT NULL,
	`base_project_version` integer NOT NULL,
	`payload` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `generation_tasks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `generation_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`prompt` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`provider_metadata` text,
	`error` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `projects` ADD `user_id` text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` ADD `version` integer DEFAULT 1 NOT NULL;