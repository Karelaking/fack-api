---
name: project-design-planner
description: "Use when planning a complete project structure, selecting a technology stack, creating a PRD, or designing project architectures from scratch."
---

# Project Design Planner

This skill outlines the step-by-step workflow for planning, researching, documenting, and structuring a new project. It ensures that the project uses best-fit technologies, follows industry-grade coding standards, and is designed for scale and maintainability.

## Workflow Steps

### Step 1: Initial Inquiry
When a new project design or planning request is triggered:
1. First, check if the user has provided basic details.
2. If not, prompt the user to provide:
   - The core concept or idea.
   - Key functionality and user requirements.
   - Any specific constraints (e.g., timeline, target platforms, integration requirements).

### Step 2: Research & Brainstorming
Before making recommendations:
1. Research the project space or domain using `search_web` or codebase lookup (to see if there are similar projects or assets to reuse).
2. Brainstorm the core architecture components needed (frontend, backend, database, queue, cache, etc.).
3. Identify potential technical risks or performance challenges.

### Step 3: Interactive Clarification
Based on the research:
1. Formulate 3-5 high-impact questions to clarify architecture, user experience, or operational needs.
2. Ask these questions to the user before writing the PRD or selecting the tech stack.

### Step 4: Tech Stack Evaluation
Evaluate and select the best-fit technology stack based on:
- **Performance**: Throughput, latency, runtime overhead, caching strategies, and scalability.
- **Management**: Developer velocity, ease of maintenance, CI/CD simplicity, and telemetry/observability.
- **Availability**: Ecosystem maturity, hosting options (serverless vs. dedicated), licensing, and developer availability.

Provide a clear comparison table or breakdown of the recommended technologies.

### Step 5: Generate PRD.md
Create a `PRD.md` (Product Requirement Document) in the project workspace. The PRD must include:
1. **Overview & Goals**: What the project does and who it is for.
2. **Key Features**: Detailed list of user and system features.
3. **Tech Stack**: Selected technologies and why they were chosen.
4. **Data Architecture & Schema**: High-level data models, relationships, and storage engines.
5. **System Architecture**: Diagrams (e.g., Mermaid) showing data flow and component interactions.
6. **Security & Compliance**: Encryption, authentication, access control (RLS, RBAC), and data privacy guidelines.

### Step 6: Define Project Structure
Design a modular, scalable, and generalized directory structure.
1. Use industry best practices for the chosen tech stack (e.g., App Router for Next.js, clean architecture for Go/Rust).
2. Map out the folder hierarchy and specify the purpose of key directories/files.
3. Create an initial `implementation_plan.md` summarizing the plan for user review.

---

## Core Guidelines

1. **SOLID & DRY**: Design components to be modular, single-responsibility, and reusable.
2. **Security by Design**: Plan authentication, authorization (e.g., RLS, JWT verification), and secure data access from the start.
3. **Scalability**: Decouple intensive processes using message queues or background workers when appropriate.
4. **Documentation**: Keep the PRD and architecture plans up-to-date.
