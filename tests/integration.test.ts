import { describe, it, expect, beforeEach } from 'vitest';
import {
  sanitizeShellArg,
  validateSearchQuery,
  validatePath,
  validateSearchOptions,
  ValidationError,
  SecurityConfig,
} from '../src/utils/validation.js';

describe('Integration Tests', () => {
  describe('Real-World Attack Scenarios', () => {
    it('should block command chaining', () => {
      const attacks = [
        'file.txt; cat /etc/passwd',
        'file.txt && malicious',
        'file.txt || malicious',
        'file.txt | evil',
        'file.txt & evil',
      ];

      attacks.forEach(attack => {
        const sanitized = sanitizeShellArg(attack);
        expect(sanitized).not.toContain(';');
        expect(sanitized).not.toContain('&&');
        expect(sanitized).not.toContain('||');
        expect(sanitized).not.toContain('|');
        expect(sanitized).not.toContain('&');
      });
    });

    it('should block command substitution', () => {
      const attacks = [
        'file$(whoami)',
        'file`whoami`',
        'file$(cat /etc/passwd)',
        'file`cat /etc/passwd`',
      ];

      attacks.forEach(attack => {
        const sanitized = sanitizeShellArg(attack);
        expect(sanitized).not.toContain('$(');
        expect(sanitized).not.toContain('`');
      });
    });

    it('should block path traversal variations', () => {
      const attacks = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32',
        '.../etc/passwd',
        './..//etc/passwd',
        'C:/../../Windows',
        '~/.ssh/id_rsa',
        '....//....',
      ];

      attacks.forEach(attack => {
        expect(() => validatePath(attack)).toThrow(ValidationError);
      });
    });

    it('should prevent DoS via extremely long inputs', () => {
      const tooLongQuery = 'a'.repeat(SecurityConfig.MAX_QUERY_LENGTH + 100);
      const tooLongPath = 'a'.repeat(SecurityConfig.MAX_PATH_LENGTH + 100);
      
      expect(() => validateSearchQuery(tooLongQuery)).toThrow(ValidationError);
      expect(() => validatePath(tooLongPath)).toThrow(ValidationError);
    });

    it('should prevent resource exhaustion via excessive limits', () => {
      expect(() => validateSearchOptions({
        query: 'test',
        maxResults: 1000000,
      })).toThrow(ValidationError);

      expect(() => validateSearchOptions({
        query: 'test',
        offset: 999999999,
      })).toThrow(ValidationError);
    });

    it('should prevent negative or zero limits', () => {
      expect(() => validateSearchOptions({
        query: 'test',
        maxResults: 0,
      })).toThrow(ValidationError);

      expect(() => validateSearchOptions({
        query: 'test',
        maxResults: -10,
      })).toThrow(ValidationError);

      expect(() => validateSearchOptions({
        query: 'test',
        offset: -1,
      })).toThrow(ValidationError);
    });
  });

  describe('Valid Input Acceptance', () => {
    it('should accept common search patterns', () => {
      const validPatterns = [
        '*.txt',
        '*.js',
        'test*.md',
        'file name with spaces',
        'CamelCaseFile',
        'snake_case_file',
        'kebab-case-file',
        '文件名',
        'файл',
        'Datei',
        'test-file-v2.0.1.txt',
        '12345',
        'test[1].txt',
      ];

      validPatterns.forEach(pattern => {
        expect(() => validateSearchQuery(pattern)).not.toThrow();
        const sanitized = sanitizeShellArg(pattern);
        expect(sanitized).toBeTruthy();
      });
    });

    it('should accept valid file paths', () => {
      const validPaths = [
        'C:/Users/test/file.txt',
        '/home/user/documents',
        './relative/path',
        'folder/subfolder/file.txt',
        'C:\\Users\\test\\file.txt',
      ];

      validPaths.forEach(path => {
        expect(() => validatePath(path)).not.toThrow();
      });
    });

    it('should handle Unicode and special characters in queries', () => {
      const unicodeQueries = [
        '测试文件',
        'файл',
        'ファイル',
        'datei',
        'émojîs.txt',
        'test with spaces',
        'test-with-hyphens',
        'test_with_underscores',
        'test.with.dots',
      ];

      unicodeQueries.forEach(query => {
        expect(() => validateSearchQuery(query)).not.toThrow();
        const sanitized = sanitizeShellArg(query);
        expect(sanitized).toBeTruthy();
      });
    });

    it('should accept valid maxResults at boundaries', () => {
      const boundaries = [1, 10, 100, 500, 1000];

      boundaries.forEach(maxResults => {
        expect(() => validateSearchOptions({
          query: 'test',
          maxResults,
        })).not.toThrow();
      });
    });

    it('should accept valid offset at boundaries', () => {
      const boundaries = [0, 1, 10, 100, 100000];

      boundaries.forEach(offset => {
        expect(() => validateSearchOptions({
          query: 'test',
          offset,
        })).not.toThrow();
      });
    });
  });

  describe('Sanitization Quality', () => {
    it('should preserve valid characters while removing dangerous ones', () => {
      const inputs = [
        { input: 'file.txt', expected: 'file.txt' },
        { input: 'file name.txt', expected: 'file name.txt' },
        { input: 'file-name.txt', expected: 'file-name.txt' },
        { input: 'file_name.txt', expected: 'file_name.txt' },
        { input: 'file.name.txt', expected: 'file.name.txt' },
        { input: 'file123.txt', expected: 'file123.txt' },
        { input: 'test[1].txt', expected: 'test[1].txt' },
      ];

      inputs.forEach(({ input, expected }) => {
        const sanitized = sanitizeShellArg(input);
        expect(sanitized).toBe(expected);
      });
    });

    it('should normalize path separators consistently', () => {
      const inputs = [
        'C:\\Users\\test',
        'C:/Users/test',
        'C:/Users\\test',
        'folder\\subfolder',
        'folder/subfolder',
      ];

      inputs.forEach(input => {
        const sanitized = sanitizeShellArg(input);
        expect(sanitized).not.toContain('\\');
      });
    });

    it('should remove leading slashes to prevent absolute path injection', () => {
      const inputs = ['/etc/passwd', '//etc/passwd', '///etc/passwd'];

      inputs.forEach(input => {
        const sanitized = sanitizeShellArg(input);
        expect(sanitized).not.toMatch(/^\//);
      });
    });

    it('should collapse multiple consecutive slashes', () => {
      const inputs = [
        'path///to///file',
        'path//to//file',
        'path/to//file',
      ];

      inputs.forEach(input => {
        const sanitized = sanitizeShellArg(input);
        expect(sanitized).not.toMatch(/\/{2,}/);
      });
    });

    it('should trim whitespace from inputs', () => {
      const inputs = [
        '  file.txt  ',
        '\tfile.txt\t',
        '\nfile.txt\n',
        '  \t\n file.txt \n\t  ',
      ];

      inputs.forEach(input => {
        const sanitized = sanitizeShellArg(input);
        expect(sanitized).toBe('file.txt');
      });
    });
  });

  describe('Error Handling Quality', () => {
    it('should provide descriptive error messages', () => {
      try {
        validateSearchQuery('');
      } catch (error: any) {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.message).toContain('empty');
        expect(error.code).toBe('EMPTY_QUERY');
      }

      try {
        validatePath('');
      } catch (error: any) {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.message).toContain('empty');
        expect(error.code).toBe('EMPTY_PATH');
      }
    });

    it('should include error codes for programmatic handling', () => {
      const errorCases = [
        { fn: () => validateSearchQuery(''), code: 'EMPTY_QUERY' },
        { fn: () => validateSearchQuery('a'.repeat(1001)), code: 'QUERY_TOO_LONG' },
        { fn: () => validatePath(''), code: 'EMPTY_PATH' },
        { fn: () => validatePath('..'), code: 'PATH_TRAVERSAL' },
        { fn: () => validateSearchOptions({ query: 'test', maxResults: 0 }), code: 'INVALID_MAX_RESULTS' },
        { fn: () => validateSearchOptions({ query: 'test', offset: -1 }), code: 'INVALID_OFFSET' },
        { fn: () => validateSearchQuery(null as any), code: 'INVALID_TYPE' },
      ];

      errorCases.forEach(({ fn, code }) => {
        try {
          fn();
          fail(`Expected ValidationError with code ${code}`);
        } catch (error: any) {
          expect(error).toBeInstanceOf(ValidationError);
          expect(error.code).toBe(code);
        }
      });
    });

    it('should handle type errors gracefully', () => {
      const invalidInputs = [
        () => sanitizeShellArg(123 as any),
        () => sanitizeShellArg(null as any),
        () => sanitizeShellArg(undefined as any),
        () => sanitizeShellArg({} as any),
      ];

      invalidInputs.forEach(fn => {
        expect(fn).toThrow(ValidationError);
        try {
          fn();
        } catch (error: any) {
          expect(error.code).toBe('INVALID_TYPE');
        }
      });
    });
  });

  describe('Performance Characteristics', () => {
    it('should handle sanitization efficiently', () => {
      const iterations = 1000;
      const startTime = Date.now();

      for (let i = 0; i < iterations; i++) {
        sanitizeShellArg(`test-file-${i}.txt; evil`);
      }

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(100);
    });

    it('should validate queries efficiently', () => {
      const iterations = 1000;
      const startTime = Date.now();

      for (let i = 0; i < iterations; i++) {
        validateSearchQuery(`query-${i}`);
      }

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(100);
    });

    it('should validate paths efficiently', () => {
      const iterations = 1000;
      const startTime = Date.now();

      for (let i = 0; i < iterations; i++) {
        validatePath(`C:/Users/test/file-${i}.txt`);
      }

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(100);
    });
  });
});
