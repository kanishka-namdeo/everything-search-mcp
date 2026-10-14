# src/utils — security validation and platform detection shared by every adapter

DOX local contract for `src/utils`. Parent: [`AGENTS.md`](../../AGENTS.md). Closer doc wins on local detail; nothing here may weaken DOX.

## Purpose

- `validation.ts`: the single gate every user-supplied query/path passes through before reaching a shell — `ValidationError`, the `SecurityConfig` limits, four validators, and the sanitizer.
- `platform.ts`: maps `process.platform` to the `'windows' | 'darwin' | 'linux'` union and exposes the predicates `src/search/unified.ts` dispatches on.

## Ownership

Owns: `src/utils/validation.ts` (contracts below) and `src/utils/platform.ts`.

Stays owned elsewhere (`src/AGENTS.md` / sibling subtrees): how and where the validators are called (`src/platform/*.ts` entry points, `src/search/`), the tool-facing option schema (`src/search/`, `src/index.ts`), and the shared type shapes (`src/types/index.ts`). This folder does not decide adapter CLI behavior.

## Local Contracts

### SecurityConfig (`validation.ts:12-19`) — actual numeric values

- `MAX_QUERY_LENGTH: 1000` (`:13`), `MAX_RESULTS: 1000` (`:14`), `MAX_OFFSET: 100000` (`:15`), `MAX_PATH_LENGTH: 4096` (`:16`), `COMMAND_TIMEOUT: 30000` ms (`:17`), `MAX_BUFFER_SIZE: 50 * 1024 * 1024` (50 MiB, `:18`). Adapters enforce these at call sites (e.g. `windows-cli.ts:67`, `:109-111`).

### ValidationError (`validation.ts:1-10`)

- `Error` subclass with `name = 'ValidationError'`, a public `code: string` (machine-readable, e.g. `'QUERY_TOO_LONG'`), and a public `statusCode: number` defaulting to `400` (`:5`). Callers rethrow on `error.name === 'ValidationError'` (`darwin.ts:72-74`, `linux.ts:84-86`, `windows-cli.ts:185-187`).

### Validators

- `sanitizeShellArg` (`:21-35`): non-string throws `INVALID_TYPE`; then strips ``; & | $ ` ( )`` (`:27`), removes `..` (`:28`), converts backslashes to `/` (`:29`), removes `~` (`:30`), collapses repeated slashes (`:31`), strips a leading slash (`:32`), and trims (`:34`). It is applied to search queries as well as paths — this is what it actually does; consequences for Everything/mdfind/rg syntax are recorded in `src/platform/AGENTS.md`.
- `validateSearchQuery` (`:37-58`): must be a string, non-blank after trim, `<= MAX_QUERY_LENGTH`; codes `INVALID_TYPE`, `EMPTY_QUERY`, `QUERY_TOO_LONG`.
- `validatePath` (`:60-93`): must be a string, non-blank, `<= MAX_PATH_LENGTH`; rejects `..` anywhere (`PATH_TRAVERSAL`, `:82-84`), a leading `~` (`HOME_PATH_NOT_ALLOWED`, `:86-88`), and any char in ``[;&|`$()]`` (`INVALID_CHARACTERS`, `:90-92`). Backslashes and spaces are permitted.
- `validateSearchOptions` (`:95-120`): trims/delegates query, then returns normalized `{ query, maxResults, offset }` with defaults `maxResults = 100` (`:103`, range 1..1000 else `INVALID_MAX_RESULTS`) and `offset = 0` (`:111`, range 0..100000 else `INVALID_OFFSET`).

### platform.ts

- `getPlatform` (`:3-8`): `win32` → `'windows'`, `darwin` → `'darwin'`; any other `process.platform` (freebsd, sunos, …) falls through to `'linux'` at `:7`, so `unified.ts` will silently route unknown platforms down the Linux/locate path.
- Predicates `isWindows`/`isDarwin`/`isLinux` (`:10-20`); `getArchitecture` (`:22-28`) maps `x64`/`ia32`→`'x86'`/`arm64`, defaulting to `'x64'`.

## Work Guidance

- Keep the validation entry order used by all adapters: `validateSearchQuery`/`validatePath` first, then `sanitizeShellArg` on the shell-bound value (e.g. `windows-cli.ts:64,66`; `linux.ts:96-97`) — the sanitizer is the last line before interpolation, not a substitute for the validators.
- Error `code` strings are asserted by `tests/security.test.ts`; do not rename existing codes or renumber `SecurityConfig` limits without updating tests.
- ESM: import with `.js` extensions from `.ts` sources; `tsconfig.json` has `strict: true`.
- There is no lint or formatter configuration in this repo — do not invent or enforce style rules.

## Verification

- `tests/security.test.ts` covers `src/utils/validation.ts` thoroughly — 22 tests across `sanitizeShellArg` / `validateSearchQuery` / `validatePath` / `validateSearchOptions`, passing via `npm test` (= `vitest run`, `package.json:28`).
- `tests/integration.test.ts` (22 tests, passing) also imports only this folder: its suites cover attack scenarios, valid-input acceptance, sanitization quality, error-code shape, and per-call cost of the validators. Neither file exercises `src/index.ts` or the tool schema.
- `src/utils/platform.ts` has no dedicated automated tests; behavior is exercised only indirectly.

## Child DOX Index

(none)
