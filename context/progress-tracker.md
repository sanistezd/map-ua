# Progress Tracker

Update this file after every meaningful implementation
change.

## Current Phase

- Core MVP Refactoring

## Current Goal

- Fixing PR comments and cleaning up FSD architecture. Adding account deletion and Google OAuth.

## Completed

- Setup CI dummy env vars
- Fix initial Supabase environment expectations
- Fix FSD architecture for auth components (moved to `features/auth`)
- Implement `delete-account` feature in frontend and backend
- Add Google SVG icons to auth forms
- Remove ESLint suppression comments (no-restricted-imports)
- Fix auth routing with `next-intl` (using `@/i18n/navigation` instead of `next/navigation`)
- Fix Node.js 20 compatibility issue with `@supabase/supabase-js` by using direct `fetch` in backend for account deletion
- Fix `SUPABASE_SERVICE_ROLE_KEY` environment requirement crashing API on boot

## In Progress

- Next tasks as determined by user

## Next Up

- TBD

## Open Questions

- None at the moment

## Architecture Decisions

- FSD dictates that forms should live in `features/` layer, not in `app/`. Refactored accordingly.
- Account deletion implemented in NestJS backend using Supabase Admin client for proper server-side data purging.

## Session Notes

- Completed the PR review fixes as requested by Nikita.
