import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  parseSearchFilesArgs,
  parseGetFileInfoArgs,
  toolArgumentSchemas,
} from '../src/tool-args.js';
import { ValidationError } from '../src/utils/validation.js';

function parseFailure(tool: 'search_files' | 'get_file_info', args: unknown): ValidationError {
  try {
    if (tool === 'search_files') {
      parseSearchFilesArgs(args);
    } else {
      parseGetFileInfoArgs(args);
    }
  } catch (error) {
    return error as ValidationError;
  }
  throw new Error(`Expected ${tool} argument parsing to fail`);
}

describe('search_files argument gate accepts what the server already accepted', () => {
  it('accepts a minimal query-only call', () => {
    expect(parseSearchFilesArgs({ query: 'report.pdf' })).toEqual({ query: 'report.pdf' });
  });

  it('accepts every declared option with in-range values', () => {
    const args = {
      query: 'test',
      maxResults: 50,
      offset: 10,
      sortBy: 'size',
      sortOrder: 'descending',
      matchPath: true,
      matchCase: false,
      matchWholeWord: true,
      regex: false,
    };
    expect(parseSearchFilesArgs(args)).toEqual(args);
  });

  it('leaves blank-string guards to the handler', () => {
    expect(parseSearchFilesArgs({ query: '   ' })).toEqual({ query: '   ' });
    expect(parseSearchFilesArgs({ query: '' })).toEqual({ query: '' });
  });

  it('is not strict: unknown keys are stripped, not rejected', () => {
    const parsed = parseSearchFilesArgs({ query: 'a', zzz: 1, another: 'x' });
    expect(parsed).toEqual({ query: 'a' });
  });

  it('accepts a missing args object as an empty argument set failure path', () => {
    const error = parseFailure('search_files', undefined);
    expect(error.code).toBe('INVALID_ARGUMENTS');
  });
});

describe('search_files numeric arguments are coerced, not bounded', () => {
  it('coerces numeric strings, matching Math.min/slice coercion downstream', () => {
    expect(parseSearchFilesArgs({ query: 'a', maxResults: '50', offset: '10' })).toEqual({
      query: 'a',
      maxResults: 50,
      offset: 10,
    });
  });

  it('passes null through so the handler ?? defaults still apply', () => {
    expect(parseSearchFilesArgs({ query: 'a', maxResults: null, offset: null })).toEqual({
      query: 'a',
      maxResults: null,
      offset: null,
    });
  });

  it('does not clamp or reject out-of-range numbers', () => {
    expect(parseSearchFilesArgs({ query: 'a', maxResults: 0 }).maxResults).toBe(0);
    expect(parseSearchFilesArgs({ query: 'a', maxResults: 5000 }).maxResults).toBe(5000);
    expect(parseSearchFilesArgs({ query: 'a', maxResults: -1 }).maxResults).toBe(-1);
    expect(parseSearchFilesArgs({ query: 'a', offset: 200000 }).offset).toBe(200000);
    expect(parseSearchFilesArgs({ query: 'a', offset: -1 }).offset).toBe(-1);
  });

  it('coerces other truthy values the same way JS coercion did', () => {
    expect(parseSearchFilesArgs({ query: 'a', maxResults: true }).maxResults).toBe(1);
    expect(parseSearchFilesArgs({ query: 'a', maxResults: [] }).maxResults).toBe(0);
    expect(parseSearchFilesArgs({ query: 'a', maxResults: '' }).maxResults).toBe(0);
  });

  it('rejects a non-numeric maxResults that previously reached es.exe as NaN', () => {
    const error = parseFailure('search_files', { query: 'a', maxResults: 'abc' });
    expect(error.name).toBe('ValidationError');
    expect(error.code).toBe('INVALID_ARGUMENTS');
    expect(error.statusCode).toBe(400);
    expect(error.message).toContain('maxResults');
  });
});

describe('search_files non-numeric arguments pass through ungated', () => {
  it('does not enum-gate sortBy, keeping the adapter sort fallback', () => {
    expect(parseSearchFilesArgs({ query: 'a', sortBy: 'garbage' }).sortBy).toBe('garbage');
    expect(parseSearchFilesArgs({ query: 'a', sortBy: 7 }).sortBy).toBe(7);
  });

  it('does not enum-gate sortOrder, keeping the === descending test', () => {
    expect(parseSearchFilesArgs({ query: 'a', sortOrder: 'asc' }).sortOrder).toBe('asc');
  });

  it('does not boolean-gate the flags, keeping truthiness behavior', () => {
    expect(parseSearchFilesArgs({ query: 'a', matchCase: 'false' }).matchCase).toBe('false');
    expect(parseSearchFilesArgs({ query: 'a', regex: 1 }).regex).toBe(1);
  });
});

