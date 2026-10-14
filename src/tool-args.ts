import { z } from 'zod';
import { ValidationError } from './utils/validation.js';

// Numeric strings, nulls and out-of-range values stay accepted because the platform
// adapters clamp them (`Math.min(...)`) and `index.ts` applies `?? 100` / `?? 0` defaults.
const SearchFilesArgsSchema = z.object({
  query: z.string(),
  maxResults: z.coerce.number().nullable().optional(),
  offset: z.coerce.number().nullable().optional(),
  sortBy: z.unknown().optional(),
  sortOrder: z.unknown().optional(),
  matchPath: z.unknown().optional(),
  matchCase: z.unknown().optional(),
  matchWholeWord: z.unknown().optional(),
  regex: z.unknown().optional(),
});

const GetFileInfoArgsSchema = z.object({
  path: z.string(),
});

export const toolArgumentSchemas = {
  search_files: SearchFilesArgsSchema,
  get_file_info: GetFileInfoArgsSchema,
};

type AnyArgsSchema = typeof SearchFilesArgsSchema | typeof GetFileInfoArgsSchema;

export type SearchFilesArgs = z.infer<typeof SearchFilesArgsSchema>;
export type GetFileInfoArgs = z.infer<typeof GetFileInfoArgsSchema>;

function parseArgs<S extends AnyArgsSchema>(tool: string, schema: S, args: unknown): z.infer<S> {
  const result = schema.safeParse(args ?? {});

  if (!result.success) {
    throw new ValidationError(
      `Invalid arguments for ${tool}: ${result.error.issues
        .map(issue => issue.path.join('.') || '(root)')
        .join(', ')}`,
      'INVALID_ARGUMENTS'
    );
  }

  return result.data as z.infer<S>;
}

export function parseSearchFilesArgs(args: unknown): SearchFilesArgs {
  return parseArgs('search_files', SearchFilesArgsSchema, args);
}

export function parseGetFileInfoArgs(args: unknown): GetFileInfoArgs {
  return parseArgs('get_file_info', GetFileInfoArgsSchema, args);
}
