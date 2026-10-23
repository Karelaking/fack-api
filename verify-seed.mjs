import { createClient } from "@libsql/client";

const url = `file:${process.argv[2].replace(/\\/g, "/")}`;
const client = createClient({ url });
const projects = await client.execute(
  "SELECT id, name, slug FROM projects ORDER BY id",
);
const notes = await client.execute(
  "SELECT id, project_id, title, content, pinned FROM notes",
);
console.log("projects:", JSON.stringify(projects.rows));
console.log("notes:", JSON.stringify(notes.rows));
client.close();