describe('search_files query type gate', () => {
  it.each([[123], [true], [{}], [['a']], [null]])('rejects non-string query %p', query => {
    const error = parseFailure('search_files', { query });
    expect(error.code).toBe('INVALID_ARGUMENTS');
    expect(error.message).toContain('query');
  });

  it('rejects a missing query', () => {
    expect(parseFailure('search_files', { maxResults: 10 }).message).toContain('query');
  });

  it('names every offending argument in one message', () => {
    const message = parseFailure('search_files', { query: 1, maxResults: 'abc' }).message;
    expect(message).toContain('query');
    expect(message).toContain('maxResults');
  });
});

describe('get_file_info path argument gate', () => {
  it('accepts any string, leaving security rules to validatePath', () => {
    expect(parseGetFileInfoArgs({ path: 'C:/temp/a.txt' })).toEqual({ path: 'C:/temp/a.txt' });
    expect(parseGetFileInfoArgs({ path: 'a/../b' })).toEqual({ path: 'a/../b' });
    expect(parseGetFileInfoArgs({ path: '' })).toEqual({ path: '' });
  });

  it('strips unknown keys', () => {
    expect(parseGetFileInfoArgs({ path: 'a', extra: 1 })).toEqual({ path: 'a' });
  });

  it.each([[123], [null], [{}], [['a']]])('rejects non-string path %p', path => {
    const error = parseFailure('get_file_info', { path });
    expect(error.code).toBe('INVALID_ARGUMENTS');
    expect(error.message).toContain('path');
  });

  it('rejects a missing path', () => {
    expect(parseFailure('get_file_info', {}).message).toContain('path');
  });
});

describe('gate permissiveness is deliberate: each rule is discriminating', () => {
  const base = toolArgumentSchemas.search_files;

  it('rejecting a non-string query depends on z.string(), not on stripping', () => {
    expect(base.safeParse({ query: 123 }).success).toBe(false);
    expect(base.extend({ query: z.unknown() }).safeParse({ query: 123 }).success).toBe(true);
  });

  it('accepting unknown keys depends on the schema not being strict', () => {
    expect(base.safeParse({ query: 'a', zzz: 1 }).success).toBe(true);
    expect(base.strict().safeParse({ query: 'a', zzz: 1 }).success).toBe(false);
  });

  it('keeping null as null depends on .nullable(), which preserves the ?? default downstream', () => {
    expect(base.safeParse({ query: 'a', maxResults: null }).data?.maxResults).toBe(null);
    expect(
      base.extend({ maxResults: z.coerce.number().optional() }).safeParse({ query: 'a', maxResults: null }).data?.maxResults
    ).toBe(0);
  });

  it('accepting a numeric string depends on coercion', () => {
    expect(base.safeParse({ query: 'a', maxResults: '50' }).success).toBe(true);
    expect(
      base.extend({ maxResults: z.number().nullable().optional() }).safeParse({ query: 'a', maxResults: '50' }).success
    ).toBe(false);
  });

  it('accepting an out-of-enum sortBy depends on not enum-gating it', () => {
    expect(base.safeParse({ query: 'a', sortBy: 'garbage' }).success).toBe(true);
    expect(
      base
        .extend({ sortBy: z.enum(['name', 'path', 'size', 'extension', 'date_modified', 'date_created', 'attributes', 'run_count']).optional() })
        .safeParse({ query: 'a', sortBy: 'garbage' }).success
    ).toBe(false);
  });

  it('accepting a string flag depends on not boolean-gating it', () => {
    expect(base.safeParse({ query: 'a', matchCase: 'false' }).success).toBe(true);
    expect(base.extend({ matchCase: z.boolean().optional() }).safeParse({ query: 'a', matchCase: 'false' }).success).toBe(
      false,
    );
  });

  it('the failure helper itself fails when parsing succeeds', () => {
    expect(() => parseFailure('search_files', { query: 'fine' })).toThrow(
      /Expected search_files argument parsing to fail/,
    );
    expect(() => parseFailure('get_file_info', { path: 'fine' })).toThrow(
      /Expected get_file_info argument parsing to fail/,
    );
  });
});

describe('tool argument schemas mirror the published tool surface', () => {
  it('exposes a gate for the two argument-bearing tools only', () => {
    expect(Object.keys(toolArgumentSchemas)).toEqual(['search_files', 'get_file_info']);
  });

  it('covers exactly the search_files properties declared in src/index.ts', () => {
    expect(Object.keys(toolArgumentSchemas.search_files.shape)).toEqual([
      'query',
      'maxResults',
      'offset',
      'sortBy',
      'sortOrder',
      'matchPath',
      'matchCase',
      'matchWholeWord',
      'regex',
    ]);
  });

  it('covers exactly the get_file_info properties declared in src/index.ts', () => {
    expect(Object.keys(toolArgumentSchemas.get_file_info.shape)).toEqual(['path']);
  });
});
