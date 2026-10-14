# src/ — TypeScript source of the everything-search-mcp server

DOX local contract for `src/`. Parent: [`AGENTS.md`](../AGENTS.md). Closer doc wins on local detail; nothing here may weaken DOX.

## Purpose
- Complete source tree of the npm-published MCP server (`package.json:8` maps `bin` to `dist/index.js`; `dist/` is produced from this folder only, per `tsconfig.json:7`).
- Entry point `src/index.ts` wires the MCP stdio server and the three exposed tools (`search_files`, `get_file_info`, `check_status`).
- Dispatch and security layers (`search/`, `utils/`) sit between the server and the per-OS shell wrappers (`platform/`).

## Ownership
- This subtree owns: `src/index.ts` (server registration, tool schemas, handler, response/error shape), `src/search/unified.ts` (platform routing), `src/utils/` (platform detection, validation), `src/types/index.ts` (shared interfaces), `src/platform/*.ts` (OS command construction and output parsing).
- Owned by the parent/root scope: `package.json` and its scripts, `tsconfig.json`, the vendored `bin/es.exe` and `scripts/download-es.js`, `tests/`, and npm publishing.

## Local Contracts
- Server identity: `new Server({name: 'everything-search-mcp', version: '1.0.0'})` at `src/index.ts:14-24`. Defect: version is hardcoded `1.0.0` while `package.json:3` is `1.1.0`.
- Tools are declared in `src/index.ts:26-105` (input schemas) and handled in the single `CallToolRequestSchema` handler `src/index.ts:113-259`; `main()` connects `StdioServerTransport` at `src/index.ts:261-266`.
- stdout is the MCP protocol channel: all logging goes to `console.error` (`src/index.ts:265`, `src/index.ts:242`). Never write to stdout from this subtree.
- Argument coercion uses bare `as` casts (`src/index.ts:119-127`, `src/index.ts:170`); the `zod` import at `src/index.ts:10` is unused. Defect: no zod validation despite the declared schema; real validation happens downstream in `src/utils/validation.ts`.
- Error shape (binding): every tool response is JSON in a single `text` content item. Success: `{success: true, ...}`. Failure: the catch block at `src/index.ts:227-258` returns `{success: false, error, errorCode, tool}` with `isError: true`; `errorCode` comes from `error.code` if present (`src/index.ts:233-235`), else `'UNKNOWN_ERROR'`. `ValidationError` carries `code` and `statusCode` (`src/utils/validation.ts:1-10`), so its code surfaces as `errorCode`.
- Security boundary (binding): all shell-bound query/path input passes through `src/utils/validation.ts` before reaching a subprocess — `sanitizeShellArg` (`validation.ts:21`), `validateSearchQuery` (`:37`), `validatePath` (`:60`) — enforced inside each platform module (`src/platform/windows-cli.ts:64,151`, `src/platform/darwin.ts:10,84`, `src/platform/linux.ts:10,96`). Caps live in `SecurityConfig` (`validation.ts:12-19`).
- `validateSearchOptions` (`validation.ts:95`) is exported and unit-tested but not called from `src/`; result caps are instead applied per platform via `Math.min(options.maxResults ?? 100, SecurityConfig.MAX_RESULTS)` (`windows-cli.ts:67`, `darwin.ts:12`, `linux.ts:12`).
- Platform routing is centralized in `src/search/unified.ts` using `isWindows/isDarwin/isLinux` from `src/utils/platform.ts:10-20`; `process.platform === 'win32'` maps to `'windows'` (`platform.ts:5`) and anything not darwin falls back to `'linux'` (`platform.ts:7`).
- Sibling boundary (binding): each module in `src/platform/` must keep the same exported triad `searchFiles(options: SearchOptions): Promise<SearchResult[]>`, `getFileInfo(path: string): Promise<FileInfo>`, `getStatus(): Promise<PlatformStatus>` (`windows-cli.ts:62,149,195`; `darwin.ts:8,82,121`; `linux.ts:8,94,132`); `unified.ts:1-10` imports exactly these.
- Windows executes the vendored CLI at `bin/es.exe`, resolved relative to the compiled module (`src/platform/windows-cli.ts:8-11`); the binary itself is root-owned.

## Work Guidance
- ESM-only (`package.json:6` `"type": "module"`): every relative TS import carries the `.js` extension (`src/index.ts:11`, `src/search/unified.ts:1-11`, `src/platform/windows-cli.ts:5`). Shared data shapes are imported type-only from `../types/index.js` (`src/index.ts:12`, `windows-cli.ts:6`, `darwin.ts:3`, `linux.ts:3`, `unified.ts:11`).
- `tsconfig.json` is `strict: true` with `target/module ES2022` and `moduleResolution: "bundler"` (`tsconfig.json:2-11`); `include` is `src/**/*` only, so `tests/` is not typechecked by `npm run build`.
- Adding or changing a tool touches the same chain: schema + handler in `src/index.ts`, pass-through in `src/search/unified.ts`, and the triad in each `src/platform/*.ts` that supports it.
- No formatter or lint config exists in the repo; match the style of the neighboring file rather than inventing conventions.
- New security limits belong in `SecurityConfig`/`validation.ts`, not duplicated per platform module.

## Verification
- `npm test` = `vitest run` (`package.json:28`). As of this session: `tests/security.test.ts` (22 tests) and `tests/integration.test.ts` (22 tests) pass, 44/44.
- `npm run build` = `tsc` (`package.json:24`); with `declaration: true` it is also the check that `src/types/` changes compile for consumers.
- Both test files target only `src/utils/validation.ts`; there is no vitest config, no lint, no formatter. The `rg`/`mdfind`/`locate`-dependent code in `src/platform/` and the routing branches in `src/search/unified.ts` have no automated coverage — on this (Windows) machine only the `es.exe` path can even run.

## Child DOX Index
- [`platform/AGENTS.md`](platform/AGENTS.md) — per-OS shell wrappers (`windows-cli.ts`, `darwin.ts`, `linux.ts`) implementing the `searchFiles`/`getFileInfo`/`getStatus` triad.
- [`search/AGENTS.md`](search/AGENTS.md) — `unified.ts` platform dispatch layer between `index.ts` and `platform/`.
- [`types/AGENTS.md`](types/AGENTS.md) — shared compile-time interfaces in `types/index.ts` and the legacy SDK leftovers.
- [`utils/AGENTS.md`](utils/AGENTS.md) — `platform.ts` detection and `validation.ts` security boundary.
