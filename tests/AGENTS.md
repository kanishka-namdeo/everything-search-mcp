# tests/ — the automated vitest suite (validation layer only)

DOX local contract for `tests/`. Parent: [`AGENTS.md`](../AGENTS.md). Closer doc wins on local detail; nothing here may weaken DOX.

## Purpose
- Home of the only suite `npm test` actually runs: `security.test.ts` + `integration.test.ts`, 2 files / 44 tests, ~1s.
- Locks the behavior of the `src/utils/validation.ts` security boundary against regressions in sanitization and rejection rules.
- Also holds `real-world-test.js`, a manual spawn-and-probe harness that is tracked but not executed by any script.

## Ownership
- This subtree owns the automated suite: which files run, what they assert, and the mock/dependency policy below.
- Not owned here: the code under test (`src/`, contract at [`src/AGENTS.md`](../src/AGENTS.md)), the `vitest` devDependency and script wiring (`package.json:28-30`), `tsconfig.json`, and the repo-root manual QA document `MANUAL_TESTING_GUIDE.md` (586 lines, tracked, root-owned; it is a human step-by-step procedure for driving the server from an MCP client — do not duplicate its content here).

## Local Contracts
- No `vitest.config.*` exists anywhere in the repo (verified). Vitest's default include pattern governs: files matching `*.test.*` / `*.spec.*`. Consequence (binding): a new `tests/<name>.test.ts` is picked up automatically, while `tests/<name>-test.js` is NOT — `tests/real-world-test.js` is invisible to `npm test`, CI, and `test:coverage` precisely because of that naming (`real-world-test.js:1` is plain ESM, no vitest imports).
- `tests/security.test.ts` (132 lines, 22 tests) imports ONLY `../src/utils/validation.js` (`:2-9`): `sanitizeShellArg`, `validateSearchQuery`, `validatePath`, `validateSearchOptions`, `ValidationError`, `SecurityConfig`. It pins the CURRENT strip-don't-reject behavior, e.g. `:14` asserts `sanitizeShellArg('test; rm -rf /') === 'test rm -rf /'`, `:15` `'test && evil'` → `'test  evil'`, `:26-28` `..`/`~/` prefixes removed, `:32` backslashes normalized to `/`.
- `tests/integration.test.ts` (350 lines, 22 tests) imports ONLY `../src/utils/validation.js` (`:2-9`). Despite the name it covers no MCP surface: no `ListTools`/`CallTool` shapes, no tool schemas, no platform dispatch, no error envelopes. Its five blocks are `Real-World Attack Scenarios` (`:12-99`), `Valid Input Acceptance` (`:101-181`), `Sanitization Quality` (`:183-251`), `Error Handling Quality` (`:253-311`, asserts `error.code` values such as `EMPTY_QUERY`, `PATH_TRAVERSAL`, `INVALID_MAX_RESULTS`), `Performance Characteristics` (`:313-349`, 1000-iteration `< 100ms` wall-clock assertions — flaky on loaded CI runners). Defect: the filename overpromises; nothing here imports `src/index.ts`, `src/search/unified.ts`, or `src/platform/*.ts`.
- Mock strategy: there are no mocks, stubs, fixtures, or setup files. Neither test file uses `vi.mock`; they simply never reach a subprocess, so no `es.exe`/`mdfind`/`rg`/`locate` binary is required to run the suite. The three `src/platform/*.ts` adapters and `src/search/unified.ts` are NOT executed by the suite at all — confirmed: no test in the repo imports them.
- `tests/real-world-test.js` (351 lines): manual harness. Spawns `node dist/index.js` over stdio (`:17`), hand-rolls JSON-RPC `tools/call` for `search_files` (`:96-102`), and probes injection/edge-case/large-result sets plus a direct `import('../src/utils/validation.js')` check (`:216`). Results are printed via `recordTest` (`:65-72`), never asserted, and `main()` exits 0 unconditionally (`:347`). Defect: its pass criteria are self-contradictory — `:164` treats an unblocked injection as passing, and `:261` requires `'rm'` to be stripped, which contradicts `security.test.ts:14`.
- Defect (coverage): `src/index.ts` tool schemas, the `CallToolRequestSchema` handler and its `{success:false,errorCode,...}` envelope, and every platform adapter have zero automated coverage; the suite guards only `validation.ts`.

## Work Guidance
- Add automated coverage as `tests/*.test.ts`, imported from `../src/<module>.js` with the `.js` extension (ESM, `package.json:6`); that naming is what makes the file run.
- Keep `tests/` free of real-binary dependencies — the suite must pass on a Linux CI runner (`package.json` has no OS gate for `npm test`). Where a change touches `src/platform/*.ts`, the existing coverage cannot prove it; verification falls to `MANUAL_TESTING_GUIDE.md`.
- `tests/` is excluded from `tsconfig.json` `include` (`src/**/*` only), so test files are not typechecked by `npm run build`; `vitest` transpiles them at run time. Type errors in tests surface only as runtime failures.
- No lint or formatter configuration exists in the repo; match the style of the adjacent test file. `npm test` has no coverage threshold configured, and `test:coverage` (`package.json:30`) requires the uninstalled `@vitest/coverage-v8` package.
- `test-simulation.js` at the repo root (173 lines) is the sibling manual smoke harness — it imports `./dist/search/unified.js` (`:3-4`) and therefore needs `npm run build` first. It is root-owned and likewise not run by `npm test`.

## Verification
- `npm test` = `vitest run` (`package.json:28`) — the authoritative check for this folder. Current state in this session: `Test Files 2 passed (2)`, `Tests 44 passed (44)`, ~984ms.
- `npm run test:watch` / `npm run test:coverage` (`package.json:29-30`) are the other declared test scripts.
- `npm run build` (`package.json:24`) does NOT compile or typecheck this folder; do not claim it validates tests.
- CI runs `npm test` only in the `build` job (`.github/workflows/npm-publish.yml:19`) — see [`.github/AGENTS.md`](../.github/AGENTS.md).
- Manual harnesses, run explicitly and never in CI: `node tests/real-world-test.js` (needs `dist/`) and `node test-simulation.js` (needs `dist/`).

## Child DOX Index
(none)
