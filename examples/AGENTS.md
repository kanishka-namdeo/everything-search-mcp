# examples/ — Claude Desktop MCP client configuration samples

DOX local contract for `examples/`. Parent: [`AGENTS.md`](../AGENTS.md). Closer doc wins on local detail; nothing here may weaken DOX.

## Purpose
- Two hand-written JSON samples showing how a user registers this server with an MCP client (`claude_desktop_config.json`).
- Documentation only: no code reads these files at build, test, or run time.

## Ownership
- This subtree owns exactly two files: `claude_desktop_config.json` (8 lines) and `claude_desktop_config_advanced.json` (14 lines).
- Not owned here: the `bin` name they rely on (`package.json:7-9`), the `dist/index.js` entry they point at (produced by `tsconfig.json:7` from `src/`), the supported environment surface (`src/` + `scripts/download-es.js`), and the inline config snippets duplicated in `README.md:112-120`, `QUICKSTART.md:40-48` and `MANUAL_TESTING_GUIDE.md:26-35` (root-owned docs).

## Local Contracts
- Both files have the same shape: `mcpServers` → server key `everything-search` → `command` / `args`, plus `env` in the advanced one. The server key is `everything-search` in both samples and matches the snippets in the root docs — keep it identical or the samples stop matching copy-pasteable instructions.
- `claude_desktop_config.json` is the published-package form: `command: "everything-search-mcp"` (`:4`) with `"args": []` (`:5`), i.e. it resolves through the package `bin` entry (`package.json:7-9`), so it requires a global install / `npx`-resolved install, not a local checkout.
- `claude_desktop_config_advanced.json` is the local-build form: `command: "node"` (`:4`) with a single absolute arg `"/path/to/everything-search-mcp/dist/index.js"` (`:6`). Paths must point at built `dist/` — `src/` is never executable here, so `npm run build` is a prerequisite for this sample to work, and the placeholder path must be replaced by the user.
- Defect: `env.EVERYTHING_PATH: "C:\\Program Files\\Everything"` (`claude_desktop_config_advanced.json:9`) is a dead, unsupported key — `EVERYTHING_PATH` appears nowhere in `src/` or `scripts/`; `es.exe` is resolved only relative to the package root (`src/platform/windows-cli.ts:11`, `scripts/download-es.js:12`). `README.md:124` itself states the server "doesn't require additional environment variables". `NODE_ENV` (`:10`) is likewise read nowhere in `src/`. Do not extend either sample as if these keys were live.
- Windows backslashes in these samples are JSON-escaped (`\\`), which is correct for real config files; the advanced sample's `args` path is a POSIX-style placeholder while `env` uses Windows-style — both are accepted verbatim by Claude Desktop.

## Work Guidance
- Anything added here must stay a copy-pasteable Claude Desktop fragment rooted at `mcpServers`; do not add server-side runtime knobs to these samples unless `src/` actually reads them (verify with a grep for the env name first).
- ESM/`"type": "module"` (`package.json:6`) does not affect these files; the only contract is `command` + the `dist/` path.
- No lint or formatter configuration exists in the repo; there is no JSON style standard here beyond valid JSON and matching the existing two-file layout.

## Verification
- Nothing validates this folder programmatically. `npm test` (`package.json:28`) has no test importing or parsing `examples/`; `npm run build` (`package.json:24`) compiles `src/**/*` only (`tsconfig.json:17`); `npm pack --dry-run` deliberately excludes it (`package.json:16-22` allowlist has no `examples` entry, and `.npmignore:12` names `examples/`).
- Correctness of a sample is confirmed only by loading it into a real Claude Desktop install per `MANUAL_TESTING_GUIDE.md`.

## Child DOX Index
(none)
