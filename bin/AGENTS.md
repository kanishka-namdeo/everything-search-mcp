# bin/ — vendored voidtools Everything CLI binary

DOX local contract for `bin/`. Parent: [`AGENTS.md`](../AGENTS.md). Closer doc wins on local detail; nothing here may weaken DOX.

## Purpose
- Vendored-binary directory: two tracked files — `bin/es.exe` and this `bin/AGENTS.md` (`git ls-files bin`). Only the binary is third-party content, and it ships in the tarball (`package.json:18`).
- `es.exe` is the voidtools Everything command-line client: a 257,192-byte PE32+ x86-64 Windows console executable, committed as third-party upstream content; nothing here is built from source in this repo.
- Provides the pre-installed CLI runtime that the Windows search adapter shells out to at run time.

## Ownership
- This subtree owns the binary artifact and its provenance: it is an upstream voidtools/ES release product, tracked in git and shipped in the npm tarball.
- The resolution-path contract (`<package root>/bin/es.exe`) is owned by `src/platform/windows-cli.ts:10-11`, not by this folder; renaming or relocating the binary must be coordinated there and in `scripts/download-es.js`.
- The mechanism that can place/refresh the binary (GitHub release download) is owned by `scripts/` — see `scripts/AGENTS.md`.

## Local Contracts
- `bin/es.exe` is vendored upstream content: never hand-edit, recompile, stub, or swap it. The only sanctioned ways it changes are the postinstall download (`scripts/download-es.js:136-161`) or the documented manual placement from `https://github.com/voidtools/ES/releases` (`README.md:390-391`).
- Survives gitignore by explicit negation: `.gitignore:191-192` (`!bin/`, `!bin/es.exe`). Verified: `git check-ignore` reports `bin/es.exe` as not ignored, and no active exclude rule actually matches it — the build-artifact block (`.gitignore:176-185`) lists `*.dll`, `*.so`, `*.a`, etc. but no `*.exe`; the negations are protective against future broad rules.
- Shipped to consumers: the `files` whitelist `package.json:16-22` includes `bin`, so the tarball carries the binary on every platform.
- Windows-only artifact in a cross-platform package: `package.json:72-76` declares `os: ["win32","darwin","linux"]`. macOS/Linux installs still run the postinstall download (`package.json:31`, no platform check in the script) and receive the same `.exe`; it is inert there — those platforms dispatch to Spotlight/ripgrep, not this binary.
- Referenced from exactly one runtime site: `src/platform/windows-cli.ts:10-11` resolves the path; `:140`, `:189`, `:217` tell users to "run: npm run postinstall" when the file is missing.
- Version drift (recorded here; read by executing `bin/es.exe -version`): the committed binary is ES `1.1.0.36` while the current upstream voidtools/ES release asset is `1.1.0.38`. Because `scripts/download-es.js:167-170` exits before any network call when `bin/es.exe` already exists, an install never refreshes a committed binary — and since `bin/es.exe` is committed, `npm ci` on a fresh checkout takes that skip path and makes no network request at all. The repo stays at `1.1.0.36` until someone swaps the file by hand.
- Switch support is bound to that version: `-info`, which `src/platform/windows-cli.ts:154` emits for `get_file_info`, is not a switch this binary supports — `bin/es.exe -n 1 -info "C:/Windows/win.ini"` returns `Error 6: Unknown switch.` The tool-level consequence is recorded in `src/platform/AGENTS.md`, not here.

## Work Guidance
- The one documented procedure that touches this folder is manual binary recovery (`README.md:385-391`): download `es.exe` from the voidtools/ES releases page and place it in `bin/`. Any binary refresh must come from that upstream source; record the release tag and SHA-256 in the commit, since no provenance file exists.

## Verification
- No automated test covers `bin/`: the vitest suite (`tests/security.test.ts` 22, `tests/integration.test.ts` 22, `tests/tool-args.test.ts` 37 — 81/81 passing under vitest 5.0.4) imports only `src/utils/validation.js` and `src/tool-args.js`, never the binary.
- Existing manual checks: run `bin/es.exe -version` (the exact invocation `src/platform/windows-cli.ts:197` uses); `MANUAL_TESTING_GUIDE.md` Test 10 (`:431-459`) verifies status indirectly through `check_status` against the built server, and its Setup (`:15-20`) assumes `npm install`/`npm run build` succeeded.
- What is NOT verified by the guide: binary integrity/version (its "es.exe not found" remedy at `:527-528` says "add to PATH", which does not match the actual package-local resolution at `windows-cli.ts:10-11`), and the download pipeline that could repopulate this folder.

## Child DOX Index
(none)
