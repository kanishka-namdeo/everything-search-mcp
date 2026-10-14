# everything-search-mcp — DOX rail

DOX is the `AGENTS.md` hierarchy for this repo, per https://github.com/agent0ai/dox. Every
`AGENTS.md` here is a binding work contract for its subtree. Agents must follow DOX instructions
across any edit.

## Project

- npm package `everything-search-mcp` (`package.json:3`, currently `1.1.0`): an MCP server exposing
  filesystem search over stdio, so an LLM can locate files by name across an entire drive.
- Three tools only, defined in `src/index.ts:26-105`: `search_files`, `get_file_info`,
  `check_status`. `README.md:178-282` is the tool reference of record.
- Search engine is chosen by OS at runtime (`src/search/unified.ts:13-52`): Windows shells out to
  the vendored `bin/es.exe` (voidtools Everything CLI), macOS uses `mdfind` (Spotlight), Linux uses
  `ripgrep` and falls back to `locate`. Nothing here talks to the Everything SDK. This engine serves
  `search_files` and `check_status` only; `get_file_info` does NOT use it — it reads live metadata via
  the shared, shell-free `src/platform/file-info.ts` Node `fs` helper on every platform.
- ESM-only (`package.json:6`), Node `>=20.0.0` (`package.json:69-71`, `"node": ">=20.0.0"` at `:70`),
  TypeScript `strict` with `src/` → `dist/` (`tsconfig.json:2-15`). The compiler is TypeScript 7 —
  the native Go port, so `tsc` CLI usage is unchanged and platform binaries arrive as
  optionalDependencies. `dist/index.js` is both `main` and the `bin` shim target.
- `bin/es.exe` is a committed third-party Windows binary, so a fresh checkout's `postinstall` hook
  (`package.json:31`) takes the skip guard in `scripts/download-es.js:167-170`; the network fetch
  only runs when `bin/es.exe` is missing.

## Read Before Editing

1. Read this file.
2. List every file or folder you expect to touch.
3. Walk from the repo root to each target and read every `AGENTS.md` on the route.
4. If a doc's Child DOX Index lists a child whose scope contains the path, read that child next.
5. Treat the nearest doc as the local contract and parents as repo-wide rules. On conflict the
   closer doc controls local detail, but no child may weaken DOX.
6. Re-read the chain in the current session before editing; do not rely on memory.

## Update After Editing

Every meaningful change needs a DOX pass before the task is done. Update the nearest owning doc
when a change touches purpose, scope, ownership, durable structure, contracts, workflows, required
inputs or outputs, artifacts, quality rules, user preferences about behavior or process, or any
`AGENTS.md` create/delete/move/rename. Update parents when their child index or a parent-level rule
changes. Update children when a parent change alters local rules. Delete stale or contradictory text
immediately instead of annotating it. Small edits that change no contract may leave docs alone, but
the pass still happens.

Closeout: re-check changed paths against the chain, refresh every affected Child DOX Index, run the
verification that covers what you touched, and report which docs you deliberately left unchanged.

## Child Doc Shape

Create a child doc when a folder becomes a durable boundary with its own purpose, rules,
responsibilities, workflow, materials, or quality standards. Default section order: Purpose,
Ownership, Local Contracts, Work Guidance, Verification, Child DOX Index.

`Work Guidance` reflects standards that actually exist; with none, leave it empty. `Verification`
reflects a check that actually runs; with none, leave it empty and fill it when one exists. Never
invent guidance or a check to fill a section.

## Style

Concise, current, operational. Document stable contracts, not diary entries. Broad rules in parents,
concrete detail in children. Prefer direct bullets with explicit names and `file.ts:LINE` evidence.
Do not duplicate a rule across files unless each scope needs its own local version. Delete stale
notes rather than explaining history. Trim obvious statements and dead warnings.

## Global Contracts

- **Record behavior, do not silently fix it.** Where current code contradicts a doc or a comment,
  state what the code does and flag the mismatch in one line. Repair is a separate, scoped change.
- `package.json:16-22` ships `dist`, `bin`, `scripts/download-es.js`, `LICENSE`, `README.md`.
  `README.md` is the only root-level documentation in the tarball, so any user-visible claim must land
  there; other root docs are repo-only. An `AGENTS.md` inside a whitelisted directory still ships —
  `npm pack --dry-run` lists `bin/AGENTS.md`, because the `files` whitelist beats `.npmignore:23` there.
