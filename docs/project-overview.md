# Project overview

## What this is

A **pnpm + Turborepo** starter for a full-stack TypeScript product:

- **`apps/api`** — NestJS modular monolith (Drizzle + PostgreSQL, Redis/BullMQ,
  optional email & S3-compatible storage, pluggable auth)
- **`apps/web`** — Next.js App Router organized with **Feature-Sliced Design**
  (shadcn/ui, next-intl, next-themes, React Hook Form + Zod)
- **`packages/shared`** — framework-agnostic contracts, DTOs, and API error codes
- **`packages/eslint-config`** / **`packages/typescript-config`** — shared tooling

It is meant to be forked and grown into a real app, not demoted to a “hello
world” sample. The home page demonstrates live integrations (users CRUD, health,
email, storage) so the wiring is visible.

## Repository layout

```
.
├── apps/
│   ├── api/                 # Nest modular monolith
│   └── web/                 # Next.js + FSD
├── packages/
│   ├── shared/              # Cross-app contracts
│   ├── eslint-config/
│   └── typescript-config/
├── env/                     # *.example.env (committed) + *.local.env (ignored)
├── context/                 # 6 building-spec files (see context-system.md)
├── docs/                    # Named guides (project-overview, context-system, architecture)
├── assets/                  # Screenshots, logos, diagrams (non-runtime)
├── docker-compose.yml
└── README.md                # Single README: install, run, docs index
```

## How documentation is split

| Location                | Audience                         | Purpose                                                       |
| ----------------------- | -------------------------------- | ------------------------------------------------------------- |
| `README.md` (root only) | Developers                       | Clone → run → operate + index of deeper docs                  |
| `docs/*.md`             | Developers & agents              | Named guides (no nested READMEs)                              |
| `context/`              | Agents (and humans guiding them) | Product + architecture + UI + standards + workflow + progress |
| `assets/`               | Anyone                           | Screenshots, logos, reference images                          |

When product scope or architecture changes, update **`context/`** first (source
of truth for building), then keep **`docs/`** and the root **`README.md`** aligned if the
change affects how people understand or run the project.

## Quick links

- [Context system (6 files)](./context-system.md)
- [Architecture](./architecture.md)
- [Code standards](../context/code-standards.md)
- [Root README](../README.md) — setup and runbook
