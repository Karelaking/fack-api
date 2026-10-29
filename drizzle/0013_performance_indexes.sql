-- Phase 1: High-Impact Composite Indexes
-- Migration: 0013_performance_indexes
-- Purpose: Add composite indexes for frequently queried field combinations
-- Expected Impact: 50-80% improvement in hot path query performance

-- Composite index for route matching (highest frequency hot path)
-- Covers queries: WHERE endpoint_id = ? AND method = ? AND path = ?
CREATE INDEX `routes_endpoint_method_path_idx` ON `routes` (`endpoint_id`, `method`, `path`);

-- Composite index for notes sorting
-- Covers queries: WHERE project_id = ? ORDER BY pinned DESC, updated_at DESC
CREATE INDEX `notes_project_pinned_updated_idx` ON `notes` (`project_id`, `pinned` DESC, `updated_at` DESC);

-- Composite index for task status filtering
-- Covers queries: WHERE project_id = ? AND status = ?
CREATE INDEX `generation_tasks_project_status_idx` ON `generation_tasks` (`project_id`, `status`);

-- Composite index for version history queries
-- Covers queries: WHERE project_id = ? ORDER BY version DESC
CREATE INDEX `project_revisions_project_version_idx` ON `project_revisions` (`project_id`, `version` DESC);

-- Explicit index for slug lookups (already has unique constraint, but explicit index improves clarity)
-- Covers queries: WHERE slug = ?
CREATE INDEX `projects_slug_idx` ON `projects` (`slug`);
