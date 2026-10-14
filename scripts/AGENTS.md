# scripts/ — postinstall binary provisioner and manual smoke harness

DOX local contract for `scripts/`. Parent: [`AGENTS.md`](../AGENTS.md). Closer doc wins on local detail; nothing here may weaken DOX.

## Purpose
- Holds two plain-Node ESM scripts: `download-es.js` (211 lines), the npm `postinstall` provisioner that fetches voidtools `es.exe` into `bin/`, and `test.js` (41 lines), a manual end-to-end smoke harness.
- Publishes only `scripts/download-es.js` into the npm tarball (`package.json:16-22`), so consumers can re-run the binary download manually.

## Ownership
- This subtree owns: the GitHub-release download/extract pipeline and its success/skip/failure behavior (`download-es.js`), and the manual smoke sequence against built output (`test.js`).
- Not owned here: the binary artifact and its provenance (`bin/AGENTS.md`), the runtime resolution path contract (`src/platform/windows-cli.ts:10-11`), the wiring of `postinstall` and other npm scripts (`package.json`, root-owned).

## Local Contracts
- Postinstall wiring: `package.json:31` runs `node scripts/download-es.js` on every install, on all declared platforms (`package.json:72-76`); the script has no `process.platform` guard anywhere.
- Idempotence rule (binding): the script exits before any network call when `bin/es.exe` already exists (`download-es.js:167-170`). Because `bin` is shipped in the tarball (`package.json:18`) and `bin/es.exe` is committed to git, ordinary `npm install` / `npm ci` runs — and a fresh checkout — take this skip path and make no network request; the download runs only after the binary was deleted or `bin/` was unpacked without it, or when someone forces it.
- Download pipeline (actual behavior): latest-release query against `https://api.github.com/repos/voidtools/ES/releases/latest` (`:13`, fetched at `:95-126` with a User-Agent header `:98-102`); architecture detection x64/x86/ARM64 with x64 default (`:17-32`); asset chosen by `name.toLowerCase().endsWith('<arch>.zip')` (`:128-134`) — verified live against release 1.1.0.38 whose assets are `ES-1.1.0.38.{x64,x86,ARM64,ARM}.zip`, so the match works for today's naming; download with 3 retries / 2 s delay (`:14-15`, `:41-93`); `es.exe` extracted into `bin/` via `adm-zip ^0.6.1` (`package.json:60`; the only consumer of that dependency is this file); downloaded zip deleted after extraction (`:198`).
- adm-zip `0.5.16` → `0.6.1` compatibility (recorded behavior): the call sites — `new AdmZip(zipPath)` (`:139`), `zip.getEntries()` (`:140`), the `entry.entryName` match (`:142-144`), `zip.extractEntryTo(esEntry, binDir, false, true)` (`:150`) — are unchanged, because 0.6.1 only added two extra OPTIONAL trailing parameters to `extractEntryTo`.
- Behavior, not a fix: the committed `bin/es.exe` reports `1.1.0.36` while the current upstream release asset is `1.1.0.38`, and the skip guard means an install never refreshes the committed binary.
- Failure contract (actual, not ideal): any error prints a manual-download hint and calls `process.exit(1)` (`:203-208`). Defect: the exit is unconditional, so on macOS/Linux a download failure (offline host, GitHub API rate limit) hard-fails `npm install` even though those platforms never use `es.exe`.
- Defect: redirect handling (`:47-57`) — the recursive call at `:52` passes `currentRetry` into the `retries` parameter, so a first-attempt redirect recursion gets `0 < 0` at `:82` and loses all retry budget; when the `location` header is absent the branch does fall through to the non-200 reject at `:59-64` (that path is safe).
- Defect: `rmSync(outputPath)` is called immediately after the async `file.close()` (`:48-49`, `:74-75`, `:79-80`); on Windows the unlink can race the still-open handle and throw EPERM, escaping the promise as an uncaught error.
- `test.js` imports from `../dist/search/unified.js` (`:3`): it requires `npm run build` first and is wired to no npm script; if the unified status reports the engine unavailable it exits 0 after printing, not failing (`test.js:14-17`).

## Work Guidance
- Both files are ESM top-level-await-style scripts under `"type": "module"` (`package.json:6`); keep `.js`-suffixed relative imports (`test.js:3`) and node-builtin imports as in `download-es.js:1-6`.
- Any change to the pipeline must preserve: skip-when-present idempotence (`:167-170`), extraction target `bin/` only, and cleanup of the intermediate zip (`:198`).
- Documented manual recovery paths the script must keep working with: run it directly (`README.md:373-375`, `node node_modules/everything-search-mcp/scripts/download-es.js`) and the manual-download fallback the script itself prints (`:205-206`, `README.md:385-391`).

## Verification
- No automated test covers this folder — `npm test` (vitest 5.0.4) runs `tests/security.test.ts` (22), `tests/integration.test.ts` (22), `tests/tool-args.test.ts` (37) and `tests/file-info.test.ts` (8) — 4 files / 89 tests, all passing — and none of the four imports anything from `scripts/`.
- Existing manual checks, all run by hand: `node scripts/download-es.js` (safe when the binary is present — it skips), `node scripts/test.js` after `npm run build`, and `bin/es.exe -version`.
- `adm-zip ^0.6.1` compatibility was proven by a non-destructive replay of `extractES` in a temp directory OUTSIDE the repo, not by an install run: latest voidtools/ES tag `1.1.0.38`, asset `ES-1.1.0.38.x64.zip` (117393 bytes, single entry `es.exe`), the three adm-zip calls (`:139`, `:140`, `:150`) executed exactly as the script does, `extractEntryTo` returned true, the extracted file was 262312 bytes and running it printed `1.1.0.38`. The repo's committed `bin/es.exe` was untouched (`git status` clean for `bin/`). Ordinary `npm install` / `npm ci` runs cannot show this: they take the skip guard at `:167-170` because `bin/es.exe` is committed.
- `MANUAL_TESTING_GUIDE.md` is the documented manual procedure: its Setup (`:15-20`) covers `npm install` + `npm run build`, and its scenarios (`:39-459`) test search/status through an MCP client against `dist/index.js` — indirectly proving `bin/es.exe` and the dispatch `test.js` exercises exist. It does NOT verify: the download pipeline itself (never runs `download-es.js`), retry/redirect behavior, asset-name matching, or failure-path exit semantics.

## Child DOX Index
(none)
