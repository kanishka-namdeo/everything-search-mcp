import { exec } from 'child_process';
import { promisify } from 'util';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { sanitizeShellArg, validateSearchQuery, validatePath, SecurityConfig } from '../utils/validation.js';
import type { SearchOptions, FileInfo, PlatformStatus } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..', '..');
const esPath = join(rootDir, 'bin', 'es.exe');
const execPromise = promisify(exec);

interface ESOutput {
  fileName: string;
  path?: string;
  fullPath?: string;
  size?: number;
  dateModified?: string;
  dateCreated?: string;
  attributes?: string;
  isFolder?: boolean;
  isFile?: boolean;
}

function parseESOutput(output: string): ESOutput[] {
  const lines = output.trim().split('\n').filter(line => line.trim().length > 0);
  const results: ESOutput[] = [];
  
  for (const line of lines) {
    const parts = line.split('\t');
    if (parts.length >= 1) {
      const result: ESOutput = {
        fileName: parts[0].trim(),
        path: parts[1]?.trim(),
        fullPath: parts[2]?.trim() || parts[0].trim(),
      };
      
      if (parts[3]) {
        result.size = parseInt(parts[3], 10);
      }
      
      if (parts[4]) {
        result.dateModified = parts[4];
      }
      
      if (parts[5]) {
        result.dateCreated = parts[5];
      }
      
      if (parts[6]) {
        result.attributes = parts[6];
      }
      
      results.push(result);
    }
  }
  
  return results;
}

export async function searchFiles(options: SearchOptions): Promise<any[]> {
  try {
    validateSearchQuery(options.query);
    
    const sanitizedQuery = sanitizeShellArg(options.query);
    const maxResults = Math.min(options.maxResults || 100, SecurityConfig.MAX_RESULTS);
    
    const args = ['-n', maxResults.toString()];
    
    if (options.matchPath) {
      args.push('-path', sanitizedQuery);
    } else {
      args.push(sanitizedQuery);
    }
    
    if (options.matchCase) {
      args.push('-case');
    }
    
    if (options.matchWholeWord) {
      args.push('-ww');
    }
    
    if (options.regex) {
      args.push('-regex');
    }
    
    if (options.sortBy) {
      const sortMap: Record<string, string> = {
        name: 'name',
        path: 'path',
        size: 'size',
        date_modified: 'date-modified',
        date_created: 'date-created',
        extension: 'extension',
        attributes: 'attributes',
        run_count: 'run-count',
      };
      const sortParam = sortMap[options.sortBy] || 'name';
      args.push('-sort', sortParam);
      
      if (options.sortOrder === 'descending') {
        args.push('-descending');
      }
    }
    
    const { stdout, stderr } = await execPromise(`"${esPath}" ${args.join(' ')}`, {
      maxBuffer: SecurityConfig.MAX_BUFFER_SIZE,
      windowsHide: true,
      timeout: SecurityConfig.COMMAND_TIMEOUT,
    });
    
    const stderrStr = typeof stderr === 'string' ? stderr : '';
    if (stderrStr.length > 0) {
      if (stderrStr.includes('not found') || stderrStr.includes('no results')) {
        return [];
      }
      throw new Error(`es.exe error: ${stderrStr}`);
    }
    
    const esResults = parseESOutput(stdout);
    
    const results = esResults.map(r => ({
      name: r.fileName,
      path: r.path || '',
      fullPath: r.fullPath || r.fileName,
      size: r.size,
      modified: r.dateModified ? new Date(r.dateModified) : undefined,
      created: r.dateCreated ? new Date(r.dateCreated) : undefined,
      attributes: r.attributes ? parseInt(r.attributes, 10) : undefined,
      extension: r.fileName.includes('.') ? r.fileName.split('.').pop() : undefined,
      isFolder: r.isFolder ?? (r.attributes?.includes('D') ?? false),
      isFile: r.isFile ?? !(r.attributes?.includes('D') ?? true),
    }));
    
    return results;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      throw new Error('es.exe not found. Please run: npm run postinstall to download es.exe');
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
    
    const { stdout, stderr } = await execPromise(`"${esPath}" -n 1 -info "${sanitizedPath}"`, {
      maxBuffer: SecurityConfig.MAX_BUFFER_SIZE,
      windowsHide: true,
    });
    
    const stderrStr = typeof stderr === 'string' ? stderr : '';
    if (stderrStr.length > 0) {
      throw new Error(`es.exe error: ${stderr}`);
    }
    
    const stdoutStr = typeof stdout === 'string' ? stdout : '';
    const esResults = parseESOutput(stdoutStr);
    
    if (esResults.length === 0) {
      throw new Error(`File not found: ${path}`);
    }
    
    const r = esResults[0];
    
    return {
      name: r.fileName,
      path: r.path || '',
      size: r.size,
      created: r.dateCreated ? new Date(r.dateCreated) : undefined,
      modified: r.dateModified ? new Date(r.dateModified) : undefined,
      attributes: r.attributes ? parseInt(r.attributes, 10) : undefined,
      extension: r.fileName.includes('.') ? r.fileName.split('.').pop() : undefined,
      isFolder: r.isFolder ?? (r.attributes?.includes('D') ?? false),
      isFile: r.isFile ?? !(r.attributes?.includes('D') ?? true),
    };
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      throw error;
    }
    if (error.code === 'ENOENT') {
      throw new Error('es.exe not found. Please run: npm run postinstall to download es.exe');
    }
    throw new Error(`Failed to get file info: ${error.message}`);
  }
}

export async function getStatus(): Promise<any> {
  try {
    const { stdout } = await execPromise(`"${esPath}" -version`, {
      maxBuffer: 1024,
      windowsHide: true,
    });
    
    const version = (stdout || '').trim();
    
    return {
      platform: 'windows',
      searchEngine: 'Everything (es.exe CLI)',
      available: true,
      version,
      message: 'Everything command-line interface available',
    };
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return {
        platform: 'windows',
        searchEngine: 'Everything (es.exe CLI)',
        available: false,
        message: 'es.exe not found. Please run: npm run postinstall to download es.exe',
      };
    }
    return {
      platform: 'windows',
      searchEngine: 'Everything (es.exe CLI)',
      available: false,
      message: `Error checking Everything status: ${error.message}`,
    };
  }
}