- `package.json` version is the single source of truth. Known drift, not yet fixed: `src/index.ts:17`
  registers the server as `1.0.0`; `CHANGELOG.md:8-10` has no `1.1.0` entry.
- Publishing is release-driven, not push-driven: a published GitHub release triggers
  `.github/workflows/npm-publish.yml`, which tests on Node 24 then runs
  `npm publish --provenance --access public` with `secrets.NPM_TOKEN`. `prepublishOnly`
  (`package.json:27`) builds before testing. `PUBLISHING.md:225` describes a different, non-existent
  workflow; the file itself is the release-procedure doc.
- Documentation authority: installation and tool schema → `README.md`; security model →
  `SECURITY.md`; manual QA procedure → `MANUAL_TESTING_GUIDE.md`; release procedure →
  `PUBLISHING.md`; automated test evidence → `TEST_RESULTS.md`. `IMPLEMENTATION_SUMMARY.md` is
  gitignored and describes the abandoned SDK approach — do not source contracts from it.
- Tracked, never DOX-owned: `dist/`, `.trae/`, `IMPLEMENTATION_SUMMARY.md` and `useless.md` are
  untracked or gitignored. `useless.md` is a generic agent-orchestration draft, not a contract for
  this repo.
- Tool arguments are gated by zod 4 schemas in `src/tool-args.ts`, which throws the pre-existing
  `ValidationError` with code `INVALID_ARGUMENTS`. The gate covers type, presence, coercion and
  unknown-key stripping only; length, range and content limits stay in `src/utils/validation.ts`, so
  security codes keep firing from the same places.
- `npm test` is `vitest run` (vitest 5.0.4). With no `vitest.config.*`, only `tests/*.test.ts`
  execute: `tests/security.test.ts`, `tests/integration.test.ts`, `tests/tool-args.test.ts` and
  `tests/file-info.test.ts`, 89 tests total. `tests/real-world-test.js`, `test-simulation.js` and
  `scripts/test.js` are manual
  harnesses outside the suite.

## User Preferences

- `AGENTS.md` is tracked: the ignore entry that used to exclude it was removed from `.gitignore` on
  2026-10-14 by explicit decision, while keeping it out of the npm package.
- DOX depth for this repo is the deep tree — one child per durable folder boundary, including small
  tool and sample folders.
- Commits to `main` are expected for doc work; pushing to the remote requires explicit approval.

## Child DOX Index

- [`src/AGENTS.md`](src/AGENTS.md) — server entry, MCP tool surface and request dispatch; parent of
  the four source folders below.
- [`src/platform/AGENTS.md`](src/platform/AGENTS.md) — per-OS search adapters (`windows-cli.ts`,
  `darwin.ts`, `linux.ts`) and the external CLIs each one shells out to, plus the shared shell-free
  `file-info.ts` Node `fs` helper that all three delegate `get_file_info` to.
- [`src/search/AGENTS.md`](src/search/AGENTS.md) — the platform-agnostic dispatch layer that routes
  a call to exactly one adapter.
- [`src/types/AGENTS.md`](src/types/AGENTS.md) — shared `SearchResult`/`SearchOptions`/`FileInfo`/
  `PlatformStatus` contracts plus the SDK-era constants still in the file.
- [`src/utils/AGENTS.md`](src/utils/AGENTS.md) — the security boundary: `validation.ts` limits and
  sanitizers, and `platform.ts` detection.
- [`bin/AGENTS.md`](bin/AGENTS.md) — the vendored `es.exe` binary, its provenance and how it is
  resolved at runtime.
- [`scripts/AGENTS.md`](scripts/AGENTS.md) — `download-es.js` postinstall fetch/extract logic and the
  `test.js` smoke harness that requires a build first.
- [`tests/AGENTS.md`](tests/AGENTS.md) — what the automated suite actually runs versus the manual
  harnesses that sit alongside it.
- [`examples/AGENTS.md`](examples/AGENTS.md) — Claude Desktop configuration samples shipped in the
  repo.
- [`.github/AGENTS.md`](.github/AGENTS.md) — the release-triggered npm publish workflow.
