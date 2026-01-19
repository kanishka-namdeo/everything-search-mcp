import { describe, it, expect, beforeEach } from 'vitest';
import {
  sanitizeShellArg,
  validateSearchQuery,
  validatePath,
  validateSearchOptions,
  ValidationError,
  SecurityConfig,
} from '../src/utils/validation.js';

describe('Security Validation', () => {
  describe('sanitizeShellArg', () => {
    it('should remove shell metacharacters', () => {
      expect(sanitizeShellArg('test; rm -rf /')).toBe('test rm -rf /');
      expect(sanitizeShellArg('test && evil')).toBe('test  evil');
      expect(sanitizeShellArg('test$(evil)')).toBe('testevil');
      const backtickTest = 'test`evil`';
      expect(sanitizeShellArg(backtickTest)).toBe('testevil');
    });

    it('should remove pipe characters', () => {
      expect(sanitizeShellArg('test|evil')).toBe('testevil');
    });

    it('should remove path traversal attempts', () => {
      expect(sanitizeShellArg('../etc/passwd')).toBe('etc/passwd');
      expect(sanitizeShellArg('..\\..\\windows')).toBe('windows');
      expect(sanitizeShellArg('~/secret')).toBe('secret');
    });

    it('should normalize path separators', () => {
      expect(sanitizeShellArg('C:\\Users\\file')).toBe('C:/Users/file');
    });

    it('should throw error for non-string input', () => {
      expect(() => sanitizeShellArg(123 as any)).toThrow(ValidationError);
      expect(() => sanitizeShellArg(null as any)).toThrow(ValidationError);
    });

    it('should trim whitespace', () => {
      expect(sanitizeShellArg('  test  ')).toBe('test');
    });
  });

  describe('validateSearchQuery', () => {
    it('should accept valid query', () => {
      expect(() => validateSearchQuery('*.txt')).not.toThrow();
      expect(() => validateSearchQuery('document')).not.toThrow();
    });

    it('should throw error for empty query', () => {
      expect(() => validateSearchQuery('')).toThrow(ValidationError);
      expect(() => validateSearchQuery('   ')).toThrow(ValidationError);
    });

    it('should throw error for null query', () => {
      expect(() => validateSearchQuery(null as any)).toThrow(ValidationError);
    });

    it('should throw error for too long query', () => {
      const longQuery = 'a'.repeat(SecurityConfig.MAX_QUERY_LENGTH + 1);
      expect(() => validateSearchQuery(longQuery)).toThrow(ValidationError);
    });

    it('should accept query at max length', () => {
      const maxQuery = 'a'.repeat(SecurityConfig.MAX_QUERY_LENGTH);
      expect(() => validateSearchQuery(maxQuery)).not.toThrow();
    });
  });

  describe('validatePath', () => {
    it('should accept valid path', () => {
      expect(() => validatePath('/Users/test/file.txt')).not.toThrow();
      expect(() => validatePath('C:\\Users\\test')).not.toThrow();
    });

    it('should throw error for empty path', () => {
      expect(() => validatePath('')).toThrow(ValidationError);
      expect(() => validatePath('   ')).toThrow(ValidationError);
    });

    it('should throw error for null path', () => {
      expect(() => validatePath(null as any)).toThrow(ValidationError);
    });

    it('should detect path traversal', () => {
      expect(() => validatePath('../../../etc/passwd')).toThrow(ValidationError);
      expect(() => validatePath('..\\..\\windows\\system32')).toThrow(ValidationError);
    });

    it('should reject shell metacharacters', () => {
      expect(() => validatePath('test;rm')).toThrow(ValidationError);
      expect(() => validatePath('test && evil')).toThrow(ValidationError);
    });

    it('should throw error for too long path', () => {
      const longPath = 'a'.repeat(SecurityConfig.MAX_PATH_LENGTH + 1);
      expect(() => validatePath(longPath)).toThrow(ValidationError);
    });
  });

  describe('validateSearchOptions', () => {
    it('should accept valid options', () => {
      expect(() => validateSearchOptions({
        query: 'test',
        maxResults: 10,
        offset: 0,
      })).not.toThrow();
    });

    it('should use defaults for optional parameters', () => {
      const result = validateSearchOptions({ query: 'test' });
      expect(result.maxResults).toBe(100);
      expect(result.offset).toBe(0);
    });

    it('should throw error for invalid maxResults', () => {
      expect(() => validateSearchOptions({ query: 'test', maxResults: 0 })).toThrow(ValidationError);
      expect(() => validateSearchOptions({ query: 'test', maxResults: -1 })).toThrow(ValidationError);
      expect(() => validateSearchOptions({ query: 'test', maxResults: SecurityConfig.MAX_RESULTS + 1 })).toThrow(ValidationError);
    });

    it('should throw error for invalid offset', () => {
      expect(() => validateSearchOptions({ query: 'test', offset: -1 })).toThrow(ValidationError);
      expect(() => validateSearchOptions({ query: 'test', offset: SecurityConfig.MAX_OFFSET + 1 })).toThrow(ValidationError);
    });

    it('should throw error for invalid query', () => {
      expect(() => validateSearchOptions({} as any)).toThrow(ValidationError);
    });
  });
});
