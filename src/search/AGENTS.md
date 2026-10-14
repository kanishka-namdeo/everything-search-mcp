# src/search/ — Unified platform dispatch layer

DOX local contract for `src/search/`. Parent: [`AGENTS.md`](../AGENTS.md). Closer doc wins on local detail; nothing here may weaken DOX.

## Purpose
- Single routing point between the MCP server (`src/index.ts`) and the per-OS modules in `src/platform/`.
- Contains exactly one file, `unified.ts`, which selects the Windows/macOS/Linux implementation per call.

## Ownership
- This subtree owns the dispatch decision and the unsupported-platform behavior (`unified.ts:13-52`).
- Not owned here: tool schemas and response/error shape (`src/index.ts`), command construction, output parsing, and input validation (`src/platform/*.ts` via `src/utils/validation.ts`), data shapes (`src/types/index.ts`).

## Local Contracts
- Exported functions (binding signatures):
  - `searchFilesUnified(options: SearchOptions): Promise<SearchResult[]>` — `unified.ts:13`.
  - `getFileInfoUnified(path: string): Promise<FileInfo>` — `unified.ts:25`.
  - `getStatusUnified(): Promise<PlatformStatus>` — `unified.ts:37`.
  - `getPlatformInfo(): {platform: string; searchEngine: string; isPrimary: boolean}` — `unified.ts:54`. Defect: exported but imported nowhere in `src/` or `tests/` (dead code).
- Dispatch order is win32 → darwin → linux via `isWindows/isDarwin/isLinux` from `src/utils/platform.js` (`unified.ts:1`, `unified.ts:14-19`). Because `getPlatform()` defaults anything non-darwin/win32 to `'linux'` (`src/utils/platform.ts:3-8`), the `else` branches are reachable only in odd builds.
- Asymmetric unsupported-platform behavior (binding, actual, not ideal): `searchFilesUnified` and `getFileInfoUnified` throw `Unsupported platform: ${process.platform}` (`unified.ts:21`, `unified.ts:33`), while `getStatusUnified` returns a graceful `{searchEngine: 'none', available: false}` status instead of throwing (`unified.ts:45-50`).
- No validation or sanitization happens in this folder; the platform modules enforce `src/utils/validation.ts` themselves (`windows-cli.ts:64,151`, `darwin.ts:10,84`, `linux.ts:10,96`). Do not add sanitization here — keep it a thin pass-through.
- Only consumer: `src/index.ts:11` imports the three `*Unified` functions.

## Work Guidance
- Adding a platform means adding a `src/platform/<os>.ts` that exports the triad (`searchFiles`/`getFileInfo`/`getStatus`, per `src/AGENTS.md`) plus a branch here; imports of the triad are aliased per OS at `unified.ts:2-10` — follow that pattern.
- Keep branches expression-shaped like the existing ones (delegate and return); no parsing, retries, or option mutation belongs here.
- Relative imports require the `.js` extension (ESM; `unified.ts:1-11`).

## Verification
- `npm test` = `vitest run`; currently 44/44 (`tests/security.test.ts` 22, `tests/integration.test.ts` 22). Neither test file imports `unified.ts` — dispatch here has no automated coverage.
- `npm run build` = `tsc` (`strict: true`, `tsconfig.json:8`) is the existing check that the triad signatures stay aligned.
- On this Windows machine only the `isWindows()` branch can be exercised at runtime; the darwin/linux branches are unverified.

## Child DOX Index
(none)
