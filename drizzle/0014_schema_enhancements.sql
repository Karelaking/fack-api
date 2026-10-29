-- Phase 2: Schema Enhancements
-- Migration: 0014_schema_enhancements
-- Purpose: Add helper columns for conditional rule filtering and data integrity
-- Expected Impact: Faster conditional rule filtering and data integrity verification

-- Add helper columns to routes table
ALTER TABLE `routes` ADD COLUMN `has_conditional_rules` integer DEFAULT 0 NOT NULL;
ALTER TABLE `routes` ADD COLUMN `schema_checksum` text;

-- Index for conditional rule filtering
CREATE INDEX `routes_has_conditional_rules_idx` ON `routes` (`has_conditional_rules`);

-- Add checksum columns to canvas_states for integrity verification
ALTER TABLE `canvas_states` ADD COLUMN `nodes_checksum` text;
ALTER TABLE `canvas_states` ADD COLUMN `edges_checksum` text;

-- Populate has_conditional_rules based on existing data
UPDATE `routes` SET `has_conditional_rules` = CASE
  WHEN `conditional_rules` IS NOT NULL AND `conditional_rules` != '[]' AND `conditional_rules` != '{}'
  THEN 1
  ELSE 0
END;

-- Populate schema_checksum for existing routes (SQLite doesn't have MD5 built-in, use hex as placeholder)
-- Note: In production, compute checksum in application layer using crypto library
-- UPDATE `routes` SET `schema_checksum` = lower(hex(md5(`response_schema`)));
