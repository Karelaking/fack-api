import { generate } from "json-schema-faker";
import { faker } from "@faker-js/faker";

const schema = {
  type: "object",
  properties: {
    id: { type: "integer", faker: "number.int" },
    createdAt: { type: "string", faker: "date.past" },
    updatedAt: { type: "string", faker: "date.recent" },
    title: { type: "string", faker: "lorem.words" },
    description: { type: "string", faker: "lorem.paragraph" }
  },
  required: ["id", "createdAt", "updatedAt", "title", "description"]
};

async function run() {
  for (let i = 0; i < 5; i++) {
    const result = await generate(schema, {
      alwaysFakeOptionals: true,
      useDefaultValue: true,
      minItems: 1,
      maxItems: 5,
      extensions: { faker }
    });
    console.log(`Call ${i + 1}:`, JSON.stringify(result));
  }
}

run();
