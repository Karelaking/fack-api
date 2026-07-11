<p align="center">
  <img src="./public/logo.png" alt="Fack API's Logo" width="120" height="120" style="border-radius: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.15);" />
</p>

<h1 align="center">🛠️ Fack API's</h1>

<p align="center">
  <strong>A premium, self-hostable, node-based mock API platform for modern frontend & backend decoupled workflows.</strong>
</p>

<p align="center">
  <a href="https://nextjs.org"><img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js" /></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript" alt="TypeScript" /></a>
  <a href="https://tailwindcss.com"><img src="https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" /></a>
  <a href="https://orm.drizzle.team"><img src="https://img.shields.io/badge/Drizzle_ORM-v0.45-C5F74F?style=for-the-badge&logo=drizzle&logoColor=black" alt="Drizzle ORM" /></a>
  <a href="https://sqlite.org"><img src="https://img.shields.io/badge/SQLite-3-003B57?style=for-the-badge&logo=sqlite" alt="SQLite" /></a>
  <a href="https://docker.com"><img src="https://img.shields.io/badge/Docker-Alpine-2496ED?style=for-the-badge&logo=docker" alt="Docker" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" alt="License" /></a>
</p>

---

Fack API's is a zero-configuration, self-hostable mock API platform designed to streamline decoupled software development. It functions as a flexible, high-fidelity mock backend that allows frontend and mobile teams to build and test code independently. With a graphical node canvas, a visual schema builder, custom chaos testing, and automatic TypeScript compilation, Fack API's accelerates your dev cycle from days to hours.

---

## 📸 Screenshots & Showcase

<table>
  <tr>
    <td width="50%" align="center">
      <strong>🗂️ Workspaces Dashboard</strong><br />
      <img src="./public/screenshots/dashboard.png" alt="Workspaces Dashboard" style="border-radius: 8px; border: 1px solid var(--border);" />
    </td>
    <td width="50%" align="center">
      <strong>🎨 Node-Based Canvas Designer</strong><br />
      <img src="./public/screenshots/canvas.png" alt="Node-Based Canvas Designer" style="border-radius: 8px; border: 1px solid var(--border);" />
    </td>
  </tr>
  <tr>
    <td colspan="2" align="center">
      <strong>⚙️ Workspace Settings & Safe Deletion</strong><br />
      <img src="./public/screenshots/settings.png" alt="Workspace Settings" style="max-width: 70%; border-radius: 8px; border: 1px solid var(--border);" />
    </td>
  </tr>
</table>

---

## ✨ Features

- 🌐 **Isolated Namespaces**: Segment routes under individual projects and custom URL prefixes (e.g. `/mock/project-slug/...`).
- 🎨 **Visual Node Canvas**: Design your endpoints graphically, customize HTTP methods, and simulate response pipelines with **React Flow**.
- 🌳 **Nested JSON Schema Builder**: Build complex response bodies with deep nestings ("objects inside arrays of objects") without writing raw JSON.
- 🎲 **Faker.js Data Synthesizer**: Connect any schema property to a rich library of data providers (names, images, finance, strings, addresses).
- ⚡ **Chaos Testing Simulator**: Inject randomized delays (min/max latency) and specify failure rates (e.g. 5% of queries fail with a 500 error) to test UI resilience.
- 📁 **Type Contract Exporter**: Automatically compile client-side TypeScript interfaces (`.d.ts` files) directly from your visual schemas.
- 🚀 **Zero-Config Database**: Backed by a high-performance local SQLite file wrapped in type-safe Drizzle ORM queries.
- 🐳 **Native Containerization**: Light Alpine-based multi-stage Docker build ready for instant deployments with persistent volumes.

---

## 🏗️ Architecture

```mermaid
graph TD
    A["💻 Client / Frontend App"] -->|"1. API Request (/mock/:slug/*)"| D["🔀 Router / Proxy Layer"]
    B["🖥️ Dashboard UI"] -->|"Define Schema & Topology"| C[("sqlite SQLite Database")]
    C -->|"Sync & Load TOPOLOGY"| D
    D -->|"2. Match Route (path-to-regexp)"| E["🎲 Mock Engine (JSF + Faker.js)"]
    E -->|"3. Add Latency & Chaos Sim"| F["⚡ Delay / Error Injector"]
    F -->|"4. Return Payload / Code"| A

    style A fill:#4F46E5,stroke:#fff,stroke-width:2px,color:#fff
    style B fill:#10B981,stroke:#fff,stroke-width:2px,color:#fff
    style C fill:#0F172A,stroke:#fff,stroke-width:2px,color:#fff
    style D fill:#F59E0B,stroke:#fff,stroke-width:2px,color:#fff
    style E fill:#6366F1,stroke:#fff,stroke-width:2px,color:#fff
    style F fill:#EF4444,stroke:#fff,stroke-width:2px,color:#fff
```

---

## 🛠️ Technology Stack

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Framework** | Next.js 16 (App Router) | Runtime container, rendering, and API handler |
| **Flow Canvas** | React Flow (v12) | Topology graph canvas layout |
| **UI Components** | Radix UI + Tailwind CSS v4 | Clean interface styling and accessibility |
| **State Manager** | Zustand + Immer | Schema tree edits and node transformations |
| **ORM** | Drizzle ORM | Database schema mapping and DDL generation |
| **Database** | SQLite (@libsql/client) | Portable file-based storage engine |
| **Mock Engine** | json-schema-faker + Faker.js | Synthetic mock payload parser |
| **Route Matcher** | path-to-regexp | Fast Express-like matching |
| **Type Compiler** | json-schema-to-typescript | Compiles schema trees into raw `.d.ts` strings |

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 20+
- pnpm (v10+)

### Step-by-Step Setup
1. **Clone the repository** and enter the folder.
2. **Install dependencies**:
   ```bash
   pnpm install
   ```
3. **Initialize the local database**:
   ```bash
   mkdir data
   pnpm drizzle-kit push
   ```
4. **Boot the Next.js server**:
   ```bash
   pnpm dev
   ```
5. Open [http://localhost:3000/dashboard](http://localhost:3000/dashboard) to manage your projects.

---

## 🐳 Docker Deployment

To self-host Fack API's on your local network or server, you have two options:

### Option A: Pull Pre-built Image from Docker Hub
You can pull and run the official pre-built image directly:

```bash
# Pull the Docker image
docker pull mkkatiyar277/fake-api:latest

# Run the container
docker run -d -p 3000:3000 -v fack-data:/app/data mkkatiyar277/fake-api:latest
```

*Note: Replace `latest` with a specific version tag if needed.*

### Option B: Build and Run with Docker Compose
If you cloned the source repository and want to run it locally using Docker Compose:

1. **Spin up the container**:
   ```bash
   docker compose up -d
   ```

2. The dashboard will be accessible at `http://localhost:3000`. 
3. Database and project topologies are persisted in the `fack-data` volume.

---

## 📡 API Usage Example

If you create a project `payment-service` and add a `GET /v1/customers/:customerId` route:

```bash
curl -X GET http://localhost:3000/mock/payment-service/v1/customers/cust_9923
```

### Response Payload:
```json
{
  "id": "cust_9923",
  "name": "Jane Smith",
  "email": "jane.smith@example.com",
  "profile": {
    "avatar": "https://avatars.io/jane_smith",
    "jobTitle": "Lead System Architect"
  }
}
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](file:///e:/fack-api/LICENSE) file for details.
