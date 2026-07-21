# Progress Tracker

Update this file after every meaningful implementation
change.

## Current Phase

- Template documentation

## Current Goal

- Prepare the public proof-of-concept template for reuse

## Completed

- Global rate limiting PoC: `ThrottlerGuard` on all routes, env-tunable via `THROTTLE_TTL_MS` / `THROTTLE_LIMIT` (default 100/60s), `429` → `common.tooManyRequests` with i18n.
- Clarified required vs optional vars in `env/api.example.env` and `env/web.example.env` (only `DATABASE_URL` is required for the API).
- Added the supplied multi-resolution favicon as `apps/web/src/app/favicon.ico` for browser-tab display only; discarded the unused PWA, manifest, and Apple-touch variants and removed the source `favicon (2)` folder.
- Made the users module strictly hexagonal: `UsersService` is framework-free and depends only on domain ports/models, `WelcomeEmailPort` isolates the BullMQ side effect behind an infrastructure adapter, and `UsersController` owns DTO conversion plus domain-error-to-HTTP mapping. ESLint now enforces the application boundary; architecture docs and tests were updated.
- Added unit tests to CI, corrected `EMAIL_SECURE=false` parsing with regression coverage, documented the intentionally public demo endpoints, and added an after-fork checklist to the root README.
- Split health into `HealthController` + module; added web `entities/health` with `healthApi.get()` → `GET /api/health` (mirrors users entity API pattern). Health card title shows the route.
- Consolidated documentation so only the root `README.md` exists; removed `docs/README.md` and `assets/README.md`. Root README indexes `docs/*.md` and shows `docs/assets/demo.png`, with links to project overview and architecture.
- Restored `docs/architecture.md` as a named guide (not a README).

## In Progress

- None

## Next Up

- Fill product-specific placeholders in `context/project-overview.md` and `ui-context.md` when forking

## Open Questions

- None

## Architecture Decisions

- Only one README in the repo (root). Deeper material uses named files under `docs/` and `context/`. Demo screenshots live under `docs/assets/` (e.g. `demo.png`).

## Session Notes

- None
