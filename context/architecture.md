# Architecture Context

Source of truth for system shape. Implementation rules live in
`code-standards.md`. Human onboarding overview lives in `docs/architecture.md`.

## Stack

| Layer               | Technology                                       | Role                                                |
| ------------------- | ------------------------------------------------ | --------------------------------------------------- |
| Monorepo            | pnpm + Turborepo                                 | Workspace tasks and caching                         |
| API                 | NestJS + TypeScript                              | Modular monolith HTTP API under `/api`              |
| ORM                 | Drizzle ORM + PostgreSQL                         | Relational persistence                              |
| Queue               | Redis + BullMQ                                   | Async side effects (e.g. welcome email)             |
| Email               | Resend and/or SMTP (Nodemailer)                  | Optional outbound mail                              |
| Object storage      | AWS SDK S3 client                                | Optional blobs; `AWS_S3_ENDPOINT` for R2/MinIO/etc. |
| Auth                | `AuthVerifier` port + bearer guard               | Pluggable verification; fail closed by default      |
| Web                 | Next.js App Router + TypeScript                  | UI application                                      |
| Web structure       | Feature-Sliced Design                            | `app → widgets → features → entities → shared`      |
| UI                  | Tailwind CSS + shadcn/ui                         | Design-system primitives in `shared/ui`             |
| Forms               | React Hook Form + Zod                            | Client validation with Field primitives             |
| i18n                | next-intl                                        | English + Ukrainian locale routing                  |
| Shared contracts    | `@root/shared`                                   | DTOs, API error codes, cross-app types              |
| Tooling configs     | `@root/eslint-config`, `@root/typescript-config` | Shared lint/TS presets                              |
| Env                 | Root `env/`                                      | Committed `*.example.env`; ignored `*.local.env`    |
| Observability (API) | Pino (nestjs-pino), Helmet, throttling, Swagger  | Logging, security headers, rate limits, OpenAPI     |

## System Boundaries

- `apps/api` — Nest modular monolith. Owns HTTP API, domain use cases,
  persistence adapters, queues, and integrations.
- `apps/web` — Next.js UI organized with FSD. Owns presentation, client-side
  validation, i18n, and calling the API. Does not own business rules that
  must be enforced server-side.
- `packages/shared` — Framework-agnostic contracts only (types, DTOs, error
  codes). No Nest, Next, React, or Drizzle.
- `packages/eslint-config` / `packages/typescript-config` — Shared tooling;
  app-specific architecture rules stay in each app’s `eslint.config.mjs`.
- `env/` — Central env templates and developer-local values for api/web.
- `context/` — Building specs for agents/humans (this file and siblings).
- `docs/` — Human onboarding docs for the template.
- `assets/` — Non-runtime binaries (screenshots, brand, diagrams).

### API internal boundaries

- `modules/<domain>/` (e.g. `users`) — Hexagonal: `domain` → `application` →
  `infrastructure` → `presentation`. Owns its Drizzle schema under
  `infrastructure/persistence/`.
  Application services depend only on domain-owned ports and models;
  presentation maps domain errors and models to HTTP exceptions and DTOs.
- `modules/<tech>/` (e.g. `auth`, `email`, `storage`, `health`) — Flat
  integration modules; no fake hexagonal layers.
- `database/` — Shared connection and lifecycle only. Does not own business
  tables.
- `queue/` — Shared Redis / BullMQ connection for workers and producers.
- `common/` — Cross-cutting filters, guards (e.g. exception filter,
  non-production guard).
- `config/` — Zod-validated environment.

### Web internal boundaries

- `app/` — Routes, layouts, providers (composition root).
- `widgets/` — Page sections composed from features/entities.
- `features/` — User actions; may use organizational groups (`user/`, `test/`).
- `entities/` — Entity API clients and display pieces.
- `shared/` — UI kit, API client, lib (including `validations`).
- `i18n/` + `messages/` — Locale routing and translation catalogs.

## Storage Model

- **PostgreSQL**: Relational metadata (e.g. users), ownership, relationships.
  Accessed only through the owning module’s repository/schema.
- **S3-compatible object storage**: Uploaded files and large binaries. Keys
  under app-owned prefixes (e.g. diagnostic uploads under `test-uploads/`).
  Not for primary relational data.
- **Redis**: BullMQ job queues and related transient job state — not the
  source of truth for business entities.
- **Do not** store large blobs in PostgreSQL or put relational ownership only
  in object storage.

## Auth and Access Model

- Authentication is **pluggable**. No vendor SDK is required in the template.
- Nest exposes `AuthGuard` backed by an `AuthVerifier` port. Register an
  adapter via `AuthModule.register({ verifier: YourAuthVerifier })`.
- **Fail closed**: with the default/disabled verifier, guarded routes reject
  every request.
- Clients send the provider token in the standard `Authorization: Bearer …`
  header.
- Demo CRUD routes (e.g. users list/create/delete) may be ungated for
  template demonstration; product features that mutate real data must use the
  guard (and ownership checks when applicable).
- Diagnostic endpoints that perform side effects (send mail, upload/delete
  objects) are unauthenticated by design in the demo but **must** be gated to
  non-production (e.g. `NonProductionGuard`) if left without auth.
- Read-only status endpoints that return a boolean may stay ungated.

## Communication and contracts

- Web ↔ API communicate over HTTP JSON under the `/api` prefix.
- Success payloads use shared DTO shapes from `@root/shared`.
- Failures use a stable envelope with language-neutral `error.code` values
  from `@root/shared/api-error`. The web maps codes to `messages/*` via
  `ApiErrors`; never show raw server exception text.
- Modules communicate through exported Nest providers or shared contracts —
  never by importing another module’s schema or tables.

## Invariants

1. Request handlers do not run long-lived background work; async side effects
   go through the queue (or an equivalent non-blocking mechanism).
2. Domain layer code in hexagonal modules stays free of Nest, Drizzle, and
   HTTP/validation framework imports.
   Application layer code also stays free of Nest, transport DTOs, and direct
   dependencies on technical modules; side effects are reached through
   domain-owned ports implemented by infrastructure adapters.
3. No cross-module deep imports into another module’s
   `domain` / `application` / `infrastructure` / `presentation`.
4. FSD: lower layers never import higher layers; slices are consumed only
   through their public `index.ts`.
5. Server logs full errors; clients receive only safe codes/messages — never
   raw SDK or database error strings.
6. Environment secrets and local overrides live in ignored `*.local.env`;
   only `*.example.env` is committed.
7. Email is best-effort (queue + degrade); a mail failure must not roll back
   a successful primary write. Storage failures for primary uploads may fail
   the operation.
8. Business schema ownership stays in the module that owns the entity; the
   shared `database` module only provides the connection.
9. Locale-independent providers that inject document-level scripts (e.g.
   theme) live in a layout that does not remount on `[locale]` changes.
10. Optional integrations (email, storage) must not prevent the app from
    booting when unconfigured; behavior is either noop (email) or explicit
    “not configured” errors (storage) as documented per module.
11. Every HTTP route is rate-limited by the global `ThrottlerGuard` (defaults
    and env knobs in `THROTTLE_*`). Exceeding the limit returns `429` with
    `common.tooManyRequests`.
