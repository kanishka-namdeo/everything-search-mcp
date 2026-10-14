# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Tool argument validation with zod 4 (`src/tool-args.ts`): a missing or non-string `query` for `search_files`, a missing or non-string `path` for `get_file_info`, or `maxResults`/`offset` sent as non-numeric strings are rejected with `errorCode: "INVALID_ARGUMENTS"` inside the existing failure envelope; no schema or envelope shape changed
- `tests/tool-args.test.ts` (37 tests) covering the gate's accept/reject matrix

### Changed

#### Dependencies

- `@modelcontextprotocol/sdk` to `^1.32.1`
- `zod` to `^4.6.7`
- `adm-zip` to `^0.6.1` (`package.json:60`) — `extractEntryTo` gained two extra optional trailing parameters, so all `scripts/download-es.js` call sites are unchanged
- `@types/node` to `^26.6.5`
- `tsx` to `^4.23.15`
- `typescript` to `^7.0.2` (the native Go compiler); `npm run build` is still `tsc`
- `vitest` to `^5.0.4`

#### Build and CI

- `engines.node` raised to `>=20.0.0` (`package.json:70`, previously `>=18.0.0`)
- CI moved to Node 24 with `actions/checkout@v7`, `actions/setup-node@v7` and `cache: npm`; vitest 5.0.4 engines are `^22.12.0 || ^24.0.0 || >=26.0.0`, so the previous Node 20 pin could not run `npm test`
- Automated suite is now 3 files / 81 tests, passing

#### Behavior preserved

- Inputs that are loose but valid are still accepted by design: numeric strings such as `"50"` are coerced, out-of-range numbers like `0` or `5000` are still clamped by the platform adapters, `null` still falls back to the documented defaults (100 results, offset 0), unrecognized extra keys are ignored, and out-of-enum `sortBy`/`sortOrder` still fall back the way the adapters already did

### Fixed

- Windows `search_files` sorting: `sortOrder: "descending"` emitted a standalone `-descending` switch that the vendored ES 1.1.0.36 rejects (`Error 6: Unknown switch.`), so any descending sort failed. The direction is now encoded in the `-sort` value (e.g. `size-descending`) in `src/platform/windows-cli.ts`

### Security

- `npm audit` now reports 0 vulnerabilities, down from 20 (3 critical, 5 high); the critical finding was a tinypool prototype-pollution RCE pulled in by vitest 2

## [1.0.0] - 2026-01-20

### Added

#### Security
- Comprehensive input validation system
- Command injection protection with shell metacharacter sanitization
- Path traversal detection and blocking
- Resource limits (timeouts, buffer sizes, parameter bounds)
- Secure error handling without information leakage
- Type safety improvements with proper TypeScript types

#### Validation
- `sanitizeShellArg()` function to remove dangerous characters
- `validateSearchQuery()` function with length limits
- `validatePath()` function with traversal detection
- `validateSearchOptions()` function with parameter validation
- `ValidationError` class with error codes

#### Security Limits
- Query length: Maximum 1000 characters
- Path length: Maximum 4096 characters
- maxResults: 1-1000
- offset: 0-100000
- Command timeout: 30 seconds
- Max buffer size: 50MB

#### Testing
- 44 comprehensive automated tests
  - 22 security tests (input validation, sanitization)
  - 22 integration tests (attack scenarios, edge cases)
- Test coverage for all validation functions
- Performance tests for validation efficiency
- Manual testing guide with 10 test scenarios

#### Documentation
- Security documentation (SECURITY.md)
- Test results documentation (TEST_RESULTS.md)
- Manual testing guide (MANUAL_TESTING_GUIDE.md)
- Updated README with security features
- Tool reference with validation limits

### Changed

- All platform implementations use validation before command execution
- Error messages are generic to prevent information leakage
- TypeScript types changed from `any` to proper interfaces
- Command execution uses timeouts to prevent hanging

### Fixed

- Command injection vulnerabilities on all platforms (Windows, macOS, Linux)
- Path traversal vulnerabilities in file operations
- Missing input validation for all parameters
- Unbounded resource consumption
- Type safety issues with `any` types
- Information disclosure in error messages

### Security

#### Vulnerabilities Fixed

1. **Command Injection (CVE-2024-XXXX)**
   - Shell metacharacters removed from all user inputs
   - Prevents execution of arbitrary commands

2. **Path Traversal (CWE-22)**
   - `..` sequences detected and blocked
   - Home directory access (`~`) prevented

3. **Input Validation (CWE-20)**
   - All inputs validated for type, length, and format
   - Prevents malformed input attacks

4. **Resource Exhaustion (CWE-400)**
   - Command timeouts prevent infinite loops
   - Buffer limits prevent memory exhaustion
   - Parameter bounds prevent DoS

5. **Information Disclosure (CWE-200)**
   - Error messages are generic
   - No system details leaked to users

### Platform-Specific Changes

#### Windows (es.exe)
- Added validation to all search parameters
- Shell argument sanitization before command execution
- Timeout and buffer limits applied

#### macOS (mdfind)
- Added validation to search queries
- Shell argument sanitization
- Timeout and buffer limits applied

#### Linux (ripgrep/locate)
- Added validation to search patterns
- Shell argument sanitization
- Timeout and buffer limits applied

### Dependencies

- Added `vitest` for testing framework
- No other new dependencies (security-focused, minimal dependencies)

### Performance

- Validation functions complete in <100ms for 1000 iterations
- No measurable performance impact from security measures
- All tests complete in ~650ms

### Fixed

- Command injection vulnerabilities on all platforms (Windows, macOS, Linux)
- Path traversal vulnerabilities in file operations
- Missing input validation for all parameters
- Unbounded resource consumption
- Type safety issues with `any` types
- Information disclosure in error messages

---

### Legend

- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security-related changes

### Versioning

- **Major (X.0.0)**: Incompatible API changes
- **Minor (x.Y.0)**: Backwards-compatible functionality
- **Patch (x.y.Z)**: Backwards-compatible bug fixes

### Security Release Process

Security releases follow this process:
1. Vulnerability discovered and reported
2. Fix developed and tested
3. Security advisory prepared
4. Release published with version bump
5. Users notified to upgrade

### Related Documentation

- [SECURITY.md](SECURITY.md) - Security policy and implementation
- [TEST_RESULTS.md](TEST_RESULTS.md) - Automated test results
- [MANUAL_TESTING_GUIDE.md](MANUAL_TESTING_GUIDE.md) - Manual testing procedures
- [README.md](README.md) - Usage and configuration
