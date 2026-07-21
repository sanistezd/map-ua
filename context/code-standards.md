# Code Standards

Rules for this Nest modular monolith + Next.js (FSD) Turborepo.
ESLint enforces the hard boundaries; this file explains the rest.

## General

- Keep modules and slices small and single-purpose.
- Fix root causes; do not layer workarounds on top of broken design.
- Do not mix unrelated concerns in one component, controller, or PR.
- Prefer small, verifiable increments over large speculative changes.
- Environment files live under root `env/`: commit only `*.example.env`,
  never commit `*.local.env`.
- After meaningful work, update `context/progress-tracker.md`. If behavior
  or architecture changed, update the relevant context file too.

## TypeScript

- Strict mode is required in every package and app.
- Avoid `any`. Prefer explicit types, generics, or narrowly scoped unknowns.
- Validate unknown input at system boundaries (HTTP body/query, env, external
  APIs) before trusting it.
- Prefer `import type` for type-only imports.
- Do not silence errors with non-null assertions or `@ts-ignore` unless there
  is a short, justified comment and no cleaner option.

## Monorepo and `packages/shared`

- Cross-app contracts (DTOs, error codes, shared types) live in
  `@root/shared`, grouped by entity (`user`, `email`, `api-error`, …).
- Apps import from package public entry points
  (e.g. `@root/shared/user`), not deep source paths.
- Shared code must stay framework-agnostic: no Nest, Next, React, or Drizzle
  imports inside `packages/shared`.
- API error codes and response envelopes are defined once in shared and used
  by both Nest filters and the web client.

## Nest modular monolith (`apps/api`)

### Module kinds

- **Domain modules** (e.g. `users`): hexagonal layout —
  `domain` → `application` → `infrastructure` → `presentation`.
- **Technical modules** (e.g. `email`, `storage`, `auth`, `health`): flat
  modules. No fake hexagonal layers for pure integrations.

### Layer rules (domain modules)

- `domain/`: pure business types, repository ports, domain errors. No Nest,
  Drizzle, or class-validator imports.
- `application/`: use cases / services. Depends on domain ports and models
  only — not on Nest, shared transport DTOs, technical modules,
  infrastructure, or presentation.
- `infrastructure/`: adapters (Drizzle repos, external SDKs). Implements
  domain ports, including adapters that delegate to technical modules.
- `presentation/`: controllers, request DTOs, pipes. Maps HTTP ↔ application.

### Module boundaries

- Do not deep-import another module’s `domain` / `application` /
  `infrastructure` / `presentation`. Use the Nest module’s public API
  (`exports` + injected services) or an explicit shared contract.
- Modules must not reach into another module’s database tables or schema
  files. Own your schema under
  `infrastructure/persistence/*.schema.ts`.
- Register technical modules in `AppModule` when they are app-wide; import
  them into feature modules that need their services.

### HTTP, auth, and side effects

- Validate and transform request input before business logic
  (`ValidationPipe` / class-validator DTOs).
- Enforce auth (and ownership, when applicable) before mutations on protected
  routes. Use `AuthGuard` + `AuthVerifier`; fail closed when no verifier is
  configured.
- Controllers stay thin: parse → call application service → return DTO.
- Do not run long-lived work inside the request. Enqueue via BullMQ (see
  email welcome flow) for async side effects.
- Diagnostic / test-trigger endpoints that perform side effects must be gated
  (e.g. `NonProductionGuard`) if they are unauthenticated.

### Errors

- Log the real error on the server; return only a safe, stable code to the
  client. Never leak raw exception / SDK messages.
- Known, expected failures get a domain `Error` subclass
  (e.g. `UserEmailTakenError`) with a safe message we wrote.
- Presentation maps known domain errors to structured
  `{ code: ApiErrorCode }` HTTP exceptions; application services do not throw
  Nest HTTP exceptions.
  Unknown failures go through `ApiExceptionFilter` → generic
  `common.internal` (or equivalent).
- Client maps `error.code` via i18n (`ApiErrors.*`), with a safe fallback.

## Feature-Sliced Design (`apps/web`)

