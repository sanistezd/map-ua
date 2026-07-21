# Architecture

High-level shape of the starter. Detailed rules live in
[`context/code-standards.md`](../context/code-standards.md); invariants and
boundaries as a building contract live in
[`context/architecture.md`](../context/architecture.md).

## Stack (template defaults)

| Layer         | Technology              | Role                                        |
| ------------- | ----------------------- | ------------------------------------------- |
| API           | NestJS + TypeScript     | Modular monolith HTTP API                   |
| ORM           | Drizzle + PostgreSQL    | Persistence                                 |
| Queue         | Redis + BullMQ          | Async side effects (e.g. email)             |
| Email         | Resend and/or SMTP      | Optional notifications                      |
| Storage       | S3-compatible (AWS SDK) | Optional file blobs                         |
| Auth          | `AuthVerifier` port     | Pluggable bearer verification (fail closed) |
| Web           | Next.js App Router      | UI                                          |
| Web structure | Feature-Sliced Design   | Layered frontend architecture               |
| UI            | Tailwind + shadcn/ui    | Design system primitives                    |
| i18n          | next-intl               | en / uk                                     |
| Shared        | `@root/shared`          | DTOs, error codes, contracts                |
| Tooling       | Turborepo + pnpm        | Monorepo tasks                              |
| Env           | Root `env/`             | Centralized example + local env files       |

## System diagram

```
┌─────────────┐     HTTP / JSON      ┌──────────────────────────────┐
│  apps/web   │ ───────────────────► │  apps/api  (/api)            │
│  Next + FSD │ ◄─────────────────── │  Nest modular monolith       │
└─────────────┘   error codes + DTOs └──────────────┬───────────────┘
       │                                            │
       │                         ┌──────────────────┼──────────────────┐
       │                         ▼                  ▼                  ▼
       │                    PostgreSQL            Redis            S3 (opt)
       │                                            │
       │                                       BullMQ workers
       │
       └── both apps share types via packages/shared
```

## API: modular monolith

### Domain modules (hexagonal)

Example: `modules/users`

```
users/
  domain/           # entities, ports, domain errors (framework-free)
  application/      # use cases; domain ports/models only
  infrastructure/   # Drizzle and technical-integration adapters
  presentation/     # controllers, HTTP errors, DTO mapping
  users.module.ts   # Nest wiring + exports
```

### Technical modules (flat)

`auth`, `email`, `storage`, `health` — integrations without a full hexagonal
split. Import their Nest module and inject the service you need.

### Cross-cutting

- `database/` — connection + lifecycle only (no business schema ownership)
- `queue/` — shared Redis / BullMQ connection
- `common/` — filters, guards shared across modules
- `config/` — Zod-validated env

**Invariant:** modules talk through exported services or shared contracts — not
another module’s tables.

## Web: Feature-Sliced Design

Dependency direction (enforced by ESLint):

```
app → widgets → features → entities → shared
```

| Layer      | Responsibility                  | Examples                                         |
| ---------- | ------------------------------- | ------------------------------------------------ |
| `app`      | Routes, providers, locale shell | `app/[locale]/page.tsx`                          |
| `widgets`  | Composed sections               | `users-dashboard`, `integration-tests`           |
| `features` | User actions                    | `user/create-user`, `test/email`, `toggle-theme` |
| `entities` | Entity API + display            | `user`, `integration`                            |
| `shared`   | UI kit, API client, validations | `shared/ui`, `shared/lib/validations`            |

### Feature groups

Organizational folders only (not layers):

```
features/user/create-user
features/user/delete-user
features/test/email
features/test/health
features/test/storage
```

Import the **slice** public API: `@/features/user/create-user`.

### Forms

```
shared/lib/validations     → reusable Zod field helpers
features/.../model/schema  → form schema + defaults + types
features/.../ui            → RHF + Field + i18n wiring
```

## Shared package

- Entity-first folders: `user`, `email`, `storage`, `api-error`, …
- Language-neutral API error codes; each client translates locally.
- No Nest/Next/React/Drizzle inside `packages/shared`.

## Auth model (template)

- API: bearer token → `AuthGuard` → `AuthVerifier` port.
- Default verifier is disabled (reject all guarded requests).
- Wire Clerk / Better Auth / Auth.js by implementing `AuthVerifier` and
  `AuthModule.register({ verifier: YourVerifier })`.
- Web should send `Authorization` with the provider token.

## Storage model

| Store         | Holds                               |
| ------------- | ----------------------------------- |
| PostgreSQL    | Users and other relational metadata |
| S3-compatible | Uploaded files / blobs              |
| Redis         | Job queue for async work            |

## Where to read next

- Rules: [`context/code-standards.md`](../context/code-standards.md)
- Building contract: [`context/architecture.md`](../context/architecture.md)
- Runbook: [root README](../README.md)
- Context workflow: [context-system.md](./context-system.md)
