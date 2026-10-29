# Code Retrieval Patterns

Read this when designing RAG for code: choosing a retrieval granularity, chunking source files, embedding code, or building/querying a codebase knowledge graph.

## Retrieval Strategies for Code

### File-Level Retrieval

Best for: navigating to the right file when the agent knows what it needs.

```
Query: "authentication middleware"
Strategy:
  1. Filename pattern match: *auth*, *middleware*
  2. Import graph: files that import auth modules
  3. Symbol search: exported functions matching auth*
  4. Content search: files containing auth-related patterns
  5. Rank by: recency of edit + import centrality + name match
```

### Chunk-Level Retrieval (RAG for Code)

Best for: finding specific implementations within large files.

**Chunking Strategy for Source Code:**
- Chunk by function/class boundaries (never mid-function)
- Include the function signature + docstring + body as one chunk
- Attach metadata: file path, language, exports, imports
- Overlap: include 2 lines above/below for context
- Max chunk size: 200 lines (larger functions get sub-chunked by logical block)

**Embedding Considerations:**
- Code-specific embeddings (CodeBERT, StarCoder embeddings) outperform general text embeddings by 15-30% on code retrieval tasks
- Hybrid search (keyword + semantic) outperforms either alone
- Index function signatures separately for fast symbol lookup

### Dependency-Aware Retrieval

When retrieving a function, also retrieve:
1. Its type definitions (interfaces, types it uses)
2. Its direct dependencies (imported functions it calls)
3. Its tests (to understand expected behavior)
4. Its callers (to understand usage context)

This "context neighborhood" approach prevents the agent from seeing a function in isolation.

## Knowledge Graph Construction

### Codebase Graph Schema

```
Nodes:
  - File (path, language, size, last_modified)
  - Function (name, signature, docstring, complexity)
  - Class (name, methods, properties, inheritance)
  - Module (name, exports, dependencies)
  - Test (name, covers, assertions)
  - Config (type, values, affects)

Edges:
  - IMPORTS (File → File)
  - CALLS (Function → Function)
  - IMPLEMENTS (Class → Interface)
  - TESTS (Test → Function)
  - CONFIGURES (Config → Module)
  - DEPENDS_ON (Module → Module)
```

### Graph Queries for Context

| Agent Question | Graph Query | Context Retrieved |
|---------------|-------------|-------------------|
| "How does auth work?" | Subgraph around auth module, 2 hops | Auth files + dependencies + tests |
| "What breaks if I change X?" | Reverse dependency traversal from X | All callers + their tests |
| "What's the API surface?" | All exported functions from API modules | Route handlers + types + middleware |
| "How is this tested?" | TEST edges from target function | Test files + fixtures + mocks |
