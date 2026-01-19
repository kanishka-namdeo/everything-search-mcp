# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-01-20

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

## [1.0.0] - Initial Release

### Added

- Everything Search SDK integration for Windows
- Spotlight (mdfind) integration for macOS
- ripgrep and locate support for Linux
- MCP server implementation
- File search with wildcards and operators
- File metadata retrieval
- Platform detection and status checking
- Basic error handling

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
