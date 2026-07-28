---
trigger: always_on
---

---

trigger: always_on
---

<!-- BEGIN:code-style-agent-rules -->

# Naming Rules

- Use PascalCase for classes, interfaces, types, and enums.
- Use camelCase for variables, functions, and properties.
- Do not use an I prefix for interface names (e.g., use User, not IUser).
- Use full, clear words instead of confusing short names (e.g. , use fullName, not fName).
- All file name should be end with the prefix according to there service (e.g. , use user.type.ts for user type declrations).
- Do not use _ as a prefix for private properties.

# Components

- 1 file per logical component (e.g. parser, scanner, emitter, checker).
- Do not add new files. :)
- files with .generated.* suffix are auto-generated, do not hand-edit them.

# Type Safety Rules

- Turn on "strict": true inside your tsconfig.json file.
- Avoid the any type completely to prevent hidden runtime bugs.
- Let TypeScript infer types when the assigned value makes it obvious.
- Prefer undefined over null for missing or empty values.
- Always write return type of all the functions.
- Do not export types/functions unless you need to share it across multiple components.
- Do not introduce new types/values to the global namespace.
- Within a file, type definitions should come first.
- Use undefined. Do not use null.

## General Assumptions

- Consider objects like Nodes, Symbols, etc. as immutable outside the component that created them. Do not change them.
- Consider arrays as immutable by default after creation.

## Classes

- For consistency, do not use classes in the core compiler pipeline. Use function closures instead.

## Flags

- More than 2 related Boolean properties on a type should be turned into a flag.

## Strings

- Use double quotes for strings.
- All strings visible to the user need to be localized (make an entry in diagnosticMessages.json).

## Diagnostic Messages

- Use a period at the end of a sentence.
- Use indefinite articles for indefinite entities.
- Definite entities should be named (this is for a variable name, type name, etc..).
- When stating a rule, the subject should be in the singular (e.g. "An external module cannot..." instead of "External modules cannot...").
- Use present tense.

# General Code Structure

- Always use SOLID and OPP's principals and make code moduler.
- Always write loosely cupled code to reduse the code dependency.
- Always use strict equality operators (=== and !==) instead of == and !=.
- Always add semicolons at the end of your statements.
- Use const for values that do not change and let for values that do.
- Keep functions small so they perform only one clear task.
- Always use arrow functions for the ui components.
- Always write the documentations for the code.
- Use JSDoc style comments for functions, interfaces, enums, and classes.
- Do not use for..in statements; instead, use ts.forEach, ts.forEachKey and ts.forEachValue. Be aware of their slightly different semantics.
- Try to use ts.forEach, ts.map, and ts.filter instead of loops when it is not strongly inconvenient.

# Style

- Only surround arrow function parameters when necessary.
- For example, (x) => x + x is wrong but the following are correct:
- x => x + x
- (x,y) => x + y
- <T>(x: T, y: T) => x === y
- Always surround loop and conditional bodies with curly braces. Statements on the same line are allowed to omit braces.
- Open curly braces always go on the same line as whatever necessitates them.
- Parenthesized constructs should have no surrounding whitespace.
- A single space follows commas, colons, and semicolons in those constructs. For example:
- for (var i = 0, n = str.length; i < 10; i++) { }
- if (x < 10) { }
- function f(x: number, y: string): void { }
- Use a single declaration per variable statement
- (i.e. use var x = 1; var y = 2; over var x = 1, y = 2;).
- else goes on a separate line from the closing curly brace.
- Use 4 spaces per indentation

<!-- END:code-style-agent-rules -->
