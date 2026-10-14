# assets/ — README visual assets and their reproducible generators

DOX local contract for `assets/`. Parent: [`AGENTS.md`](../AGENTS.md). Closer doc wins on local detail; nothing here may weaken DOX.

## Purpose
- Holds every image the README renders: the social-preview banner, the theme-paired architecture diagram, and the animated terminal demo, plus the scripts that regenerate them.
- Repo-presentation only: nothing in `src/`, `dist/` or the npm tarball (`package.json:16-22` whitelist has no `assets` entry) reads or ships these files.

## Ownership
- This subtree owns: `social-preview.png`, `architecture.svg`, `architecture-dark.png`, `architecture-light.png`, `demo.gif`, `generate-demo.mjs`, `demo-session.json`.
- Not owned here: where and how the images are embedded (root `README.md`), the tool behavior the demo shows (`src/AGENTS.md`), and the GitHub repo's social-preview setting (a repo setting, not a file).

## Local Contracts
- README references all images by absolute `https://raw.githubusercontent.com/kanishka-namdeo/everything-search-mcp/main/assets/<file>` URLs, not relative paths, so the same README renders on GitHub and on npmjs.com without adding `assets/` to the package `files` whitelist.
- Theme pairing uses the `<picture>` + `<source media="(prefers-color-scheme: light)">` form (light via `source`, dark as the fallback `img src`), which degrades to the dark image on renderers that strip `picture`.
- `demo.gif` content is a genuine JSON-RPC session captured 2026-10-14 against `node dist/index.js` on Windows with the vendored `es.exe` 1.1.0.36; the five response payloads in `demo-session.json` are byte-identical to `response.result.content[0].text` of that recording (provenance note inside the JSON). Do not edit displayed output by hand — re-record instead.
- `architecture.svg` is the editable dark-theme source; both PNGs are 1200x640 rasterizations (the light one via a color-map pass), and `social-preview.png` is exactly 1280x640, under 1 MB, per GitHub's social-preview limits.
- The diagram's claims must track `src/`: three tools + zod gate + validation in front of per-OS CLIs, with `get_file_info` shown on a separate shell-free path to `src/platform/file-info.ts`.

## Work Guidance
- Regenerate rasterized frames and the GIF with `node assets/generate-demo.mjs` (writes frame SVGs/PNGs to a temp dir, then `magick` + `ffmpeg` compose `demo.gif`). Rasterize frames with the `PNG24:` prefix — ffmpeg 8.1.1's `palettegen` fails on ImageMagick's default `pal8` PNG output.
- Toolchain assumptions: ImageMagick 7 (`magick`), `ffmpeg`, Node >= 20, and the `Cascadia Mono` / `Segoe UI` fonts.
- Never fabricate or prettify demo output; a re-recorded session must come from the built artifact (`dist/index.js`), and long JSON lines are fitted by shrinking font, not truncating text.

## Verification
- No automated check covers this folder. Manual: `magick identify assets/*.png assets/*.gif` (expect 1200x640 diagram pair, 1280x640 social preview, 960x620 122-frame GIF under 1 MB) and eyeball the rendered PNGs plus a mid/late GIF frame extracted with ffmpeg (ImageMagick's delta-frame GIF extraction renders garbage; ffmpeg decodes correctly).

## Child DOX Index
(none)
