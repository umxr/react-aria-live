# @umxr/react-aria-live — Development Guide

React library of hooks and components for ARIA live regions — announcing dynamic
content changes to screen readers. Published to npm as `@umxr/react-aria-live`.
ESM-only, no runtime dependencies, React 18/19 as a peer dependency.

> Public API reference (props, options, test utilities) lives in `README.md` —
> don't duplicate it here. This file covers conventions and workflow.

## Commands

```bash
npm run dev          # Vitest watch mode (TDD)
npm test             # Vitest, single run
npm run build        # tsc → dist/  (type-checks, emits .js + .d.ts)
npm run check-format # Prettier check (no ESLint in this package)
npm run format       # Prettier write
npm run ci           # build + check-format + test — exactly what CI runs
```

CI (`.github/workflows/ci.yml`) runs `npm run ci` on every PR and push to `main`.
Run `npm run ci` locally before pushing.

## Critical Conventions

- **Import with `.js` extensions, always.** Source is `.ts`/`.tsx`, but imports
  must reference the compiled path: `import { LiveRegion } from './LiveRegion.js'`.
  Required by `verbatimModuleSyntax` + `module: NodeNext`. Omitting `.js` breaks
  the build.
- **`import type` for type-only imports** (also enforced by `verbatimModuleSyntax`).
- **Named exports only** — no default exports anywhere.
- **All shared types live in `src/types.ts`.** Don't inline public prop/option
  types in component or hook files.
- **Functional components with hooks** — no class components.

## Adding to the Public API

1. Define types in `src/types.ts`.
2. Re-export from `src/index.ts` — the value, plus its types in the `export type {}` block.
3. Test utilities are a _separate_ entry point: export them from `src/test/index.ts`
   (consumed as `@umxr/react-aria-live/test`).
4. Update the API tables in `README.md`.
5. Add a changeset: `npx changeset` (patch/minor/major). Releases are
   Changesets-driven — never edit `version` in `package.json` by hand.

## Architecture

- `src/context/LiveRegionContext.tsx` — `LiveRegionProvider` + `announce()`. Owns
  the queue, dedup, and the `delay`/`clearAfter` timers (per-priority).
- `src/utils/announcer.ts` — module-level singleton that mounts two
  visually-hidden `aria-live` divs (polite + assertive) on `document.body`,
  ref-counted across providers. Announcing clears `textContent`, then sets it in a
  `requestAnimationFrame` so screen readers detect the change.
- `src/utils/queue.ts` — announcement/ID creation and 150ms dedup
  (`DEFAULT_DEBOUNCE_MS` in `constants.ts`).
- `src/components/` — `LiveRegion` is the base; `Alert`/`Status`/`Log` are thin
  presets over it; `Announce` (one-off) and `Announcer` (in-modal region) use the
  context.
- `src/hooks/` — `useAnnounce`, `useAnnouncementQueue`, `useLiveRegion`.
- `src/test/index.ts` — mock announcer recording (`getAnnouncements`, etc.),
  exposed via the `./test` entry point.

Design specs and plans live under `docs/superpowers/`.

## Testing

- Vitest + jsdom + `@testing-library/react`. `globals: true` — `describe`/`it`/
  `expect` are available without imports.
- Tests are colocated: `Foo.tsx` → `Foo.test.tsx`.
- This is an a11y library: when changing announcement behaviour, assert on what
  reaches the live region (or the mock), and account for the `requestAnimationFrame`
  hop and the 150ms dedup window.

## Style

Prettier: single quotes, semicolons, trailing commas (`all`), 2-space indent,
80-col width. TS `strict` plus `noUncheckedIndexedAccess` and `noImplicitOverride`.
