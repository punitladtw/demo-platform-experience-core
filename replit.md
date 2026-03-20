# Platform Engineering Portal — Workspace

## Overview

A full proof-of-concept platform engineering experience demonstrating the core layers of an internal developer platform (IDP): Developer Portal, Control Plane API, CLI, Kubernetes-backed namespaces, RBAC, compliance enforcement, and an evidence vault.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Frontend**: React + Vite (Tailwind CSS, Wouter, TanStack Query)
- **Auth**: Session-based (express-session) + GitHub OAuth (mocked for demo)
- **Build**: esbuild (CJS bundle)

## Architecture

### Three Touchpoints
1. **Developer Portal** (`artifacts/portal`) — React SPA at `/`, authenticated via GitHub OAuth session
2. **Control Plane API** (`artifacts/api-server`) — Express 5 at `/api`, backed by PostgreSQL
3. **CLI** (`artifacts/cli`) — `platform` command, calls the same API

### Control Plane Features
- **Teams** — Create/manage/delete teams, add members with roles (owner/member)
- **Namespaces** — Kubernetes namespaces per team per environment (dev/prod), with resource quotas
- **Starter Kits** — Catalog of pre-approved service templates
- **Deployments** — Trigger deployments with compliance checks baked in
- **Evidence Vault** — Audit trail for every compliance check on every deployment
- **Operators** — Platform operators (S3, RDS, Salesforce, Kafka, Redis, Vault)

### Compliance Engine (`artifacts/api-server/src/lib/compliance.ts`)
- Prod deployments: require ≥80% test coverage, or they are **blocked**
- Dev deployments: test coverage check skipped
- All deployments run: security scan, policy gate (OPA mock), RBAC check (K8s mock)
- Every check creates an evidence record in the vault

### Kubernetes Mock
- Namespaces provisioned in DB as `{team-slug}-{environment}` (e.g. `payments-prod`)
- Resource quotas: prod = 8 CPU / 16Gi / 50 pods, dev = 4 CPU / 8Gi / 20 pods
- RBAC: enforced via team membership + namespace scoping in API layer
- No real K8s connection; all state is in PostgreSQL

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express 5 API server (auth, teams, namespaces, deployments, evidence)
│   ├── portal/             # React + Vite Developer Portal SPA
│   └── cli/                # Platform CLI (platform login/teams/namespaces/deploy/evidence)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/
│   └── src/seed.ts         # Database seeding script
```

## Key Files

- `lib/api-spec/openapi.yaml` — Full API contract (auth, teams, namespaces, deployments, evidence, operators, users)
- `lib/db/src/schema/` — All table definitions
- `artifacts/api-server/src/lib/compliance.ts` — Compliance engine
- `artifacts/api-server/src/lib/auth.ts` — Session auth + requireAuth/requireAdmin middleware
- `artifacts/api-server/src/routes/` — Route handlers per domain
- `artifacts/portal/src/pages/` — All frontend pages
- `artifacts/cli/src/commands/` — CLI commands

## Running

- API server: `pnpm --filter @workspace/api-server run dev`
- Portal: `pnpm --filter @workspace/portal run dev`
- CLI: `pnpm --filter @workspace/cli run dev -- <command>`
- Seed: `pnpm --filter @workspace/scripts run seed`

## Demo Login

Without GitHub OAuth credentials, visiting `/api/auth/github/callback` auto-creates a demo admin user. In production, set `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` environment variables.

## Compliance Rules

| Environment | Test Coverage | Threshold |
|-------------|--------------|-----------|
| dev | skipped | — |
| prod | required | ≥ 80% |

Failed checks → deployment status = `blocked`, evidence records created with `failed` status.
