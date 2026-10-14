# src/platform — OS-specific search adapters shelling out to es.exe, mdfind, and rg/locate

DOX local contract for `src/platform`. Parent: [`AGENTS.md`](../../AGENTS.md). Closer doc wins on local detail; nothing here may weaken DOX.

## Purpose

- One adapter module per OS (`windows-cli.ts`, `darwin.ts`, `linux.ts`), each exporting the same triad — `searchFiles`, `getFileInfo`, `getStatus`. `searchFiles`/`getStatus` invoke the platform-native engine (es.exe / mdfind / rg,locate); `getFileInfo` no longer shells out — all three adapters delegate to the shared, shell-free `src/platform/file-info.ts` Node `fs` helper.
- Isolate all shell-out logic (command construction, output parsing, error translation) from the MCP/tool layer in `src/search` and `src/index.ts`. `getFileInfo` is the one triad member that no longer shells out.

## Ownership

Owns: `src/platform/windows-cli.ts`, `src/platform/darwin.ts`, `src/platform/linux.ts` and their CLI flag/output-parsing contracts, plus `src/platform/file-info.ts` (the shared Node `fs` helper every adapter's `getFileInfo` delegates to).

Stays owned by `src/AGENTS.md` / other subtrees: the dispatch that imports these modules (`src/search/unified.ts:2-10`), the shapes adapters must produce (`src/types/index.ts`), and validation/sanitization policy (`src/utils/validation.ts`). Adapter consumers in `src/search/` and the tool surface are not this folder's concern.

## Local Contracts

- Triad signatures are pinned by `src/search/unified.ts:2-10` (three separate imports of `searchFiles`/`getFileInfo`/`getStatus`, one per module). Each module must keep exporting all three names.
- Result objects must conform to `SearchResult` (`src/types/index.ts:1-13`), `FileInfo` (`:28-39`), and `PlatformStatus` (`:41-47`); `SearchOptions` is `:15-26`.

### windows-cli.ts — vendored `bin/es.exe` (voidtools Everything CLI; path resolved at `windows-cli.ts:8-11`)

- `searchFiles` flags: `-n <max>` (`:70`), bare query or `-path <query>` (`:71-75`), `-case` (`:79`), `-ww` (`:83`), `-regex` (`:87`), `-sort <name|path|size|date-modified|date-created|extension|attributes|run-count>` with descending order encoded in the value as `<field>-descending` — ES has no standalone `-descending` switch (`:104-105`). `getStatus` probes `-version` (`:155`). `getFileInfo` no longer shells out — it is a one-line delegate to `file-info.ts` (`:149`).
- `searchFiles` output parsed as tab-separated lines, positional columns: `parts[0]`=fileName, `[1]`=path, `[2]`=fullPath, `[3]`=size, `[4]`=dateModified, `[5]`=dateCreated, `[6]`=attributes (`parseESOutput` `:27-60`), mapped to `SearchResult` at `:122-135`; `getStatus` returns the `PlatformStatus` literal at `:162-167`.

### darwin.ts — `mdfind` (Spotlight)

- Args: `['-name', query]`, or the raw query when `options.query.includes('kind:')` (`:33-38`); option-specific prefixes built at `:17-30` (matchCase `:17`, matchWholeWord `:21`, regex `:25`, matchPath `:29`).
- Output: one absolute path per line; name/path split on `/` (`:49-58`); `offset`/`maxResults` sliced in-process (`:64,68`).
- `getFileInfo` no longer shells out — one-line delegate to `file-info.ts` (`:83`); `getStatus` probes `which mdfind` (`:89`).

### linux.ts — `rg` (ripgrep) preferred, `locate` fallback

- Capability probe at `:15-22` selects the engine; actual command name executed is `'rg'` or `'locate'` (`:50`).
- rg args: `--files --no-heading --no-line-number --color never` + `--case-sensitive`/`--ignore-case` + `--regexp`/`--fixed-strings` + `<query> /` (`:27-41`); locate args: optional `-i` + `<query>` (`:43-46`).
- Output: one path per line, trailing slashes stripped before split (`:60-72`); offset/maxResults sliced in-process (`:76,80`).
- `getFileInfo` no longer shells out — one-line delegate to `file-info.ts` (`:95`); `getStatus` probes ripgrep then locate (`:99-115`), still via a callback-less `exec` (`:105`).

### file-info.ts — shared, shell-free `getFileInfo` (Node `fs`)

- `getFileInfoFs(path)` (`file-info.ts:9`) is the single `getFileInfo` implementation all three adapters delegate to; it never shells out.
- Order: `validatePath(path)` first, **outside** the `try` (`:10`), so its `ValidationError` (with `.code`) reaches the MCP envelope un-wrapped; only `fs` errors are caught (`:13-19`). `stat` follows symlinks (`:14`).
- Field mapping: `name = basename(path)`, `path = dirname(path)` (the documented contract: `name`=file, `path`=containing folder), `size/created/modified/accessed` = `stat.size/.birthtime/.mtime/.atime`, `extension = extname` without the leading dot (or `undefined`), `isFolder`/`isFile` = `stat.isDirectory()`/`stat.isFile()`. `attributes` is intentionally left `undefined` — Node `fs` cannot produce the Windows DIR bitmask; the field is optional (`src/types/index.ts:35`).
- Errors: `ENOENT`/`ENOTDIR` → `"File not found: <path>"`; other `fs` errors → `"Failed to get file info: <msg>"`.

### Defects and fixes (runtime-proven)

- FIXED this session: `get_file_info` now works on every platform. All three adapters' `getFileInfo` delegate to the shared shell-free `src/platform/file-info.ts` Node `fs` helper, replacing the broken per-OS shell calls — the Windows `es.exe -n 1 -info` (a switch the vendored ES 1.1.0.36 lacks, previously always `Error 6: Unknown switch.` → `UNKNOWN_ERROR`), the macOS `stat -f "%N %z %SB %Sm %Sc"` (its one-line output was split on newlines), and the Linux `stat -c "%s %n %U %G %Y"` (field order misread). Covered by `tests/file-info.test.ts` and the stdio probe.
- PROVEN at runtime: `searchFiles` discards `ValidationError.code`. The catch at `windows-cli.ts:138-146` re-wraps every error as `new Error('Search failed: ' + error.message)` (text at `:145`), so a 1001-character query surfaces as `UNKNOWN_ERROR` with "Query exceeds maximum length of 1000 characters" still intact. A 1000-character query is within the cap and succeeds.
- FIXED this session: `sortBy`+`sortOrder: descending` previously emitted a standalone `-descending` switch that ES 1.1.0.36 rejects (`Error 6: Unknown switch.`); `windows-cli.ts:104-105` now encodes the direction in the `-sort` value (`size-descending`), verified by the probe.
- `windows-cli.ts:108`: the sanitized search query is interpolated into a shell string passed to `exec` (`"${esPath}" ${args.join(' ')}`) instead of `execFile`/argument arrays; the only defense is `sanitizeShellArg`. `get_file_info` no longer shells out, so this no longer applies to it.
- `sanitizeShellArg` (`src/utils/validation.ts:21-35`) strips `..`, `~`, backslash, and shell metacharacters from SEARCH QUERIES (`windows-cli.ts:66`, `darwin.ts:12`, `linux.ts:12`), not just paths — legitimate Everything syntax (operators, regex, drive-qualified paths) is altered.
- `windows-cli.ts:133-134` derive `isFolder`/`isFile` for SEARCH RESULTS from `attributes` containing the letter `D`, but `attributes` is parsed as a numeric column (`:52-54`, `:131`) — folder detection looks unreliable; unverified at runtime.
- `darwin.ts:17-38`: later option branches overwrite `query` set by earlier ones, and the `regex:` (`:25`) / `in:*` (`:29`) prefixes built there are not valid `mdfind -name` syntax once composed at `:38`.
- `linux.ts:105`: `getStatus` awaits the callback-less `exec` (not `execPromise`), so the ENOENT path cannot reject the way the surrounding try/catch assumes.
- `linux.ts:18`: probes `which ripgrep`, but the binary is `rg` (used at `:50`) — in `searchFiles` this makes the rg branch unreachable on typical systems, falling back to `locate`.
- `darwin.ts:1` and `linux.ts:1` import `spawn` that is never used.

## Work Guidance

- The three modules must keep the identical exported triad (`searchFiles`/`getFileInfo`/`getStatus`) so `src/search/unified.ts` can dispatch on `isWindows`/`isDarwin`/`isLinux` (`unified.ts:13-52`); any new platform adapter needs the same surface.
- Every user-supplied search QUERY passes `validateSearchQuery` then `sanitizeShellArg` in each adapter's `searchFiles` (`windows-cli.ts:65,66`, `darwin.ts:10,12`, `linux.ts:10,12`); the `get_file_info` PATH passes `validatePath` in the shared `src/platform/file-info.ts:10`, which is not shell-bound.
- ESM: import sibling modules with `.js` extensions from `.ts` sources (e.g. `windows-cli.ts:5-6`); `tsconfig.json` has `strict: true`.
- There is no lint or formatter configuration in this repo — do not invent or enforce style rules.

## Verification

- `tests/file-info.test.ts` (8 tests) imports `src/platform/file-info.js` directly — so the shared `getFileInfo` helper now has host-agnostic automated coverage (no `es.exe`/`stat` needed). The CLI `searchFiles`/`getStatus` paths in the three adapters still have zero automated coverage and depend on `es.exe`/`mdfind`/`rg` being present on the host. `npm test` = `vitest run` (`package.json:28`), now 4 files / 89 tests under vitest 5.0.4.
- The manual stdio JSON-RPC probe of `node dist/index.js` (not a committed harness) confirmed the `MAX_QUERY_LENGTH` cap reaching the envelope, that `sortBy`+`sortOrder: descending` reaches ES without `Error 6`, and that `get_file_info` now returns real `fs` metadata (the old Windows `-info` failure is gone).
- Behavior changes this session: the `windows-cli.ts` sort fix, and the `get_file_info` migration to the shared `file-info.ts` `fs` helper (all adapters now delegate). `get_file_info` no longer needs `es.exe`/`stat` on the host.
- `MANUAL_TESTING_GUIDE.md` (repo root) is the only documented manual procedure for the CLI `searchFiles`/`getStatus` adapters.

## Child DOX Index

(none)
