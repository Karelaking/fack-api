import fs from "fs";
import path from "path";

const testsDir = path.join(process.cwd(), "test");
const files = fs.readdirSync(testsDir).filter((f) => f.endsWith(".test.ts"));

files.forEach((file) => {
  const filePath = path.join(testsDir, file);
  let content = fs.readFileSync(filePath, "utf8");
  // Just add it under responseTemplate
  content = content.replace(
    /responseTemplate: null,/g,
    "responseTemplate: null,\n    isAuthRequired: false,",
  );
  fs.writeFileSync(filePath, content);
});

console.log("Fixed missing isAuthRequired properties in tests");
