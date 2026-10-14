# src/types/ — Shared compile-time data contracts

DOX local contract for `src/types/`. Parent: [`AGENTS.md`](../AGENTS.md). Closer doc wins on local detail; nothing here may weaken DOX.

## Purpose
- Defines the interfaces that cross every boundary in `src/`: search results, options, file metadata, platform status.
- Contains exactly one file, `index.ts`; everything active here is compile-time only (importers use `import type`, so nothing is emitted at runtime).

## Ownership
- This subtree owns the shape of `SearchResult`, `SearchOptions`, `FileInfo`, `PlatformStatus` as consumed by `index.ts`, `search/unified.ts`, `platform/*`, and `utils/validation.ts` callers.
- Not owned here: runtime validation of those shapes (`src/utils/validation.ts`), how fields get populated (`src/platform/*.ts` parsing), tool-level JSON response key selection (`src/index.ts:152-162`, `:184-195`).

## Local Contracts
- Active types and their importers (binding):
  - `SearchResult` — `types/index.ts:1-13`; imported type-only at `src/search/unified.ts:11`, `src/platform/darwin.ts:3`, `src/platform/linux.ts:3` and `src/index.ts:12`. No platform module annotates its return with it: `windows-cli.ts:62` returns `Promise<any[]>`.
  - `SearchOptions` — `types/index.ts:15-26`; imported by `unified.ts:11` and all three `src/platform/*.ts`.
  - `FileInfo` — `types/index.ts:28-39`; `PlatformStatus` — `types/index.ts:41-47`; both used across `index.ts:12`, `unified.ts:11`, `windows-cli.ts:6`, `darwin.ts:3`, `linux.ts:3`.
- Optionality is a real cross-platform invariant: `size`, `modified`, `created`, `extension`, `attributes`, `accessed`, `runCount` are optional because `mdfind`/`locate` results carry only `name/path/fullPath/isFile/isFolder` (`src/platform/darwin.ts:53-59`, `src/platform/linux.ts:65-71`); only `es.exe` output fills the rest (`src/platform/windows-cli.ts:124-135`). Do not make these required.
- The `sortBy` string union is duplicated verbatim in `SearchOptions` (`types/index.ts:19`) and the handler cast (`src/index.ts:122`), and both mirror the tool schema enum (`src/index.ts:50`). Changing one requires changing all three.
- `requestFlags?: number` (`types/index.ts:25`) is declared but read nowhere in `src/` or `tests/` — a leftover field.
- Dead legacy block: `SortType` (`types/index.ts:49-75`), `RequestFlag`/`RequestFlags` (`:77-96`), `SortTypes` (`:98-125`), `EverythingErrorCodes` (`:127-138`) are verified imported by nothing in `src/` or `tests/`; they are leftovers from the abandoned Everything-SDK approach (`.gitignore:15` "not used - es.exe CLI is used instead"). Defect: shipped dead exports. Do not build new code on them.
- `PlatformStatus.version` and `.message` are optional and populated only by platform `getStatus()` implementations (e.g. `windows-cli.ts:204-209`, `unified.ts:45-50`).

## Work Guidance
- Types are imported type-only with the `.js` extension: `import type {...} from '../types/index.js'` — match this from any new `src/` file.
- Add fields as optional when a backing search engine cannot supply them; when a field must be validated at runtime, the check belongs in `src/utils/validation.ts`, not here.
- No formatter exists; match the existing single-interface-per-block style.

## Verification
- The existing check is `npm run build` = `tsc` with `strict: true` and `declaration: true` (`tsconfig.json:8,13`); because every importer uses `import type`, `tsc` is the only enforcement of these contracts.
- `npm test` (vitest, 44/44: `security.test.ts` 22 + `integration.test.ts` 22) imports only `src/utils/validation.js` — nothing in `src/types/` has or needs runtime test coverage, and no test asserts these shapes today.

## Child DOX Index
(none)
