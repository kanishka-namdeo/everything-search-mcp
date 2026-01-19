import { getPlatform, isWindows, isDarwin, isLinux } from '../utils/platform.js';
import { searchFiles as searchWindows } from '../platform/windows-cli.js';
import { searchFiles as searchDarwin } from '../platform/darwin.js';
import { searchFiles as searchLinux } from '../platform/linux.js';
import { getFileInfo as getFileInfoWindows } from '../platform/windows-cli.js';
import { getFileInfo as getFileInfoDarwin } from '../platform/darwin.js';
import { getFileInfo as getFileInfoLinux } from '../platform/linux.js';
import { getStatus as getStatusWindows } from '../platform/windows-cli.js';
import { getStatus as getStatusDarwin } from '../platform/darwin.js';
import { getStatus as getStatusLinux } from '../platform/linux.js';
import type { SearchResult, SearchOptions, FileInfo, PlatformStatus } from '../types/index.js';

export async function searchFilesUnified(options: SearchOptions): Promise<SearchResult[]> {
  if (isWindows()) {
    return await searchWindows(options);
  } else if (isDarwin()) {
    return await searchDarwin(options);
  } else if (isLinux()) {
    return await searchLinux(options);
  } else {
    throw new Error(`Unsupported platform: ${process.platform}`);
  }
}

export async function getFileInfoUnified(path: string): Promise<FileInfo> {
  if (isWindows()) {
    return await getFileInfoWindows(path);
  } else if (isDarwin()) {
    return await getFileInfoDarwin(path);
  } else if (isLinux()) {
    return await getFileInfoLinux(path);
  } else {
    throw new Error(`Unsupported platform: ${process.platform}`);
  }
}

export async function getStatusUnified(): Promise<PlatformStatus> {
  if (isWindows()) {
    return await getStatusWindows();
  } else if (isDarwin()) {
    return await getStatusDarwin();
  } else if (isLinux()) {
    return await getStatusLinux();
  } else {
    return {
      platform: process.platform,
      searchEngine: 'none',
      available: false,
      message: `Unsupported platform: ${process.platform}`,
    };
  }
}

export function getPlatformInfo(): { platform: string; searchEngine: string; isPrimary: boolean } {
  const platform = getPlatform();
  
  if (platform === 'windows') {
    return {
      platform: 'windows',
      searchEngine: 'Everything (es.exe CLI)',
      isPrimary: true,
    };
  } else if (platform === 'darwin') {
    return {
      platform: 'macOS',
      searchEngine: 'Spotlight (mdfind)',
      isPrimary: false,
    };
  } else {
    return {
      platform: 'linux',
      searchEngine: 'ripgrep/locate',
      isPrimary: false,
    };
  }
}
