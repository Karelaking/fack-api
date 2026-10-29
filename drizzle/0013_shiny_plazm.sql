CREATE INDEX `generation_tasks_project_status_idx` ON `generation_tasks` (`project_id`,`status`);--> statement-breakpoint
CREATE INDEX `notes_project_pinned_updated_idx` ON `notes` (`project_id`,`pinned`,`updated_at`);--> statement-breakpoint
CREATE INDEX `project_revisions_project_version_idx` ON `project_revisions` (`project_id`,`version`);--> statement-breakpoint
CREATE INDEX `projects_slug_idx` ON `projects` (`slug`);--> statement-breakpoint
CREATE INDEX `routes_endpoint_method_path_idx` ON `routes` (`endpoint_id`,`method`,`path`);