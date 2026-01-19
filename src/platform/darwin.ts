import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import type { SearchResult, SearchOptions, FileInfo, PlatformStatus } from '../types/index.js';
import { sanitizeShellArg, validateSearchQuery, validatePath, SecurityConfig } from '../utils/validation.js';

const execPromise = promisify(exec);

export async function searchFiles(options: SearchOptions): Promise<SearchResult[]> {
  try {
    validateSearchQuery(options.query);
    const sanitizedQuery = sanitizeShellArg(options.query);
    const maxResults = Math.min(options.maxResults ?? 100, SecurityConfig.MAX_RESULTS);
    
    let query = sanitizedQuery;
    
    if (options.matchCase) {
      query = `"${sanitizedQuery}"`;
    }
    
    if (options.matchWholeWord) {
      query = `name:"${sanitizedQuery}"`;
    }
    
    if (options.regex) {
      query = `regex:${sanitizedQuery}`;
    }
    
    if (options.matchPath) {
      query = `in:* ${sanitizedQuery}`;
    }
    
    let args: string[];
    
    if (options.query.includes('kind:')) {
      args = [query];
    } else {
      args = ['-name', query];
    }
    
    const { stdout } = await execPromise(`mdfind ${args.join(' ')}`, { 
      maxBuffer: SecurityConfig.MAX_BUFFER_SIZE,
      timeout: SecurityConfig.COMMAND_TIMEOUT,
    });
    
    const stdoutStr = typeof stdout === 'string' ? stdout : '';
    const lines = stdoutStr.trim().split('\n').filter((line: string) => line.length > 0);
    
    let results = lines.map((line: string) => {
      const parts = line.split('/');
      const name = parts[parts.length - 1] || '';
      const path = parts.slice(0, -1).join('/') || '';
      
      return {
        name,
        path,
        fullPath: line,
        isFile: !line.endsWith('/'),
        isFolder: line.endsWith('/'),
      };
    });
    
    if (options.offset) {
      results = results.slice(options.offset);
    }
    
    if (maxResults > 0) {
      results = results.slice(0, maxResults);
    }
    
    return results;
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      throw error;
    }
    if (error.name === 'ETIMEDOUT') {
      throw new Error('Search operation timed out. Please try a narrower query.');
    }
    throw new Error(`Search failed: ${error.message}`);
  }
}

export async function getFileInfo(path: string): Promise<FileInfo> {
  try {
    validatePath(path);
    const sanitizedPath = sanitizeShellArg(path);
    
    const { stdout } = await execPromise(`stat -f "%N %z %SB %Sm %Sc" "${sanitizedPath}"`, {
      maxBuffer: SecurityConfig.MAX_BUFFER_SIZE,
      timeout: SecurityConfig.COMMAND_TIMEOUT,
    });
    
    const parts = (typeof stdout === 'string' ? stdout : '').trim().split('\n');
    
    if (parts.length < 2) {
      throw new Error(`File not found or inaccessible: ${path}`);
    }
    
    const name = parts[0];
    const isDirectory = parts[1] === '1';
    const size = parseInt(parts[2], 10);
    const modified = parseInt(parts[3], 10);
    
    const info: FileInfo = {
      path,
      name,
      size,
      modified: new Date(modified * 1000),
      isFile: !isDirectory,
      isFolder: isDirectory,
    };
    
    return info;
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      throw error;
    }
    throw new Error(`Failed to get file info: ${error.message}`);
  }
}

export async function getStatus(): Promise<PlatformStatus> {
  try {
    await execPromise('which mdfind', { maxBuffer: 1024 });
    
    return {
      platform: 'darwin',
      searchEngine: 'mdfind (Spotlight)',
      available: true,
      message: 'macOS Spotlight search available',
    };
  } catch (error: any) {
    return {
      platform: 'darwin',
      searchEngine: 'mdfind (Spotlight)',
      available: false,
      message: 'mdfind command not found. Spotlight should be built into macOS.',
    };
  }
}
