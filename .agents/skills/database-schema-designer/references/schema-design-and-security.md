# Schema Design Process & Row-Level Security

Read this when turning requirements into a normalized schema, writing the full DDL (Drizzle example), or adding multi-tenant Row-Level Security.

## Schema Design Process

### Step 1: Requirements to Entities

Given requirements like:
> "Users can create workspaces. Each workspace has projects. Projects contain tasks with assignees, labels, and due dates. We need audit trails and multi-tenant isolation."

Extract entities:
```
User, Workspace, WorkspaceMember, Project, Task, TaskAssignment,
Label, TaskLabel (junction), AuditLog
```

### Step 2: Identify Relationships

```
User 1──* WorkspaceMember *──1 Workspace
Workspace 1──* Project
Project 1──* Task
Task *──* User          (via TaskAssignment)
Task *──* Label         (via TaskLabel)
User 1──* AuditLog
```

### Step 3: Add Cross-Cutting Concerns

Every table gets:
- `id` — CUID2 or UUIDv7 (sortable, non-sequential)
- `created_at` — TIMESTAMPTZ, server-side default
- `updated_at` — TIMESTAMPTZ, updated on every write

Tenant-scoped tables additionally get:
- `workspace_id` — FK to workspaces, included in every query
- RLS policy enforcing workspace isolation

Auditable tables additionally get:
- `created_by_id` — FK to users
- `updated_by_id` — FK to users
- `deleted_at` — TIMESTAMPTZ for soft deletes
- `version` — INTEGER for optimistic locking

### Step 4: Full Schema (Drizzle ORM)

```typescript
import {
  pgTable, text, timestamp, integer, boolean, uniqueIndex, index, pgEnum
} from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'

// Enums as pgEnum for type safety, but string columns also acceptable
export const taskStatusEnum = pgEnum('task_status', ['todo', 'in_progress', 'in_review', 'done'])
export const taskPriorityEnum = pgEnum('task_priority', ['low', 'medium', 'high', 'urgent'])
export const memberRoleEnum = pgEnum('member_role', ['owner', 'admin', 'member', 'viewer'])

// ──── WORKSPACES ────
export const workspaces = pgTable('workspaces', {
  id: text('id').primaryKey().$defaultFn(createId),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  plan: text('plan').notNull().default('free'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  uniqueIndex('workspaces_slug_idx').on(t.slug),
])

// ──── USERS ────
export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(createId),
  email: text('email').notNull(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  passwordHash: text('password_hash'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  uniqueIndex('users_email_idx').on(t.email),
])

// ──── WORKSPACE MEMBERS ────
export const workspaceMembers = pgTable('workspace_members', {
  id: text('id').primaryKey().$defaultFn(createId),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: memberRoleEnum('role').notNull().default('member'),
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  uniqueIndex('workspace_members_unique').on(t.workspaceId, t.userId),
  index('workspace_members_workspace_idx').on(t.workspaceId),
  index('workspace_members_user_idx').on(t.userId),
])

// ──── PROJECTS ────
export const projects = pgTable('projects', {
  id: text('id').primaryKey().$defaultFn(createId),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  status: text('status').notNull().default('active'),
  ownerId: text('owner_id').notNull().references(() => users.id),
  createdById: text('created_by_id').references(() => users.id),
  updatedById: text('updated_by_id').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (t) => [
  index('projects_workspace_idx').on(t.workspaceId),
  index('projects_workspace_status_idx').on(t.workspaceId, t.status),
])

// ──── TASKS ────
export const tasks = pgTable('tasks', {
  id: text('id').primaryKey().$defaultFn(createId),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  status: taskStatusEnum('status').notNull().default('todo'),
  priority: taskPriorityEnum('priority').notNull().default('medium'),
  position: integer('position').notNull().default(0),
  dueDate: timestamp('due_date', { withTimezone: true }),
  version: integer('version').notNull().default(1),
  createdById: text('created_by_id').notNull().references(() => users.id),
  updatedById: text('updated_by_id').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (t) => [
  index('tasks_project_idx').on(t.projectId),
  index('tasks_project_status_idx').on(t.projectId, t.status),
  index('tasks_due_date_idx').on(t.dueDate).where(sql`deleted_at IS NULL`),
])

// ──── AUDIT LOG ────
export const auditLog = pgTable('audit_log', {
  id: text('id').primaryKey().$defaultFn(createId),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id),
  userId: text('user_id').notNull().references(() => users.id),
  action: text('action').notNull(), // 'create' | 'update' | 'delete'
  entityType: text('entity_type').notNull(), // 'task' | 'project' | etc.
  entityId: text('entity_id').notNull(),
  before: text('before'), // JSON snapshot
  after: text('after'),   // JSON snapshot
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('audit_log_workspace_idx').on(t.workspaceId),
  index('audit_log_entity_idx').on(t.entityType, t.entityId),
  index('audit_log_user_idx').on(t.userId),
  index('audit_log_created_idx').on(t.createdAt),
])
```

## Row-Level Security (PostgreSQL)

```sql
-- Enable RLS on tenant-scoped tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create application role
CREATE ROLE app_user;

-- Projects: users can only see projects in their workspace
CREATE POLICY projects_workspace_isolation ON projects
  FOR ALL TO app_user
  USING (
    workspace_id IN (
      SELECT wm.workspace_id FROM workspace_members wm
      WHERE wm.user_id = current_setting('app.current_user_id')::text
    )
  );

-- Tasks: access through project's workspace membership
CREATE POLICY tasks_workspace_isolation ON tasks
  FOR ALL TO app_user
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = current_setting('app.current_user_id')::text
    )
  );

-- Soft delete filter: never show deleted records to app users
CREATE POLICY tasks_hide_deleted ON tasks
  FOR SELECT TO app_user
  USING (deleted_at IS NULL);

-- Set user context at request start (in middleware)
-- SELECT set_config('app.current_user_id', $1, true);
```
