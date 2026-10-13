CREATE INDEX `endpoints_project_id_idx` ON `endpoints` (`project_id`);--> statement-breakpoint
CREATE INDEX `generation_proposals_task_id_idx` ON `generation_proposals` (`task_id`);--> statement-breakpoint
CREATE INDEX `generation_proposals_project_id_idx` ON `generation_proposals` (`project_id`);--> statement-breakpoint
CREATE INDEX `generation_tasks_project_id_idx` ON `generation_tasks` (`project_id`);--> statement-breakpoint
CREATE INDEX `mock_states_project_collection_key_idx` ON `mock_states` (`project_id`,`collection`,`item_key`);--> statement-breakpoint
CREATE INDEX `project_revisions_project_id_idx` ON `project_revisions` (`project_id`);--> statement-breakpoint
CREATE INDEX `projects_user_id_idx` ON `projects` (`user_id`);--> statement-breakpoint
CREATE INDEX `routes_endpoint_id_idx` ON `routes` (`endpoint_id`);--> statement-breakpoint
CREATE INDEX `scenarios_project_id_idx` ON `scenarios` (`project_id`);--> statement-breakpoint
CREATE INDEX `webhooks_route_id_idx` ON `webhooks` (`route_id`);