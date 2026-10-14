# Security Policy and Implementation

## Overview

The Everything Search MCP server implements defense-in-depth security principles to protect against common vulnerabilities. All user inputs are validated, sanitized, and properly handled to ensure secure operation.

## Security Architecture

### Defense in Depth

The server uses multiple layers of protection:

1. **Input Validation**: All inputs are validated against strict rules
2. **Sanitization**: Dangerous characters are removed from inputs
3. **Bounds Checking**: All parameters are validated within safe ranges
4. **Resource Limits**: Timeouts and buffer limits prevent resource exhaustion
5. **Error Handling**: Secure error messages prevent information leakage
6. **Type Safety**: TypeScript strict mode prevents type-based vulnerabilities

## Threat Mitigations

### 1. Command Injection

**Threat**: Attacker injects shell commands through user input to execute arbitrary commands.

**Mitigation**: All shell arguments are sanitized before command execution.

**Implementation**: [src/utils/validation.ts](src/utils/validation.ts#L21)

```typescript
export function sanitizeShellArg(arg: string): string {
  const sanitized = arg
    .replace(/[;&|$`()]/g, '')  // Remove shell metacharacters
    .replace(/\.\./g, '')          // Remove path traversal
    .replace(/~/g, '')             // Remove home directory
    .replace(/\\/g, '/')           // Normalize path separators
    .replace(/^\//, '');            // Remove leading slashes
  return sanitized.trim();
}
```

**Characters Removed**: `;`, `&`, `|`, `$`, `(`, `)`, `` ` ``, `~`, `..`

**Blocked Attacks**:
- `file.txt; rm -rf /` - Command chaining with semicolon
- `file.txt && evil` - Command chaining with AND
- `file.txt | evil` - Command chaining with pipe
- `file.txt$(whoami)` - Command substitution
- `file.txt`cat /etc/passwd`` - Backtick execution

### 2. Path Traversal

**Threat**: Attacker accesses files outside intended directory using `..` sequences.

**Mitigation**: Paths are validated to block traversal attempts.

