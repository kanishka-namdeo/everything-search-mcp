export class ValidationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const SecurityConfig = {
  MAX_QUERY_LENGTH: 1000,
  MAX_RESULTS: 1000,
  MAX_OFFSET: 100000,
  MAX_PATH_LENGTH: 4096,
  COMMAND_TIMEOUT: 30000,
  MAX_BUFFER_SIZE: 50 * 1024 * 1024,
};

export function sanitizeShellArg(arg: string): string {
  if (typeof arg !== 'string') {
    throw new ValidationError('Argument must be a string', 'INVALID_TYPE');
  }

  const sanitized = arg
    .replace(/[;&|$`()]/g, '')
    .replace(/\.\./g, '')
    .replace(/\\/g, '/')
    .replace(/~/g, '')
    .replace(/\/+/g, '/')
    .replace(/^\//, '');

  return sanitized.trim();
}

export function validateSearchQuery(query: string): void {
  if (typeof query !== 'string') {
    throw new ValidationError('Query must be a string', 'INVALID_TYPE');
  }

  if (!query) {
    throw new ValidationError('Query cannot be empty', 'EMPTY_QUERY');
  }

  const trimmedQuery = query.trim();
  
  if (trimmedQuery.length === 0) {
    throw new ValidationError('Query cannot be empty', 'EMPTY_QUERY');
  }

  if (trimmedQuery.length > SecurityConfig.MAX_QUERY_LENGTH) {
    throw new ValidationError(
      `Query exceeds maximum length of ${SecurityConfig.MAX_QUERY_LENGTH} characters`,
      'QUERY_TOO_LONG'
    );
  }
}

export function validatePath(path: string): void {
  if (typeof path !== 'string') {
    throw new ValidationError('Path must be a string', 'INVALID_TYPE');
  }

  if (!path) {
    throw new ValidationError('Path cannot be empty', 'EMPTY_PATH');
  }

  const trimmedPath = path.trim();
  
  if (trimmedPath.length === 0) {
    throw new ValidationError('Path cannot be empty', 'EMPTY_PATH');
  }

  if (trimmedPath.length > SecurityConfig.MAX_PATH_LENGTH) {
    throw new ValidationError(
      `Path exceeds maximum length of ${SecurityConfig.MAX_PATH_LENGTH} characters`,
      'PATH_TOO_LONG'
    );
  }

  if (trimmedPath.includes('..')) {
    throw new ValidationError('Path traversal detected', 'PATH_TRAVERSAL');
  }

  if (trimmedPath.startsWith('~')) {
    throw new ValidationError('Home directory paths are not allowed', 'HOME_PATH_NOT_ALLOWED');
  }

  if (/[;&|`$()]/.test(trimmedPath)) {
    throw new ValidationError('Invalid characters in path', 'INVALID_CHARACTERS');
  }
}

export function validateSearchOptions(options: {
  query?: string;
  maxResults?: number;
  offset?: number;
}): { query: string; maxResults: number; offset: number } {
  const query = options.query?.trim() || '';
  validateSearchQuery(query);

  const maxResults = options.maxResults ?? 100;
  if (typeof maxResults !== 'number' || maxResults < 1 || maxResults > SecurityConfig.MAX_RESULTS) {
    throw new ValidationError(
      `maxResults must be between 1 and ${SecurityConfig.MAX_RESULTS}`,
      'INVALID_MAX_RESULTS'
    );
  }

  const offset = options.offset ?? 0;
  if (typeof offset !== 'number' || offset < 0 || offset > SecurityConfig.MAX_OFFSET) {
    throw new ValidationError(
      `offset must be between 0 and ${SecurityConfig.MAX_OFFSET}`,
      'INVALID_OFFSET'
    );
  }

  return { query, maxResults, offset };
}
