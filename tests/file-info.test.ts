import { describe, it, expect } from 'vitest';
import { getFileInfoFs } from '../src/platform/file-info.js';
import { SecurityConfig } from '../src/utils/validation.js';

// Host-agnostic: `fs.stat` + `validatePath` behave identically on Windows/macOS/Linux,
// and `./package.json` / `./src` exist at the vitest CWD (repo root) on every CI runner.
const REPO_FILE = './package.json';
const REPO_DIR = './src';
const MISSING = './definitely-not-present-xyz';

describe('getFileInfoFs (shared fs helper)', () => {
  it('resolves real file metadata', async () => {
    const info = await getFileInfoFs(REPO_FILE);
    expect(info.name).toBe('package.json');
    expect(info.path).toBe('.');
    expect(info.size).toBeGreaterThan(0);
    expect(info.extension).toBe('json');
    expect(info.isFile).toBe(true);
    expect(info.isFolder).toBe(false);
    expect(info.attributes).toBeUndefined();
  });

  it('resolves real folder metadata', async () => {
    const info = await getFileInfoFs(REPO_DIR);
    expect(info.name).toBe('src');
    expect(info.isFile).toBe(false);
    expect(info.isFolder).toBe(true);
    expect(info.extension).toBeUndefined();
  });

  it('rejects a missing path', async () => {
    await expect(getFileInfoFs(MISSING)).rejects.toThrow('File not found');
  });

  it.each([
    ['PATH_TRAVERSAL', '../etc/passwd'],
    ['HOME_PATH_NOT_ALLOWED', '~/secret'],
    ['INVALID_CHARACTERS', 'test;rm'],
    ['EMPTY_PATH', ''],
  ] as const)('surfaces validation code %s', async (code, p) => {
    await expect(getFileInfoFs(p)).rejects.toMatchObject({
      name: 'ValidationError',
      code,
    });
  });

  it('rejects an over-long path', async () => {
    await expect(getFileInfoFs('a'.repeat(SecurityConfig.MAX_PATH_LENGTH + 1)))
      .rejects.toMatchObject({ code: 'PATH_TOO_LONG' });
  });
});
