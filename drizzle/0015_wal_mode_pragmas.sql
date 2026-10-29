-- Phase 3: Enable SQLite Performance Optimizations
-- Migration: 0015_wal_mode_pragmas
-- Purpose: Enable WAL mode and other performance-related PRAGMAs
-- Note: These are runtime settings, not schema changes
-- These should be applied in your database connection setup, not as a migration

-- PRAGMA statements to run when opening the database connection:
-- PRAGMA journal_mode = WAL;           -- Enable Write-Ahead Logging for better concurrency
-- PRAGMA synchronous = NORMAL;          -- Balance between durability and performance
-- PRAGMA foreign_keys = ON;             -- Enforce foreign key constraints
-- PRAGMA automatic_index = ON;          -- Log automatic index creation for monitoring
-- PRAGMA optimize;                      -- Run ANALYZE to update statistics

-- Application implementation example (in db/index.ts or equivalent):
/*
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

// Enable performance optimizations
await client.execute('PRAGMA journal_mode = WAL');
await client.execute('PRAGMA synchronous = NORMAL');
await client.execute('PRAGMA foreign_keys = ON');

export const db = drizzle(client);
*/
