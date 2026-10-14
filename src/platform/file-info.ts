import { stat } from 'node:fs/promises';
import { basename, dirname, extname } from 'node:path';
import { validatePath } from '../utils/validation.js';
import type { FileInfo } from '../types/index.js';

// Shared, shell-free getFileInfo used by every platform adapter. `validatePath`
// runs first (outside the try) so its ValidationError — with `.code`/`.statusCode`
// — reaches the MCP envelope un-wrapped; only fs errors are handled below.
export async function getFileInfoFs(path: string): Promise<FileInfo> {
  validatePath(path);

  let stats;
  try {
    stats = await stat(path); // fs.stat follows symlinks
  } catch (error: any) {
    if (error && (error.code === 'ENOENT' || error.code === 'ENOTDIR')) {
      throw new Error(`File not found: ${path}`);
    }
    throw new Error(`Failed to get file info: ${error?.message ?? String(error)}`);
  }

  const name = basename(path);
  const extension = extname(name).replace(/^\./, '');

  return {
    path: dirname(path),
    name,
    size: stats.size,
    created: stats.birthtime,
    modified: stats.mtime,
    accessed: stats.atime,
    extension: extension || undefined,
    isFolder: stats.isDirectory(),
    isFile: stats.isFile(),
    // attributes is intentionally omitted (stays undefined): Node `fs` cannot
    // produce the Windows DIR attribute bitmask; the field is optional.
  };
}
