# Platform Engineering Experience — Core

A proof-of-concept Internal Developer Platform (IDP) demonstrating what a modern platform engineering experience looks like at scale. The system exposes three touchpoints — a **Developer Portal**, a **Control Plane API**, and a **CLI** — all backed by a PostgreSQL data store with mocked Kubernetes and GitHub integrations.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Local Setup](#local-setup)
- [Running the Application](#running-the-application)
- [CLI Reference](#cli-reference)
- [API Reference](#api-reference)
- [Demo Personas](#demo-personas)
- [Compliance Engine](#compliance-engine)
- [Development Nuances & Gotchas](#development-nuances--gotchas)
- [Code Generation (OpenAPI → Hooks/Schemas)](#code-generation-openapi--hooksschemas)

---

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│              Three Touchpoints               │
│                                             │
│   ┌──────────┐  ┌──────────┐  ┌─────────┐  │
│   │  Portal  │  │   CLI    │  │  (AI /  │  │
│   │  (React) │  │(Commander│  │ ChatOps)│  │
│   └────┬─────┘  └────┬─────┘  └────┬────┘  │
│        └─────────────┴─────────────┘        │
│                      │                      │
│          ┌───────────▼──────────┐           │
│          │  Control Plane API   │           │
│          │   (Express 5 / REST) │           │
│          └───────────┬──────────┘           │
│                      │                      │
│          ┌───────────▼──────────┐           │
│          │     PostgreSQL        │           │
│          │   (Drizzle ORM)      │           │
│          └──────────────────────┘           │
└─────────────────────────────────────────────┘

Kubernetes, GitHub, OPA, cert-manager → all mocked in DB
```

**Key capabilities:**
- Teams, Namespaces (Kubernetes-style), and RBAC
- Deployment pipeline with embedded compliance checks
- Evidence Vault (immutable audit trail per deployment)
- Starter Kit catalog and Platform Operators catalog
- Role-based access: admins see everything; members see only their teams

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 24 |
| Language | TypeScript 5.9 |
| Package Manager | pnpm (workspaces monorepo) |
| API Framework | Express 5 |
| Database | PostgreSQL + Drizzle ORM |
| Validation | Zod v4, drizzle-zod |
| Frontend | React 19, Vite 7, Tailwind CSS 4, Wouter, TanStack Query v5 |
| UI Components | Radix UI (shadcn-style) |
| CLI | Commander.js, Chalk, Ora, cli-table3 |
| Auth | express-session (cookie-based, HTTP-only) |
| API Codegen | Orval (OpenAPI 3.1 → React Query hooks + Zod schemas) |
| Build | esbuild (API), Vite (Portal) |

---

## Repository Structure

```
demo-platform-experience-core/
├── artifacts/
│   ├── api-server/          # Express 5 REST API (port 3000)
│   ├── portal/              # React + Vite Developer Portal (port 5173)
│   ├── cli/                 # `platform` CLI tool
│   └── mockup-sandbox/      # Isolated UI mockup sandbox
├── lib/
│   ├── api-spec/            # openapi.yaml + Orval codegen config
│   ├── api-client-react/    # Generated TanStack Query hooks (do not edit by hand)
│   ├── api-zod/             # Generated Zod schemas (do not edit by hand)
│   └── db/                  # Drizzle ORM schema definitions + DB connection
├── scripts/
│   └── src/seed.ts          # Database seeder (idempotent)
├── tsconfig.base.json       # Shared TypeScript base config
├── pnpm-workspace.yaml      # Workspace package glob config
└── replit.md                # Replit-specific notes
```

### Key Source Files

| File | Purpose |
|---|---|
| `lib/api-spec/openapi.yaml` | Single source of truth for the API contract |
| `lib/db/src/schema/` | All Drizzle table definitions |
| `artifacts/api-server/src/lib/compliance.ts` | Compliance engine (coverage checks, evidence creation) |
| `artifacts/api-server/src/lib/auth.ts` | Session auth + `requireAuth` / `requireAdmin` middleware |
| `artifacts/api-server/src/routes/` | Route handlers per domain |
| `artifacts/portal/src/pages/` | Frontend page components |
| `artifacts/cli/src/commands/` | CLI command implementations |
| `scripts/src/seed.ts` | Demo data seeding (idempotent via `onConflictDoUpdate`) |

---

## Prerequisites

- **Node.js** v24+
- **pnpm** (install via `npm i -g pnpm`)
- **PostgreSQL** running locally (or a connection string to a remote instance)

---

## Local Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set environment variables

There is no `.env.example` file — set these in your shell or a `.env` file loaded by your preferred tool (e.g., `direnv`).

**API Server** (`artifacts/api-server`):

```bash
DATABASE_URL=postgresql://postgres:password@localhost:5432/platform_core
PORT=3000
SESSION_SECRET=dev-secret-change-in-prod   # optional; has a default
NODE_ENV=development
```

**Developer Portal** (`artifacts/portal`):

```bash
PORT=5173
BASE_PATH=/
```

**CLI** (optional override):

```bash
PLATFORM_API_URL=http://localhost:3000/api  # defaults to http://localhost:80/api
```

### 3. Push the database schema

```bash
pnpm --filter @workspace/db run push
```

### 4. Seed demo data

```bash
pnpm --filter @workspace/scripts run seed
```

The seed script is **idempotent** — safe to run multiple times. It creates:

| Type | Records |
|---|---|
| Users | Alex (admin), Sarah (member), Marcus (member) |
| Teams | Payments, Identity, Data Platform |
| Namespaces | 5 namespaces across dev/prod environments |
| Starter Kits | 6 pre-approved templates |
| Operators | 6 platform operators |
| Deployments + Evidence | 6 sample deployments with full compliance audit trail |

---

## Running the Application

Run each service in a separate terminal.

### API Server

```bash
PORT=3000 DATABASE_URL=<your-url> pnpm --filter @workspace/api-server run dev
```

Starts at `http://localhost:3000`. All routes are under `/api`.

### Developer Portal

```bash
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/portal run dev
```

Opens at `http://localhost:5173`. The portal expects the API at `/api` — in dev this must be proxied or the API must be reachable from the same origin. Configure `vite.config.ts` proxy if needed.

### CLI

```bash
# Use the default API URL or override it
PLATFORM_API_URL=http://localhost:3000/api pnpm --filter @workspace/cli run dev -- <command>

# Examples
pnpm --filter @workspace/cli run dev -- teams list
pnpm --filter @workspace/cli run dev -- deploy --namespace 2 --service api --image v1.2.3 --coverage 85
pnpm --filter @workspace/cli run dev -- evidence list
```

### Build for Production

```bash
pnpm build   # builds all packages (typecheck + compile)
```

---

## CLI Reference

### `platform login`
Authenticates the user. In demo mode, automatically logs in as admin.
Config stored at `~/.platform/config.json`.

### `platform teams`

```bash
platform teams list                                          # list all teams (admin) or own teams (member)
platform teams create --name "Payments" --description "..."  # admin only
platform teams members <teamId>                              # view team members
```

### `platform namespaces`

```bash
platform namespaces list
platform namespaces create --team <teamId> --environment prod
```

### `platform deploy`

```bash
platform deploy --namespace <id> --service <name> --image <tag> --coverage <percent>
```

Compliance checks run automatically. Prod deployments with coverage < 80% are **blocked**. Output shows the check-by-check result.

### `platform evidence`

```bash
platform evidence list                        # all evidence records
platform evidence list --deployment <id>      # filter by deployment
platform evidence list --status failed        # filter by status
```

### `platform starterkits`

```bash
platform starterkits list
platform starterkits get <id>
```

---

## API Reference

All routes are prefixed `/api`. Authentication is required except where noted.

| Method | Path | Description | Auth |
|---|---|---|---|
| `GET` | `/api/healthz` | Health check | None |
| `POST` | `/api/auth/login` | Demo login (`{ persona: "admin" | "member" }`) | None |
| `POST` | `/api/auth/logout` | End session | None |
| `GET` | `/api/auth/me` | Current user | Required |
| `GET` | `/api/teams` | List teams (RBAC filtered) | Required |
| `POST` | `/api/teams` | Create team | Admin |
| `GET` | `/api/teams/:id` | Team detail | Required |
| `PATCH` | `/api/teams/:id` | Update team | Admin |
| `DELETE` | `/api/teams/:id` | Delete team | Admin |
| `GET` | `/api/teams/:id/members` | List members | Required |
| `POST` | `/api/teams/:id/members` | Add member | Admin |
| `DELETE` | `/api/teams/:id/members/:userId` | Remove member | Admin |
| `GET` | `/api/namespaces` | List namespaces (RBAC filtered) | Required |
| `POST` | `/api/namespaces` | Create namespace | Admin |
| `GET` | `/api/namespaces/:id` | Namespace detail | Required |
| `DELETE` | `/api/namespaces/:id` | Delete namespace | Admin |
| `GET` | `/api/deployments` | List deployments (RBAC filtered) | Required |
| `POST` | `/api/deployments` | Trigger deployment (runs compliance) | Required |
| `GET` | `/api/deployments/:id` | Deployment detail | Required |
| `GET` | `/api/evidence` | List evidence records | Required |
| `GET` | `/api/evidence/:id` | Evidence record detail | Required |
| `GET` | `/api/starterkits` | List starter kit catalog | Required |
| `GET` | `/api/starterkits/:id` | Starter kit detail | Required |
| `GET` | `/api/operators` | List platform operators | Required |
| `GET` | `/api/users` | List all users | Admin |

---

## Demo Personas

No real GitHub OAuth is required. Use the login endpoint to switch personas:

```bash
# Admin — sees all teams, namespaces, deployments, users
curl -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"persona": "admin"}'

# Member — sees only own teams and their resources
curl -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"persona": "member"}'
```

In the portal, the login page presents two buttons for these personas.

**Demo users:**
- **Alex Platform Admin** (`admin`) — owner of all teams, full platform access
- **Sarah Developer** (`member`) — member of Payments, owner of Data Platform

---

## Compliance Engine

Located in `artifacts/api-server/src/lib/compliance.ts`.

Every deployment triggers four sequential checks. Each check writes an immutable evidence record.

| Check | Dev | Prod | Threshold |
|---|---|---|---|
| `test_coverage` | Skipped | Required | ≥ 80% |
| `security_scan` | Runs (mocked pass) | Runs (mocked pass) | — |
| `policy_gate` | Runs (OPA mock) | Runs (OPA mock) | — |
| `rbac_check` | Runs (K8s mock) | Runs (K8s mock) | — |

**Outcomes:**
- All checks pass → deployment status = `succeeded`
- Any check fails → deployment status = `blocked`, evidence shows `failed` with threshold vs actual

Evidence records are never deleted or updated — they form an immutable compliance audit trail. Cascaded deletes only occur if the parent deployment record is deleted.

---

## Development Nuances & Gotchas

### Authentication
- Auth uses **express-session** (cookie-based), not JWTs. The CLI does not store tokens — it shares the session cookie.
- Default session secret is hardcoded for dev. Always set `SESSION_SECRET` in production.
- Cookie is HTTP-only with a 7-day expiry. Secure flag is only enabled when `NODE_ENV=production`.
- GitHub OAuth routes exist (`/api/auth/github`) but are not wired to a real GitHub App. In the demo, the login flow uses `POST /api/auth/login` directly.

### RBAC
- Enforced at the **database query layer** (Drizzle joins + filters), not at middleware level.
- Admins bypass all team-membership filters.
- Non-admin users attempting to access resources outside their teams receive empty arrays (not 403s) — this is a POC simplification.

### OpenAPI & Code Generation
- `lib/api-client-react/` and `lib/api-zod/` are **generated files** — do not edit by hand.
- To regenerate after changing `openapi.yaml`:
  ```bash
  pnpm --filter @workspace/api-spec run codegen
  ```
- The OpenAPI spec is **manually maintained** — it is not auto-generated from Express routes. Keep the spec and route handlers in sync by hand.

### Namespace Naming
- K8s namespace names follow the pattern `{team-slug}-{environment}` (e.g., `payments-prod`).
- Team slugs must be unique. Creating a team with a duplicate slug will fail at the DB constraint level.

### Mocked Infrastructure
- **Kubernetes**: No real cluster. Namespace records, resource quotas, and RBAC are all stored in PostgreSQL.
- **GitHub**: No real GitHub API calls. User data is seeded directly.
- **OPA / Policy Gate**: Returns a mocked `pass` result.
- **Cert Manager / Route53**: Not implemented; placeholders only.

### Resource Quotas
- Stored in the `namespaces` table but not actively enforced during deployments in this POC.

### PORT is Required
- Both the API server and portal will throw an error on startup if `PORT` is not set.
- The portal also requires `BASE_PATH`.

### Portal → API Proxy (Dev)
- In local development, the portal (Vite, port 5173) and API (Express, port 3000) are on different ports. The portal makes requests to `/api` (relative). You may need to add a Vite proxy in `artifacts/portal/vite.config.ts`:
  ```ts
  server: {
    proxy: {
      '/api': 'http://localhost:3000'
    }
  }
  ```
  Check the existing `vite.config.ts` to see if this is already configured.

### Starter Kits & Operators
- Both are **read-only catalogs** seeded at setup. No user creation or provisioning logic exists in this POC.

---

## Code Generation (OpenAPI → Hooks/Schemas)

The frontend and CLI consume a generated client derived from `lib/api-spec/openapi.yaml`.

```
openapi.yaml
    │
    ├── Orval ──► lib/api-client-react/   (TanStack Query hooks, e.g. useListTeams())
    └── Orval ──► lib/api-zod/            (Zod schemas for runtime validation)
```

**Regenerate after API changes:**

```bash
pnpm --filter @workspace/api-spec run codegen
```

**Workflow when adding a new endpoint:**
1. Add the route to `openapi.yaml`
2. Run codegen
3. Implement the Express route handler in `artifacts/api-server/src/routes/`
4. Use the generated hook in the portal or schema in the CLI
