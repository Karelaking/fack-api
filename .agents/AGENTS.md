<!-- BEGIN:graphify-agent-rules -->

# Graphify Codebase Navigation

Before attempting to answer any architectural, relational, or structural questions about this codebase:

1. Check if `graphify-out/graph.json` exists. If it does, always read `graphify-out/graph.json` and `graphify-out/GRAPH_REPORT.md` first to find relevant modules, boundaries, and connections instead of doing broad manual text searches or scanning all files.
2. If source files have changed, update the knowledge graph by running:
   `& "$env:APPDATA\Python\Python314\Scripts\graphify.exe" . --code-only`
3. Leverage the communities defined in `graphify-out/` to locate context and seams when making updates.

<!-- END:graphify-agent-rules -->
