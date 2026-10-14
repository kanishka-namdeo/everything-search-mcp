# .github/ — release-triggered npm publish workflow

DOX local contract for `.github/`. Parent: [`AGENTS.md`](../AGENTS.md). Closer doc wins on local detail; nothing here may weaken DOX.

## Purpose
- Holds the only CI definition in the repo, `.github/workflows/npm-publish.yml` (36 lines): test the package, then publish it to npm.
- Nothing here runs on a plain push or pull request.

## Ownership
- This subtree owns the workflow file and its trigger, job order, runner images, Node version, permissions and secret names.
- Not owned here: the release-cutting procedure and version-bump steps (`PUBLISHING.md`, root-owned), the npm scripts the workflow invokes (`package.json:23-32`), and the test suite it runs (`tests/AGENTS.md`).

## Local Contracts
- Trigger is a published GitHub release only (`npm-publish.yml:6-8`, `types: [published]`). Publishing is therefore release-driven: cutting a release is what puts a version on npm.
- Job `build` (`:11-19`) runs on `ubuntu-latest` with `actions/checkout@v5` and `actions/setup-node@v4` pinned to `node-version: 20`, then `npm ci` (`:18`) and `npm test` (`:19`).
- Job `publish-npm` (`:21-36`) declares `needs: build` (`:22`) and `permissions: contents: read, id-token: write` (`:24-26`); the `id-token` grant is what `--provenance` requires. It sets `registry-url: https://registry.npmjs.org/` (`:32`) and runs `npm publish --provenance --access public` (`:34`) with `NODE_AUTH_TOKEN` fed from `secrets.NPM_TOKEN` (`:35-36`).
- CI never runs `npm run build` explicitly: the build happens inside `npm publish` via `prepublishOnly` (`package.json:27`, `npm run build && npm test`). The artifact on npm is compiled in the publish job, not in the `build` job.
- `npm ci` in both jobs fires the `postinstall` hook (`package.json:31`), so the Linux runner executes `scripts/download-es.js` and downloads a Windows `es.exe` it will never use. It succeeds today because the voidtools/ES latest release does publish an `x64` asset (verified live against tag `1.1.0.38`), but a GitHub API rate limit or outage makes `download-es.js:203-208` call `process.exit(1)` and hard-fails `npm ci`, hence the whole release. Defect: CI has no protection against that.
- Runner Node is 20 (`:17`, `:31`) while `package.json:69-71` only requires `>=18`; there is no version matrix, no coverage gate, and no other file under `.github/`.
- Defect: `PUBLISHING.md:225` documents a workflow named `publish.yml` triggered by `push: tags: v*` on `windows-latest`. That file does not exist; this workflow is the live contract.

## Work Guidance

## Verification
- Nothing validates this folder locally: the workflow only executes on a published release, and neither `actionlint` nor GitHub's `act` is configured or installed here.
- The closest local equivalents of what CI does are `npm ci` followed by `npm test` (`package.json:28`) and `npm pack --dry-run` for the published file list.
- A real end-to-end verification of this file requires cutting a prerelease, which is a release action and needs explicit user approval.

## Child DOX Index
(none)
