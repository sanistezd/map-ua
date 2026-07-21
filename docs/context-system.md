# Context system (6 files)

This template uses a **spec-driven** workflow. Before implementing features or
making architectural decisions, read the files under `context/` **in order**.
`AGENTS.md` (and `CLAUDE.md`) point agents at the same list.

These files are the **building contract**. Code should follow them; when reality
diverges, update the relevant context file in the same change.

## The six files

| #   | File                                                      | Owns                                                                                                  |
| --- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 1   | [`project-overview.md`](../context/project-overview.md)   | Product definition: who it is for, goals, core user flow, features, in/out of scope, success criteria |
| 2   | [`architecture.md`](../context/architecture.md)           | Stack, system boundaries, storage model, auth/access, invariants the code must never violate          |
| 3   | [`ui-context.md`](../context/ui-context.md)               | Theme, color tokens, typography, radius, component conventions                                        |
| 4   | [`code-standards.md`](../context/code-standards.md)       | Implementation rules: FSD, Nest layers, forms, errors, testing, file map                              |
| 5   | [`ai-workflow-rules.md`](../context/ai-workflow-rules.md) | How to work: scoping, when to split work, missing requirements, protected files, delivery checks      |
| 6   | [`progress-tracker.md`](../context/progress-tracker.md)   | Live status: phase, goal, completed, in progress, next up, open questions, ADRs, session notes        |

```
project-overview  →  what & why
architecture      →  how the system is shaped
ui-context        →  how it looks
code-standards    →  how we write code
ai-workflow-rules →  how we ship increments
progress-tracker  →  where we are now
```

## Who updates what

- **After each meaningful implementation**: update `progress-tracker.md`
  (Completed / In Progress / Next Up / Session Notes as needed).
- **When architecture, scope, or conventions change**: update the matching
  context file **before** continuing (do not leave docs lying).
- **Open product/tech questions**: add them under Open Questions in
  `progress-tracker.md` instead of inventing behavior.

## Relationship to `docs/`

| `context/`                                 | `docs/`                                             |
| ------------------------------------------ | --------------------------------------------------- |
| Operational specs for building the product | Explanations of the template and how to navigate it |
| Expected to stay current with the codebase | Stable onboarding + pointers from the root README   |
| Written for agents + implementers mid-task | Written for humans opening the repo cold            |

Use **`docs/`** (named `.md` files) to learn the system. Use **`context/`** to
decide what to build next and how. There is a single root `README.md` — no
nested READMEs under `docs/` or `assets/`.

## Filling placeholders on fork

Several context files ship with `[placeholder]` sections so a new product can
replace starter copy. On fork:

1. Fill `project-overview.md` with your product.
2. Align `architecture.md` / `ui-context.md` with your stack and brand
   (or keep the starter stack and only fill product-specific invariants).
3. Keep `code-standards.md` unless you intentionally change conventions —
   it already describes this repo’s FSD + Nest rules.
4. Reset or rewrite `progress-tracker.md` for your first milestone.
5. Adjust `ai-workflow-rules.md` protected files / scoping if needed.
