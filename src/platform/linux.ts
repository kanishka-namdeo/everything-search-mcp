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
    
    let useRipgrep = false;
    
    try {
      await execPromise('which ripgrep', { maxBuffer: 1024 });
      useRipgrep = true;
    } catch {
      useRipgrep = false;
    }
    
    let args: string[];
    
    if (useRipgrep) {
      args = ['--files', '--no-heading', '--no-line-number', '--color', 'never'];
      
      if (options.matchCase) {
        args.push('--case-sensitive');
      } else {
        args.push('--ignore-case');
      }
      
      if (options.regex) {
        args.push('--regexp');
      } else {
        args.push('--fixed-strings');
      }
      
      args.push(sanitizedQuery, '/');
    } else {
      args = [sanitizedQuery];
      
      if (!options.matchCase) {
        args.unshift('-i');
      }
    }
    
    const command = useRipgrep ? 'rg' : 'locate';
    
    const { stdout } = await execPromise(`${command} ${args.join(' ')}`, { 
      maxBuffer: SecurityConfig.MAX_BUFFER_SIZE,
      timeout: SecurityConfig.COMMAND_TIMEOUT,
    });
    
    const stdoutStr = typeof stdout === 'string' ? stdout : '';
    const lines = stdoutStr.trim().split('\n').filter((line: string) => line.length > 0);
    
    let results = lines.map((line: string) => {
      const normalizedPath = line.replace(/\/+$/, '');
      const parts = normalizedPath.split('/');
      const name = parts[parts.length - 1] || '';
      const path = parts.slice(0, -1).join('/') || '';
      
      return {
        name,
        path,
        fullPath: normalizedPath,
        isFile: !normalizedPath.endsWith('/'),
        isFolder: normalizedPath.endsWith('/'),
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
    
    const { stdout } = await execPromise(`stat -c "%s %n %U %G %Y" "${sanitizedPath}"`, {
      maxBuffer: SecurityConfig.MAX_BUFFER_SIZE,
      timeout: SecurityConfig.COMMAND_TIMEOUT,
    });
    
    const parts = (typeof stdout === 'string' ? stdout : '').trim().split(' ');
    
    if (parts.length < 2) {
      throw new Error(`File not found or inaccessible: ${path}`);
    }
    
    const size = parseInt(parts[0], 10);
    const name = parts[1];
    const modified = parseInt(parts[2], 10);
    
    const info: FileInfo = {
      path,
      name,
      size,
      modified: new Date(modified * 1000),
      isFile: true,
      isFolder: false,
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
  let available = false;
  let searchEngine = 'none';
  let message = '';
  
  try {
    await exec('which ripgrep', { maxBuffer: 1024 });
    available = true;
    searchEngine = 'ripgrep';
    message = 'ripgrep available for fast search';
  } catch {
    try {
      await execPromise('which locate', { maxBuffer: 1024 });
      available = true;
      searchEngine = 'locate';
      message = 'locate available. For better performance, install ripgrep.';
    } catch {
      available = false;
      searchEngine = 'none';
      message = 'Neither ripgrep nor locate found. Please install ripgrep for fast search.';
    }
  }
  
  return {
    platform: 'linux',
    searchEngine,
    available,
    message,
  };
}
