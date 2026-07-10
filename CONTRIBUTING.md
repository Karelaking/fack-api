# Contributing to Fack API's

First off, thank you for considering contributing to Fack API's! It's people like you that make it a great tool for the open-source community.

---

## 🤝 Code of Conduct

Please follow standard developer courtesy. Be polite, construct feedback positively, and respect other maintainers and contributors.

---

## 🛠️ Local Development Setup

To set up a local development environment:

1. **Fork and Clone** the repository.
2. **Install pnpm** if you haven't already:
   ```bash
   corepack enable && corepack prepare pnpm@latest --activate
   ```
3. **Install dependencies**:
   ```bash
   pnpm install
   ```
4. **Push database schema**:
   ```bash
   mkdir data
   pnpm drizzle-kit push
   ```
5. **Run the dev server**:
   ```bash
   pnpm dev
   ```

---

## 🎨 Coding Guidelines

We enforce clean, professional, and type-safe code standards.

1. **TypeScript First**: Write strong types. Avoid the use of `any` wherever possible.
2. **Document Everything**: Provide JSDoc comments for public-facing utility functions, React components, hooks, and database schemas.
3. **Server Actions vs Client Components**:
   - Keep page components as Server Components by default to load data close to SQLite.
   - Use Client Components (`"use client"`) only for interactive elements (such as forms, modals, canvasses, and sliders).
4. **Styling**: Always use the defined tailwind design variables from `app/globals.css`. Ensure dark mode accessibility.
5. **Next.js 16 Rules**:
   - Remember that `params` and `searchParams` are now promises in Next.js 16 and must be awaited.
   - Do not use `middleware.ts` — use `proxy.ts` for route interception.

---

## 🧪 Testing Your Changes

Before submitting a Pull Request, run the following verification steps locally:

1. **Lint check**:
   ```bash
   pnpm lint
   ```
2. **Build check** (crucial for catching TypeScript or build bundling issues):
   ```bash
   pnpm build
   ```
3. **Docker validation**:
   Ensure the standalone build runs inside Docker:
   ```bash
   docker compose build
   ```

---

## 📥 Submitting Pull Requests

1. **Branch naming**: Use prefix conventions like `feat/`, `fix/`, `docs/`, or `refactor/`.
2. **Commit messages**: Write clear, descriptive commit messages.
3. **Submit PR**: Describe the problem and outline your changes. Link any related issues.
