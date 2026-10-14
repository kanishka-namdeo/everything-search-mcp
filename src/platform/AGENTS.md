# src/platform — OS-specific search adapters shelling out to es.exe, mdfind, and rg/locate

DOX local contract for `src/platform`. Parent: [`AGENTS.md`](../../AGENTS.md). Closer doc wins on local detail; nothing here may weaken DOX.

## Purpose

- One adapter module per OS (`windows-cli.ts`, `darwin.ts`, `linux.ts`), each exporting the same triad — `searchFiles`, `getFileInfo`, `getStatus` — that invokes the platform-native search engine and maps results onto the shared shapes.
- Isolate all shell-out logic (command construction, output parsing, error translation) from the MCP/tool layer in `src/search` and `src/index.ts`.

## Ownership

Owns: `src/platform/windows-cli.ts`, `src/platform/darwin.ts`, `src/platform/linux.ts` and their CLI flag/output-parsing contracts.

Stays owned by `src/AGENTS.md` / other subtrees: the dispatch that imports these modules (`src/search/unified.ts:2-10`), the shapes adapters must produce (`src/types/index.ts`), and validation/sanitization policy (`src/utils/validation.ts`). Adapter consumers in `src/search/` and the tool surface are not this folder's concern.

## Local Contracts

- Triad signatures are pinned by `src/search/unified.ts:2-10` (three separate imports of `searchFiles`/`getFileInfo`/`getStatus`, one per module). Each module must keep exporting all three names.
- Result objects must conform to `SearchResult` (`src/types/index.ts:1-13`), `FileInfo` (`:28-39`), and `PlatformStatus` (`:41-47`); `SearchOptions` is `:15-26`.

### windows-cli.ts — vendored `bin/es.exe` (voidtools Everything CLI; path resolved at `windows-cli.ts:8-11`)

- Flags emitted: `-n <max>` (`:69`), bare query or `-path <query>` (`:71-75`), `-case` (`:77-79`), `-ww` (`:81-83`), `-regex` (`:85-87`), `-sort <name|path|size|date-modified|date-created|extension|attributes|run-count>` plus optional `-descending` (`:89-106`), `-n 1 -info "<path>"` for `getFileInfo` (`:154`), `-version` for `getStatus` (`:197`).
- Output parsed as tab-separated lines, positional columns: `parts[0]`=fileName, `[1]`=path, `[2]`=fullPath, `[3]`=size, `[4]`=dateModified, `[5]`=dateCreated, `[6]`=attributes (`parseESOutput` `:26-60`).
- Mapping to `SearchResult` at `:124-135`; to `FileInfo` at `:173-183`; `getStatus` returns the `PlatformStatus` literal at `:204-210`.

### darwin.ts — `mdfind` (Spotlight)

- Args: `['-name', query]`, or the raw query when `options.query.includes('kind:')` (`:32-38`); option-specific prefixes built at `:14-30` (matchCase quotes, matchWholeWord `name:"..."`, regex `regex:...`, matchPath `in:* ...`).
- Output: one absolute path per line; name/path split on `/` (`:46-60`); `offset`/`maxResults` sliced in-process (`:62-68`).
- `getFileInfo` runs BSD `stat -f "%N %z %SB %Sm %Sc"` (`:87`); `getStatus` probes `which mdfind` (`:123`).

### linux.ts — `rg` (ripgrep) preferred, `locate` fallback

- Capability probe at `:14-21` selects the engine; actual command name executed is `'rg'` or `'locate'` (`:49`).
- rg args: `--files --no-heading --no-line-number --color never` + `--case-sensitive`/`--ignore-case` + `--regexp`/`--fixed-strings` + `<query> /` (`:26-40`); locate args: optional `-i` + `<query>` (`:42-46`).
- Output: one path per line, trailing slashes stripped before split (`:59-72`); offset/maxResults sliced in-process (`:74-80`).
- `getFileInfo` runs GNU `stat -c "%s %n %U %G %Y"` and splits on spaces (`:99-104`); `getStatus` probes ripgrep then locate (`:132-161`).

### Known defects (recorded, not fixed)

- `windows-cli.ts:108` and `:154`: the sanitized query/path is interpolated into a shell string passed to `exec` (`"${esPath}" ${args.join(' ')}`) instead of `execFile`/argument arrays; the only defense is `sanitizeShellArg`.
- `sanitizeShellArg` (`src/utils/validation.ts:21-35`) strips `..`, `~`, backslash, and shell metacharacters from SEARCH QUERIES (`windows-cli.ts:66`, `darwin.ts:11`, `linux.ts:11`), not just paths — legitimate Everything syntax (operators, regex, drive-qualified paths) is altered.
- `windows-cli.ts:133-134` (and `:181-182`) derive `isFolder`/`isFile` from `attributes` containing the letter `D`, but `attributes` is parsed as a numeric column (`:51-53`, `:131`) — folder detection looks unreliable; unverified at runtime.
- `darwin.ts:87-102`: `stat -f "%N %z %SB %Sm %Sc"` emits one space-separated line, but the parser splits on newlines (`:92`) and indexes `parts[1]`/`parts[2]` as separate fields, testing `parts[1] === '1'` for directory-ness (`:99`) — the field mapping does not match the format string.
- `darwin.ts:14-38`: later option branches overwrite `query` set by earlier ones, and the `regex:` (`:24-25`) / `in:*` (`:28-30`) prefixes built there are not valid `mdfind -name` syntax once composed at `:37`.
- `linux.ts:99-121`: `stat -c "%s %n %U %G %Y"` field order vs parser indices mismatch — modified is read from the owner-name field (`:112`), and `isFile: true`/`isFolder: false` are hardcoded (`:119-120`).
- `linux.ts:138`: `getStatus` awaits the callback-less `exec` (not `execPromise`), so the ENOENT path cannot reject the way the surrounding try/catch assumes.
- `linux.ts:17`: probes `which ripgrep`, but the binary is `rg` (used at `:49`) — in `searchFiles` this makes the rg branch unreachable on typical systems, falling back to `locate`.
- `darwin.ts:1` and `linux.ts:1` import `spawn` that is never used.

## Work Guidance

- The three modules must keep the identical exported triad (`searchFiles`/`getFileInfo`/`getStatus`) so `src/search/unified.ts` can dispatch on `isWindows`/`isDarwin`/`isLinux` (`unified.ts:13-52`); any new platform adapter needs the same surface.
- Every user-supplied query or path must pass through `src/utils/validation.ts` (`validateSearchQuery`/`validatePath`, then `sanitizeShellArg`) before reaching a shell; current entry points: `windows-cli.ts:64,151`, `darwin.ts:10,84`, `linux.ts:10,96`.
- ESM: import sibling modules with `.js` extensions from `.ts` sources (e.g. `windows-cli.ts:5-6`); `tsconfig.json` has `strict: true`.
- There is no lint or formatter configuration in this repo — do not invent or enforce style rules.

## Verification

- `src/platform/*.ts` adapters have NO automated coverage: no test in `tests/` imports them, and they depend on `es.exe`/`mdfind`/`rg` being present on the host.
- `npm test` (= `vitest run`, `package.json:28`) runs `tests/security.test.ts` and `tests/integration.test.ts`, both of which import only `src/utils/validation.js` — neither reaches this folder.
- `MANUAL_TESTING_GUIDE.md` (repo root) is the only documented manual procedure for these adapters.

## Child DOX Index

(none)
