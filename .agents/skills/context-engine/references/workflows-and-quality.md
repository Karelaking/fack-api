# Workflows & Quality Bar

Read this when running an end-to-end context workflow (bootstrap, task optimization, session memory), avoiding anti-patterns, or checking a context system against its evaluation metrics, troubleshooting table, and success criteria.

## Workflows

### Workflow 1: Bootstrap Agent Context for a New Codebase

```
Step 1: Index the codebase
  - Build file tree with metadata (language, size, last modified)
  - Extract all exports, imports, and dependency edges
  - Identify entry points (main files, route handlers, CLI commands)

Step 2: Construct initial knowledge graph
  - Map module dependencies
  - Identify architectural layers (API, service, data, config)
  - Detect frameworks and conventions (naming, structure, patterns)

Step 3: Generate project summary
  - One paragraph: what this project does
  - Architecture diagram (text-based)
  - Key directories and their roles
  - Critical files (config, entry points, shared types)

Step 4: Configure context tiers
  - Tier 0: Project summary, CLAUDE.md, active file
  - Tier 1: Related files within same module
  - Tier 2: Cross-module dependencies
  - Tier 3: Documentation and examples
```

### Workflow 2: Optimize Context for a Specific Task

```
Step 1: Parse task requirements
  - Extract entities (files, functions, features mentioned)
  - Identify task type (bug fix, feature, refactor, review)

Step 2: Retrieve relevant context
  - File-level: files matching entities
  - Dependency-level: imports/exports of matched files
  - Test-level: tests covering matched code
  - History-level: recent changes to matched files

Step 3: Budget allocation
  - Calculate total tokens available
  - Allocate per tier (see Token Budget Framework)
  - Pack context with greedy relevance

Step 4: Verify coverage
  - Check: all mentioned files included?
  - Check: type definitions for used types included?
  - Check: test examples for expected behavior included?
  - If gaps: retrieve missing context from lower tiers
```

### Workflow 3: Session Memory Management

```
Step 1: During session - capture learnings
  - New patterns discovered: log to working memory
  - Corrections received: mark as high-confidence learning
  - Errors encountered: log with resolution

Step 2: End of session - evaluate learnings
  - Which learnings are project-specific vs session-specific?
  - Which patterns recurred during this session?
  - Which corrections should become rules?

Step 3: Promote valuable learnings
  - Recurring patterns → CLAUDE.md or .claude/rules/
  - Project conventions → project documentation
  - Error resolutions → knowledge base

Step 4: Prune stale memory
  - Remove learnings about deleted files
  - Update learnings contradicted by new information
  - Archive session-specific context
```

## Anti-Patterns

| Anti-Pattern | Problem | Better Approach |
|-------------|---------|-----------------|
| Dumping entire files into context | Wastes tokens on irrelevant code | Retrieve specific functions/sections |
| No output buffer reservation | Agent output gets truncated | Always reserve 10-15% for output |
| Static context loading | Same context regardless of task | Dynamic retrieval based on task type |
| No staleness tracking | Using outdated information | Timestamp and verify before using |
| Full conversation replay | Older turns crowd out relevant code | Sliding window with summarization |
| Ignoring import graph | Missing type definitions, broken understanding | Always include direct dependencies |

## Evaluation Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| Context Relevance | % of loaded context actually used in response | > 70% |
| Retrieval Precision | % of retrieved items that are relevant | > 80% |
| Token Utilization | % of context budget used productively | > 85% |
| Staleness Rate | % of context items that are outdated | < 5% |
| Cache Hit Rate | % of tool results served from cache | > 40% |
| Handoff Completeness | % of required context passed between agents | 100% |

## Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| Agent responses ignore relevant files | Context retrieval missing import graph traversal | Enable dependency-aware retrieval; always include direct imports and type definitions alongside target files |
| Output truncated mid-response | No output buffer reserved in token budget | Reserve 10-15% of context window for generation; reduce Tier 2/3 content first |
| Stale context causing hallucinations | Memory layer not tracking file modification timestamps | Implement staleness detection with freshness scores; invalidate cache entries when source files change |
| RAG retrieval returns irrelevant chunks | Chunking splits functions mid-body or ignores code structure | Switch to AST-aware chunking at function/class boundaries; attach file path and export metadata to each chunk |
| Context window exceeded on large tasks | Greedy packing loads too many full files | Use adaptive compression: summarize boilerplate, load only signatures for low-priority files, keep high-signal code verbatim |
| Multi-agent handoff loses critical state | Raw conversation history passed instead of structured summary | Follow the Context Handoff Protocol: pass state summary, artifacts, constraints, open questions, and next steps |
| Knowledge graph queries return empty results | Graph not rebuilt after major refactors or branch switches | Schedule reindexing on commit hooks or branch checkout; validate node counts after rebuild |

## Success Criteria

- **Context Relevance above 70%**: At least 70% of tokens loaded into the context window are directly referenced or used in the agent's response.
- **Retrieval Precision above 80%**: More than 80% of retrieved code chunks or files are relevant to the current task, measured by human evaluation or downstream task success.
- **Token Utilization above 85%**: Productive token usage (system instructions + task-relevant code + active conversation) exceeds 85% of the allocated budget, with less than 15% wasted on redundant or low-signal content.
- **Staleness Rate below 5%**: Fewer than 5% of context items are outdated (file changed since last retrieval without re-verification), validated by comparing loaded content hashes against current file state.
- **Cache Hit Rate above 40%**: At least 40% of repeated tool invocations (file reads, searches) are served from cache, reducing redundant token consumption and latency.
- **Handoff Completeness at 100%**: Every multi-agent context handoff includes all five protocol elements (state summary, artifacts, constraints, open questions, next steps) with zero information gaps.
- **Session Memory Promotion Accuracy above 90%**: Learnings promoted to persistent memory (CLAUDE.md, rules files) are validated as still accurate within 30 days, with fewer than 10% requiring correction or rollback.
