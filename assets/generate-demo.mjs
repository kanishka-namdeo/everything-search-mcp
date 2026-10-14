// generate-demo.mjs — renders assets/demo.gif frame sequence from assets/demo-session.json.
//
// Provenance: every visible output string is verbatim JSON-RPC session data
// captured 2026-10-14 against dist/index.js, Everything es.exe 1.1.0.36
// (see the "provenance" field in demo-session.json; do not edit response text).
//
// Usage (from the repo root; OUT=%TEMP%/esdemo-frames or your own dir):
//   node assets/generate-demo.mjs "$OUT"       # writes frame_NNNN.svg (default dir shown above)
//   magick "$OUT"/'frame_*.svg' -scene 1 "$OUT"/'PNG24:frame_%04d.png'
//     # PNG24 matters: plain magick output is pal8, which ffmpeg's palettegen rejects here
//   ffmpeg -y -framerate 8 -start_number 1 -i "$OUT"/frame_%04d.png -frames:v 1 -update 1 \
//          -vf "palettegen=max_colors=32" "$OUT/palette.png"
//   ffmpeg -y -framerate 8 -start_number 1 -i "$OUT"/frame_%04d.png -i "$OUT/palette.png" \
//          -lavfi "paletteuse=dither=none" -loop 0 assets/demo.gif
//
// The animation is a per-line reveal of the session inside a terminal window:
// each new line adds one frame, section notes hold a few extra frames, and the
// final frame holds ~3 s (24 frames at 8 fps). Older lines scroll off the top,
// terminal-style, once the transcript exceeds the viewport.

import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = process.argv[2] || join(tmpdir, 'esdemo-frames');
const session = JSON.parse(readFileSync(join(here, 'demo-session.json'), 'utf8'));

// ---- layout / style constants -------------------------------------------------
const FS = 12;                 // Cascadia Mono ~0.571em advance -> 122 chars fit 900px
const LINE_H = 18;
const WIN_X = 10, WIN_Y = 10, WIN_W = 940, WIN_H = 600;
const CHROME_H = 40;           // title bar
const CONTENT_X = WIN_X + 20;  // 20px inner padding each side -> 900px text column
const CONTENT_W = WIN_W - 40;
const CONTENT_TOP = WIN_Y + CHROME_H;
const CONTENT_H = WIN_H - CHROME_H;
const PAD_TOP = 14, PAD_BOT = 14;
const VIEW_LINES = Math.floor((CONTENT_H - PAD_TOP - PAD_BOT) / LINE_H); // 29

const COLORS = {
  bg: '#0d1117',
  chrome: '#161b22',
  border: '#30363d',
  title: '#8b949e',
  cmd: '#e6edf3',
  json: '#a5d6ff',
  note: '#8b949e',
};

// ---- build the flat list of display lines ------------------------------------
const lines = [];
const sectionEnd = []; // line index after which we hold extra frames
for (const s of session.sections) {
  lines.push({ kind: 'cmd', text: s.cmd });
  if (s.responseText) {
    for (const l of s.responseText.split('\n')) lines.push({ kind: 'json', text: l });
  }
  lines.push({ kind: 'note', text: s.note });
  sectionEnd.push(lines.length - 1);
}

// ---- frame plan ---------------------------------------------------------------
const HOLD_AFTER_NOTE = 4; // pause between sections
const FINAL_HOLD = 24;     // ~3 s at 8 fps
const counts = new Array(lines.length).fill(1);
for (const i of sectionEnd) counts[i] += HOLD_AFTER_NOTE;
counts[counts.length - 1] += FINAL_HOLD - HOLD_AFTER_NOTE;

const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function renderFrame(visibleCount) {
  const start = Math.max(0, visibleCount - VIEW_LINES);
  const shown = lines.slice(start, visibleCount);
  const textRows = shown
    .map((ln, i) => {
      const y = CONTENT_TOP + PAD_TOP + i * LINE_H + FS;
      const weight = ln.kind === 'cmd' ? ' font-weight="bold"' : '';
      return `<text x="${CONTENT_X}" y="${y}" font-family="Cascadia Mono" font-size="${FS}"${weight} fill="${COLORS[ln.kind]}">${esc(ln.text)}</text>`;
    })
    .join('\n    ');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIN_X + WIN_W + 10}" height="${WIN_Y + WIN_H + 10}" viewBox="0 0 ${WIN_X + WIN_W + 10} ${WIN_Y + WIN_H + 10}">
  <rect width="100%" height="100%" fill="${COLORS.bg}"/>
  <rect x="${WIN_X}" y="${WIN_Y}" width="${WIN_W}" height="${WIN_H}" rx="12" fill="${COLORS.chrome}" stroke="${COLORS.border}"/>
  <path d="M ${WIN_X} ${CONTENT_TOP} h ${WIN_W} v ${WIN_H - CHROME_H - 12} a 12 12 0 0 1 -12 12 h -${WIN_W - 24} a 12 12 0 0 1 -12 -12 z" fill="${COLORS.bg}"/>
  <circle cx="${WIN_X + 24}" cy="${WIN_Y + 20}" r="7" fill="#ff5f56"/>
  <circle cx="${WIN_X + 46}" cy="${WIN_Y + 20}" r="7" fill="#ffbd2e"/>
  <circle cx="${WIN_X + 68}" cy="${WIN_Y + 20}" r="7" fill="#27c93f"/>
  <text x="${WIN_X + WIN_W / 2}" y="${WIN_Y + 25}" font-family="Segoe UI" font-size="14" fill="${COLORS.title}" text-anchor="middle">${esc(session.windowTitle)}</text>
  <g>
    ${textRows}
  </g>
</svg>
`;
}

mkdirSync(outDir, { recursive: true });
let frame = 0;
for (let i = 0; i < lines.length; i++) {
  for (let h = 0; h < counts[i]; h++) {
    frame += 1;
    writeFileSync(join(outDir, `frame_${String(frame).padStart(4, '0')}.svg`), renderFrame(i + 1));
  }
}
console.log(`lines=${lines.length} viewportLines=${VIEW_LINES} frames=${frame} -> ${outDir}`);