### Layers (dependency direction)

```
app → widgets → features → entities → shared
```

- Lower layers must not import higher layers (enforced by ESLint).
- `app`: Next App Router, providers, locale layouts — composition only.
- `widgets`: page blocks composed of features/entities (e.g. users dashboard).
- `features`: user actions (create user, toggle theme, test email).
- `entities`: business entities + their API clients and display pieces.
- `shared`: UI kit, API client, lib/utils/validations — no business features.

### Slices and public API

- Every slice exposes a public `index.ts`. Import `@/features/user/create-user`,
  never `@/features/user/create-user/ui/...`.
- Related slices may sit under an organizational **group** folder
  (`features/user/*`, `features/test/*`). Groups are not layers.
- Flat slices are fine when no group applies (`toggle-theme`, `switch-locale`).
- Within a slice, use segments as needed: `ui/`, `model/`, `api/`, `lib/`.

### Next.js

- Default to Server Components. Add `'use client'` only when browser APIs,
  hooks, or interactivity require it.
- Keep route files thin; push UI and logic into widgets/features.
- Locale-independent providers (e.g. theme) belong in the root `app/layout.tsx`
  so they are not remounted on locale changes.

### Forms

- Use React Hook Form + Zod (`zodResolver`) and shadcn `<Field />` /
  `<FieldLabel />` / `<FieldError />` (Controller pattern).
- Reusable field validators: `shared/lib/validations` (e.g. `emailField`).
- Feature form schemas: slice `model/schema.ts` — compose shared validators;
  accept translated messages from the UI.
- Prefer `noValidate` on `<form>` so Zod owns client validation copy; still
  set sensible `type` / `autoComplete`.
- Do not parse `FormData` by hand for interactive forms.

### UI and styling

- Reusable primitives live in `shared/ui` and are imported via `@/shared/ui`.
- Prefer design tokens / CSS variables from `ui-context.md` and `globals.css`.
  No one-off hardcoded hex in components when a token exists.
- Follow existing motion, radius, and typography conventions; do not invent a
  parallel visual language inside a feature.

## Data and storage

- Relational metadata, ownership, and relationships → PostgreSQL (Drizzle).
- Large files / blobs → S3-compatible storage (`StorageService`), not the DB.
- Email is best-effort: queue + degrade; do not fail the primary write because
  mail failed.
- Storage failures for primary uploads may throw — treat as part of the
  operation outcome.

## Testing

- Prefer unit tests next to the code (`*.spec.ts` / `*.spec.tsx`) for domain
  logic, services, guards, and error sanitization.
- API integration tests for HTTP + wiring; web e2e (Playwright) for critical
  user flows.
- Mock at boundaries (ports, HTTP, SDKs); do not mock the unit under test into
  meaninglessness.
- When fixing a bug, add a regression test when practical.

## Git and quality gates

- Pre-commit runs lint-staged (scoped per app). Do not bypass hooks unless
  explicitly required.
- `pnpm lint`, `pnpm typecheck`, and relevant tests should pass before merge.
- Keep PRs focused; one concern per change when possible.

## File organization (quick map)

| Path                             | Responsibility                         |
| -------------------------------- | -------------------------------------- |
| `apps/api/src/modules/<domain>/` | Hexagonal business module              |
| `apps/api/src/modules/<tech>/`   | Flat integration module                |
| `apps/api/src/database/`         | Shared DB connection only              |
| `apps/api/src/queue/`            | Shared BullMQ / Redis connection       |
| `apps/web/src/app/`              | Next routes and providers              |
| `apps/web/src/widgets/`          | Composed page sections                 |
| `apps/web/src/features/`         | User actions (optionally grouped)      |
| `apps/web/src/entities/`         | Entity API + display                   |
| `apps/web/src/shared/`           | UI kit, API client, validations        |
| `packages/shared/`               | Cross-app contracts and error codes    |
| `env/`                           | Env templates + local (ignored) values |
| `context/`                       | AI/product building specs (6 files)    |
| `docs/`                          | Human documentation for the template   |
| `assets/`                        | Images and other binary attachments    |