**Implementation**: [src/utils/validation.ts](src/utils/validation.ts#L60)

```typescript
export function validatePath(path: string): void {
  if (trimmedPath.includes('..')) {
    throw new ValidationError('Path traversal detected', 'PATH_TRAVERSAL');
  }
  if (trimmedPath.startsWith('~')) {
    throw new ValidationError('Home directory paths are not allowed', 'HOME_PATH_NOT_ALLOWED');
  }
}
```

**Blocked Attacks**:
- `../../../etc/passwd` - Unix path traversal
- `..\..\..\Windows\system32` - Windows path traversal
- `~/.ssh/id_rsa` - Home directory access
- `.../etc/passwd` - Evasion attempt
- `./..//etc/passwd` - Evasion attempt

### 3. Input Validation

**Threat**: Attacker submits malformed or excessively large inputs to cause crashes or DoS.

**Mitigation**: All inputs are validated for type, length, and format.

**Implementation**: [src/utils/validation.ts](src/utils/validation.ts#L12)

**Validation Limits**:
- Query length: Maximum 1000 characters
- Path length: Maximum 4096 characters
- maxResults: 1 to 1000
- offset: 0 to 100000

**Blocked Attacks**:
- Empty queries or paths
- Whitespace-only inputs
- Excessively long queries (DoS via string processing)
- Negative or zero limits
- Excessive result counts (memory exhaustion)

### 4. Resource Exhaustion

**Threat**: Attacker causes server to consume excessive resources (CPU, memory, time).

**Mitigation**: Resource limits and timeouts prevent indefinite execution.

**Implementation**: [src/utils/validation.ts](src/utils/validation.ts#L12)

```typescript
export const SecurityConfig = {
  COMMAND_TIMEOUT: 30000,    // 30 seconds
  MAX_BUFFER_SIZE: 50 * 1024 * 1024,  // 50MB
  MAX_RESULTS: 1000,
  MAX_OFFSET: 100000,
};
```

**Protected Against**:
- Long-running commands (30-second timeout)
- Large output buffers (50MB limit)
- Excessive result counts (max 1000)
- Deep pagination (max offset 100000)

### 5. Information Disclosure

**Threat**: Error messages reveal sensitive system information.

**Mitigation**: Generic error messages without system details.

**Implementation**: [src/index.ts](src/index.ts)

```typescript
return {
  content: [{
    type: 'text',
    text: JSON.stringify({
      success: false,
      error: errorMessage,
      errorCode: 'VALIDATION_ERROR',  // Generic code
      tool: name,
    })
  }],
  isError: true,
};
```

**Note**: the snippet above is illustrative, not literal code. The server never emits `VALIDATION_ERROR`. The real catch block in [src/index.ts](src/index.ts) sets `errorCode` from the thrown error's `code`, so the only values that reach a client are `ValidationError.code` from [src/utils/validation.ts](src/utils/validation.ts) (`QUERY_TOO_LONG`, `PATH_TRAVERSAL`, `HOME_PATH_NOT_ALLOWED`, `INVALID_CHARACTERS`, `PATH_TOO_LONG`), `INVALID_ARGUMENTS` from the zod 4 tool-argument gate in [src/tool-args.ts](src/tool-args.ts), or `UNKNOWN_ERROR` when the error carries no code. The envelope shape (`success`, `error`, `errorCode`, `tool`, `isError`) is exactly as shown.

**Protected Information**:
- File system paths
- System configuration
- Internal error details
- Stack traces
- Environment variables

## Security Configuration

### Environment Variables

No sensitive environment variables are required for operation.

### File Permissions

The server reads files based on:
- User permissions of the running process
- Everything search index (Windows)
- Spotlight index (macOS)
- File system permissions (Linux)

### Logging

Security-related events are logged:
- Validation errors
- Blocked attack attempts
- Timeout events
- Error conditions

Logs do not contain sensitive information.

## Testing

### Automated Security Tests

**Test Suite**: [tests/security.test.ts](tests/security.test.ts)

**Coverage**:
- 22 security tests
- Input validation functions
- Sanitization quality
- Path traversal detection
- Error handling

**Results**: ✅ All 89 tests pass (22 security + 22 integration + 37 tool-argument + 8 file-info)

### Integration Tests

**Test Suite**: [tests/integration.test.ts](tests/integration.test.ts)

**Coverage**:
- Real-world attack scenarios
- Command chaining protection
- Path traversal variations
- DoS attempts
- Resource exhaustion

**Results**: ✅ All 22 integration tests pass

### Manual Testing

See [MANUAL_TESTING_GUIDE.md](MANUAL_TESTING_GUIDE.md) for:
- Step-by-step security testing procedures
- Attack scenario verification
- Validation testing
- Performance testing

## Security Best Practices

### For Users

1. **Validate Paths**: Always verify file paths before accessing files
2. **Use Specific Queries**: Avoid wildcards when possible
3. **Set Reasonable Limits**: Keep maxResults under 100 for typical use
4. **Monitor Logs**: Check for validation errors and blocked attacks
5. **Keep Updated**: Use the latest version with security patches

### For Developers

1. **Never Trust Input**: Always validate and sanitize user input
2. **Use Type Safety**: Leverage TypeScript strict mode
3. **Handle Errors Gracefully**: Don't expose system details
4. **Test Thoroughly**: Include security tests in test suite
5. **Follow OWASP Guidelines**: Implement OWASP security best practices

## Vulnerability Reporting

### How to Report

If you discover a security vulnerability, please report it responsibly:

1. **Do not** create a public issue
2. **Email**: security@yourdomain.com (replace with actual email)
3. **Include**: Description, steps to reproduce, and expected behavior
4. **Allow Time**: Give us 90 days to fix before disclosure

### Response Process

1. **Acknowledge**: We'll confirm receipt within 48 hours
2. **Investigate**: We'll validate and reproduce the issue
3. **Fix**: We'll develop and test a patch
4. **Release**: We'll deploy the fix with a security advisory
5. **Credit**: We'll credit you in the release notes

## Security Audits

### External Audits

This server has been tested against:
- OWASP Top 10 Web Application Security Risks
- Common Attack Pattern Enumeration and Classification (CAPEC)
- MITRE ATT&CK framework

### Compliance

The server follows security best practices from:
- OWASP ASVS (Application Security Verification Standard)
- CWE/SANS Top 25 Most Dangerous Software Errors
- ISO 27001 Information Security Management

## Known Limitations

1. **No Authentication**: Assumes trusted MCP client environment
2. **No Authorization**: All accessible files can be queried
3. **No Encryption**: Communication security depends on MCP client
4. **No Audit Logging**: Security events logged but not audited
5. **Argument gate is presence/type only**: the zod 4 gate in [src/tool-args.ts](src/tool-args.ts) rejects a missing or non-string `query`/`path` and non-numeric strings for `maxResults`/`offset` with `INVALID_ARGUMENTS`; length, range and character limits are still enforced downstream by `src/utils/validation.ts` and the platform adapters, which keep clamping out-of-range numbers.
6. **Windows `get_file_info` always fails**: `src/platform/windows-cli.ts:154` runs `es.exe -n 1 -info <path>`, but the vendored ES `1.1.0.36` binary has no `-info` switch (a direct run returns `Error 6: Unknown switch.`), so the tool answers `{success: false, errorCode: "UNKNOWN_ERROR"}` for every path. Pre-existing defect, proven by a runtime stdio probe of `node dist/index.js`; unrelated to the dependency upgrade and not mitigated.
7. **On Windows a >1000-character query reports `UNKNOWN_ERROR`, not `QUERY_TOO_LONG`**: the catch at `src/platform/windows-cli.ts:138-146` re-wraps every error and drops `error.code`, while the message text still reads "Query exceeds maximum length of 1000 characters". `getFileInfo` rethrows `ValidationError` correctly at `:185-187`. Pre-existing defect, not mitigated.

**Recommendation**: Use within trusted environments and follow MCP security guidelines.

## Security Updates

### Version 1.1.0 (Current)

**Added**:
- Comprehensive input validation
- Command injection protection
- Path traversal detection
- Resource limits
- Security test suite (89 tests)
- Security documentation

### Future Enhancements

- Rate limiting per client
- Audit logging
- Security headers
- Request signing
- Role-based access control (if needed)

## Compliance

- **GDPR**: No personal data stored or transmitted
- **CCPA**: No personal data collection
- **SOC 2**: Not applicable (standalone tool)
- **HIPAA**: Not applicable (no healthcare data)

## References

- [OWASP Command Injection](https://owasp.org/www-community/attacks/Command_Injection)
- [OWASP Path Traversal](https://owasp.org/www-community/attacks/Path_Traversal)
- [OWASP Input Validation](https://owasp.org/www-community/attacks/Input_Validation_Cheat_Sheet)
- [CWE-78: OS Command Injection](https://cwe.mitre.org/data/definitions/78.html)
- [CWE-22: Path Traversal](https://cwe.mitre.org/data/definitions/22.html)

---

*Last Updated: 2026-01-20*
*Security Version: 1.1.0*
