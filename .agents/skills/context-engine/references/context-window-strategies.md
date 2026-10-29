# Context Window Strategies

Read this when planning token budgets, choosing a packing strategy, or optimizing a long-running conversation's context window.

## Context Window Architecture

Every AI agent operates within a finite context window. Mismanaging it is the #1 cause of degraded agent performance.

### Token Budget Allocation Framework

| Segment | Budget % | Purpose | Priority |
|---------|----------|---------|----------|
| System Instructions | 5-10% | Agent identity, rules, constraints | Fixed (always loaded) |
| Task Context | 20-30% | Current task description, requirements | High (per-request) |
| Relevant Code | 25-40% | Source files, dependencies, types | Dynamic (retrieved) |
| Conversation History | 10-20% | Prior turns, decisions made | Sliding window |
| Tool Results | 5-15% | Command output, search results | Ephemeral |
| Reserved Buffer | 5-10% | Output generation headroom | Protected |

### Context Packing Strategies

**Greedy Relevance Packing**
```
1. Score all candidate context by relevance to current task
2. Sort by score descending
3. Pack until budget exhausted
4. Always reserve output buffer
```
- Pros: Simple, fast, works well for focused tasks
- Cons: Misses cross-cutting context, no diversity

**Tiered Loading**
```
Tier 0 (always loaded): System prompt, project rules, active file
Tier 1 (task-specific):  Related files, type definitions, tests
Tier 2 (on-demand):      Documentation, examples, history
Tier 3 (retrieved):      Search results, RAG chunks
```
- Pros: Predictable, debuggable, respects fixed costs
- Cons: Requires upfront tier classification

**Adaptive Compression**
```
1. Load full context for first pass
2. Identify low-signal sections (boilerplate, repetitive code)
3. Summarize or truncate low-signal sections
4. Re-pack with compressed context
5. Preserve high-signal sections verbatim
```
- Pros: Maximizes information density
- Cons: Risk of losing important details in compression

## Context Window Optimization Patterns

### Pattern: Sliding Window with Anchors

For long conversations, maintain fixed "anchor" messages while sliding recent history.

```
[System Prompt]           ← Fixed anchor (never evicted)
[Task Definition]         ← Fixed anchor
[Key Decision #1]         ← Pinned (user marked as important)
[Key Decision #2]         ← Pinned
...
[Turn N-4]                ← Sliding window starts here
[Turn N-3]
[Turn N-2]
[Turn N-1]
[Current Turn]
[Output Buffer]           ← Reserved
```

### Pattern: Progressive Summarization

When conversation exceeds budget:
1. Summarize oldest turns into a "conversation summary" block
2. Keep the summary as a single anchor message
3. Update summary every N turns
4. Always keep: first system message, task definition, last 5 turns

### Pattern: Selective Tool Result Caching

Tool outputs (file reads, search results, command output) consume the most tokens.

```
Strategy:
  - Cache tool results keyed by (tool, args, file_hash)
  - On re-request: serve from cache (0 new tokens)
  - On file change: invalidate cache for that file
  - Always truncate: command output > 200 lines → first 50 + last 50
  - Never cache: error output (always show in full)
```
