# .github/ — release-triggered npm publish workflow

DOX local contract for `.github/`. Parent: [`AGENTS.md`](../AGENTS.md). Closer doc wins on local detail; nothing here may weaken DOX.

## Purpose
- Holds the only CI definition in the repo, `.github/workflows/npm-publish.yml` (38 lines): test the package, then publish it to npm.
- Nothing here runs on a plain push or pull request.

## Ownership
- This subtree owns the workflow file and its trigger, job order, runner images, Node version, permissions and secret names.
- Not owned here: the release-cutting procedure and version-bump steps (`PUBLISHING.md`, root-owned), the npm scripts the workflow invokes (`package.json:23-32`), and the test suite it runs (`tests/AGENTS.md`).

## Local Contracts
- Trigger is a published GitHub release only (`npm-publish.yml:6-8`, `types: [published]`). Publishing is therefore release-driven: cutting a release is what puts a version on npm.
- Job `build` (`:11-20`) runs on `ubuntu-latest` with `actions/checkout@v7` (`:14`) and `actions/setup-node@v7` (`:15`) pinned to `node-version: 24` (`:17`) with `cache: npm` (`:18`), then `npm ci` (`:19`) and `npm test` (`:20`).
- Job `publish-npm` (`:22-38`) declares `needs: build` (`:23`) and `permissions: contents: read, id-token: write` (`:25-27`); the `id-token` grant is what `--provenance` requires. It runs `actions/checkout@v7` (`:29`) and `actions/setup-node@v7` (`:30`) with `node-version: 24` (`:32`), `cache: npm` (`:33`) and `registry-url: https://registry.npmjs.org/` (`:34`), then `npm ci` (`:35`) and `npm publish --provenance --access public` (`:36`) with `NODE_AUTH_TOKEN` fed from `secrets.NPM_TOKEN` (`:37-38`).
- CI never runs `npm run build` explicitly: the build happens inside `npm publish` via `prepublishOnly` (`package.json:27`, `npm run build && npm test`). The artifact on npm is compiled in the publish job, not in the `build` job.
- Runner Node is 24 (`:17`, `:32`) because vitest `^5.0.4` engines are `^22.12.0 || ^24.0.0 || >=26.0.0` — the previous Node 20 pin cannot run `npm test` at all, and Node 20 is past its own EOL. The declared floor is `package.json:70` `"node": ">=20.0.0"` (raised from `>=18.0.0`); there is no version matrix, no coverage gate, and no other file under `.github/`.
- `npm ci` in both jobs fires the `postinstall` hook (`package.json:31`), but because `bin/es.exe` is committed, the script hits its skip guard (`scripts/download-es.js:167-170`) and performs NO network call on a fresh checkout — the runner never downloads a Windows `es.exe` it will not use. Recorded hazard, unchanged: when `bin/es.exe` is absent (or the download is forced) and the fetch fails, `download-es.js:203-208` calls `process.exit(1)` and hard-fails `npm ci`, hence the whole release. Defect: CI has no protection against that.
- Defect: `PUBLISHING.md:225` documents a workflow named `publish.yml` triggered by `push: tags: v*` on `windows-latest`. That file does not exist; this workflow is the live contract.

## Work Guidance

## Verification
- Nothing validates this folder locally: the workflow only executes on a published release, and neither `actionlint` nor GitHub's `act` is configured or installed here.
- The closest local equivalents of what CI does are `npm ci` followed by `npm test` (`package.json:28`) and `npm pack --dry-run` for the published file list. Measured locally under vitest `^5.0.4`: `npm test` runs 4 files / 89 tests, all passing across 20 consecutive runs, and `npm pack --dry-run` lists 46 files.
- A real end-to-end verification of this file requires cutting a prerelease, which is a release action and needs explicit user approval.

## Child DOX Index
(none)
