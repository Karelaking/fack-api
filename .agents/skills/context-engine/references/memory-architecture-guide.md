# Memory Architecture Guide

Read this when designing multi-layer agent memory, deciding what to persist across sessions, tracking staleness, or coordinating context between multiple agents.

## Memory Architecture

### Three-Layer Memory Model

```
┌─────────────────────────────────────────────────┐
│  Layer 1: Working Memory (Context Window)        │
│  Scope: Current conversation/task                │
│  Lifetime: Single session                        │
│  Storage: In-context tokens                      │
│  Update: Every turn                              │
├─────────────────────────────────────────────────┤
│  Layer 2: Session Memory (Persistent Store)      │
│  Scope: Project-level learnings                  │
│  Lifetime: Across sessions                       │
│  Storage: MEMORY.md, .claude/rules/, CLAUDE.md   │
│  Update: End of session or on discovery          │
├─────────────────────────────────────────────────┤
│  Layer 3: Knowledge Base (Indexed Corpus)        │
│  Scope: Full codebase + documentation            │
│  Lifetime: Persistent, versioned                 │
│  Storage: Vector store, graph DB, file index     │
│  Update: On commit / scheduled reindex           │
└─────────────────────────────────────────────────┘
```

### Memory Promotion Protocol

Knowledge flows upward through layers based on recurrence and value:

| Signal | Action | Example |
|--------|--------|---------|
| Pattern seen 1x | Working memory only | "This file uses tabs" |
| Pattern seen 2-3x | Candidate for session memory | "Project uses pnpm everywhere" |
| Pattern confirmed across sessions | Promote to CLAUDE.md/rules | "Always use pnpm, never npm" |
| Pattern is domain knowledge | Add to knowledge base | "Auth flow uses JWT + refresh tokens" |

### Staleness Detection

Context has a shelf life. Stale context causes hallucinations.

```
Freshness Score = f(last_verified, change_frequency, confidence)

Fresh   (< 7 days, file unchanged):  Use directly
Aging   (7-30 days, file changed):   Re-verify before using
Stale   (> 30 days):                 Flag, re-retrieve, or discard
Unknown (never verified):            Treat as low-confidence
```

## Multi-Agent Context Sharing

When multiple agents collaborate, context synchronization becomes critical.

### Shared Context Bus

```
┌──────────┐     ┌──────────────────┐     ┌──────────┐
│ Agent A   │────▶│  Shared Context   │◀────│ Agent B   │
│ (Planner) │     │  - Task state     │     │ (Coder)   │
└──────────┘     │  - Decisions log  │     └──────────┘
                  │  - File changes   │
┌──────────┐     │  - Constraints    │     ┌──────────┐
│ Agent C   │────▶│  - Artifacts      │◀────│ Agent D   │
│ (Reviewer)│     └──────────────────┘     │ (Tester)  │
└──────────┘                               └──────────┘
```

### Context Handoff Protocol

When Agent A passes work to Agent B:
1. **State Summary**: What was done, decisions made, current state
2. **Relevant Artifacts**: Files created/modified, with paths
3. **Constraints**: What must not be changed, invariants
4. **Open Questions**: Unresolved decisions that need Agent B's input
5. **Next Steps**: Explicit instructions for what Agent B should do

Anti-pattern: Passing the entire conversation history. Always summarize.
