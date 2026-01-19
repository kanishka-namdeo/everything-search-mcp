# Manual Testing Guide - Everything Search MCP Server

## Overview

This guide provides step-by-step instructions for manually testing the Everything Search MCP server in real-world scenarios.

## Prerequisites

1. **Everything Search (Windows)**: Install from https://www.voidtools.com/
2. **Node.js 18+**: Required for running the server
3. **MCP Client**: Claude Desktop, VS Code with MCP, or other MCP-compatible client

## Setup

### 1. Build the Project
```bash
cd everything-search-mcp
npm install
npm run build
```

### 2. Configure MCP Client

Add to your MCP client configuration (usually in `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "everything-search": {
      "command": "node",
      "args": ["D:\\test_mcp\\everything-search-mcp\\dist\\index.js"]
    }
  }
}
```

## Test Scenarios

### Test 1: Basic File Search

**Objective**: Verify basic search functionality works correctly.

**Steps**:
1. Create test files:
   ```bash
   mkdir C:\\test_mcp_search
   echo "test content" > C:\\test_mcp_search\\test1.txt
   echo "another test" > C:\\test_mcp_search\\test2.txt
   ```

2. Force Everything to index:
   - Open Everything app
   - Press F5 or go to File → Rebuild

3. In MCP client, send request:
   ```json
   {
     "name": "search_files",
     "arguments": {
       "query": "test*.txt",
       "maxResults": 10
     }
   }
   ```

**Expected Result**:
- Returns 2 files: `test1.txt` and `test2.txt`
- Response includes file names, paths, and metadata

**Success Criteria**:
- ✅ Files found correctly
- ✅ Response structure matches expected format
- ✅ No errors in logs

---

### Test 2: Security - Command Injection

**Objective**: Verify command injection attacks are blocked.

**Test Cases**:

#### Case 1: Semicolon Injection
```json
{
  "name": "search_files",
  "arguments": {
    "query": "test; rm -rf C:\\test_mcp_search",
    "maxResults": 10
  }
}
```
**Expected**: ❌ ValidationError thrown, semicolon removed

#### Case 2: Pipe Injection
```json
{
  "name": "search_files",
  "arguments": {
    "query": "test | cat C:\\Windows\\system32\\config",
    "maxResults": 10
  }
}
```
**Expected**: ❌ ValidationError thrown, pipe removed

#### Case 3: Path Traversal
```json
{
  "name": "search_files",
  "arguments": {
    "query": "..\\..\\..\\Windows\\system32",
    "maxResults": 10
  }
}
```
**Expected**: ❌ ValidationError thrown, path traversal detected

**Success Criteria**:
- ✅ All attacks blocked with ValidationError
- ✅ No files actually deleted or accessed
- ✅ Error messages are generic (no system info leaked)

---

### Test 3: Input Validation

**Objective**: Verify input validation catches invalid inputs.

**Test Cases**:

#### Case 1: Empty Query
```json
{
  "name": "search_files",
  "arguments": {
    "query": "",
    "maxResults": 10
  }
}
```
**Expected**: ❌ ValidationError with code `EMPTY_QUERY`

#### Case 2: Whitespace Only
```json
{
  "name": "search_files",
  "arguments": {
    "query": "   ",
    "maxResults": 10
  }
}
```
**Expected**: ❌ ValidationError with code `EMPTY_QUERY`

#### Case 3: Too Long Query
```json
{
  "name": "search_files",
  "arguments": {
    "query": "aaaaaaaaaaaaaaaaaaaa...(1001 chars)...aaaaa",
    "maxResults": 10
  }
}
```
**Expected**: ❌ ValidationError with code `QUERY_TOO_LONG`

#### Case 4: Invalid maxResults
```json
{
  "name": "search_files",
  "arguments": {
    "query": "test",
    "maxResults": 0
  }
}
```
**Expected**: ❌ ValidationError with code `INVALID_MAX_RESULTS`

#### Case 5: Negative Offset
```json
{
  "name": "search_files",
  "arguments": {
    "query": "test",
    "offset": -1
  }
}
```
**Expected**: ❌ ValidationError with code `INVALID_OFFSET`

**Success Criteria**:
- ✅ All invalid inputs rejected
- ✅ Appropriate error codes returned
- ✅ Error messages are descriptive

---

### Test 4: Search Options

**Objective**: Verify search options work correctly.

**Test Cases**:

#### Case 1: Limit Results
```json
{
  "name": "search_files",
  "arguments": {
    "query": "*",
    "maxResults": 5
  }
}
```
**Expected**: Returns exactly 5 results

#### Case 2: Offset Pagination
```json
{
  "name": "search_files",
  "arguments": {
    "query": "*",
    "maxResults": 10,
    "offset": 5
  }
}
```
**Expected**: Returns results 6-15 (skips first 5)

#### Case 3: Case Sensitive Search
```json
{
  "name": "search_files",
  "arguments": {
    "query": "TestFile",
    "matchCase": true,
    "maxResults": 10
  }
}
```
**Expected**: Only exact case matches

#### Case 4: Regex Search
```json
{
  "name": "search_files",
  "arguments": {
    "query": "^test.*\\.txt$",
    "regex": true,
    "maxResults": 10
  }
}
```
**Expected**: Matches regex pattern

**Success Criteria**:
- ✅ Options applied correctly
- ✅ Results match expected behavior
- ✅ No errors for valid options

---

### Test 5: File Info Retrieval

**Objective**: Verify file information retrieval works.

**Test Case**:
```json
{
  "name": "get_file_info",
  "arguments": {
    "path": "C:\\test_mcp_search\\test1.txt"
  }
}
```
**Expected Result**:
```json
{
  "success": true,
  "info": {
    "name": "test1.txt",
    "path": "C:\\test_mcp_search",
    "size": 12,
    "created": "2024-01-20T...",
    "modified": "2024-01-20T...",
    "isFile": true,
    "isFolder": false
  }
}
```

**Success Criteria**:
- ✅ File metadata returned correctly
- ✅ Size is accurate
- ✅ Timestamps are valid
- ✅ File type detected correctly

---

### Test 6: Unicode and Special Characters

**Objective**: Verify Unicode and special characters work.

**Test Setup**:
```bash
echo "测试" > C:\\test_mcp_search\\中文.txt
echo "файл" > C:\\test_mcp_search\\русский.txt
echo "ファイル" > C:\\test_mcp_search\\日本語.txt
```

**Test Case**:
```json
{
  "name": "search_files",
  "arguments": {
    "query": "*.txt",
    "maxResults": 10
  }
}
```
**Expected Result**: All Unicode files found with correct names

**Success Criteria**:
- ✅ Unicode filenames preserved
- ✅ No encoding issues
- ✅ Search works correctly

---

### Test 7: Performance Tests

**Objective**: Verify performance is acceptable.

**Test Case 1: Large Result Set
```json
{
  "name": "search_files",
  "arguments": {
    "query": "*",
    "maxResults": 1000
  }
}
```
**Expected**: Returns within 5 seconds

**Test Case 2: Complex Regex
```json
{
  "name": "search_files",
  "arguments": {
    "query": "^[A-Za-z0-9_]+\\.(txt|js|md)$",
    "regex": true,
    "maxResults": 100
  }
}
```
**Expected**: Returns within 2 seconds

**Success Criteria**:
- ✅ All searches complete in reasonable time
- ✅ No timeouts
- ✅ Memory usage is stable

---

### Test 8: Error Handling

**Objective**: Verify errors are handled gracefully.

**Test Cases**:

#### Case 1: Non-existent File
```json
{
  "name": "get_file_info",
  "arguments": {
    "path": "C:\\nonexistent\\file.txt"
  }
}
```
**Expected**: Error message, not crash

#### Case 2: Everything Not Running
```bash
# Stop Everything service
net stop Everything
```
Then try search:
```json
{
  "name": "search_files",
  "arguments": {
    "query": "test",
    "maxResults": 10
  }
}
```
**Expected**: Clear error about Everything not available

**Success Criteria**:
- ✅ Errors don't crash server
- ✅ Error messages are user-friendly
- ✅ Logs show error details

---

### Test 9: Concurrent Requests

**Objective**: Verify server handles concurrent requests.

**Test Steps**:
1. Send 10 simultaneous search requests:
   ```json
   [
     {"name": "search_files", "arguments": {"query": "*.txt", "maxResults": 10}},
     {"name": "search_files", "arguments": {"query": "*.js", "maxResults": 10}},
     {"name": "search_files", "arguments": {"query": "*.md", "maxResults": 10}},
     // ... (repeat for different patterns)
   ]
   ```

**Expected**: All requests complete successfully

**Success Criteria**:
- ✅ All requests handled
- ✅ No data corruption
- ✅ Server remains stable

---

### Test 10: Platform Status Check

**Objective**: Verify platform status reporting.

**Test Case**:
```json
{
  "name": "check_status"
}
```
**Expected Result**:
```json
{
  "success": true,
  "status": {
    "platform": "windows",
    "searchEngine": "es.exe",
    "available": true,
    "version": "1.x.x",
    "message": "Everything search is available"
  }
}
```

**Success Criteria**:
- ✅ Platform correctly identified
- ✅ Search engine detected
- ✅ Availability status is accurate

---

## Test Checklist

Use this checklist to track manual testing progress:

### Functionality Tests
- [ ] Basic file search works
- [ ] File info retrieval works
- [ ] Platform status check works
- [ ] Search options (maxResults, offset) work
- [ ] Case sensitive search works
- [ ] Regex search works
- [ ] Path matching works

### Security Tests
- [ ] Command injection blocked (semicolon)
- [ ] Command injection blocked (pipe)
- [ ] Command injection blocked (AND/OR)
- [ ] Command substitution blocked
- [ ] Path traversal blocked
- [ ] Home directory access blocked
- [ ] Empty query rejected
- [ ] Invalid parameters rejected

### Edge Case Tests
- [ ] Unicode filenames work
- [ ] Special characters in filenames work
- [ ] Very long queries rejected
- [ ] Very long paths rejected
- [ ] Zero/negative limits rejected
- [ ] Whitespace-only queries rejected

### Performance Tests
- [ ] Large result sets return quickly
- [ ] Complex searches complete in reasonable time
- [ ] Concurrent requests handled
- [ ] Memory usage is stable
- [ ] No memory leaks

### Error Handling Tests
- [ ] Non-existent files handled gracefully
- [ ] Service unavailable errors handled
- [ ] Generic error messages (no info leakage)
- [ ] Errors logged appropriately
- [ ] Server doesn't crash on errors

## Logging

Enable verbose logging during testing:

```bash
# Set environment variable
set DEBUG=everything-search:*

# Run server
node dist/index.js
```

Check logs for:
- Validation errors
- Command execution times
- Error messages
- Warning messages

## Common Issues and Solutions

### Issue: "es.exe not found"
**Solution**: Install Everything from voidtools.com and add to PATH

### Issue: "No results found"
**Solution**: 
1. Make sure Everything is running
2. Force reindex in Everything (F5)
3. Verify file exists

### Issue: "ValidationError"
**Solution**: Check the error code and message for details:
- `EMPTY_QUERY`: Provide a non-empty query
- `QUERY_TOO_LONG`: Use shorter query (<1000 chars)
- `PATH_TRAVERSAL`: Remove `..` from paths
- `INVALID_MAX_RESULTS`: Use value between 1-1000

### Issue: Timeout
**Solution**: 
1. Narrow search query
2. Reduce maxResults
3. Check if Everything is responsive

## Test Report Template

After completing manual tests, fill out this report:

| Test | Status | Notes |
|------|--------|-------|
| Basic file search | ☐ Pass ☐ Fail | |
| Command injection protection | ☐ Pass ☐ Fail | |
| Input validation | ☐ Pass ☐ Fail | |
| Search options | ☐ Pass ☐ Fail | |
| File info retrieval | ☐ Pass ☐ Fail | |
| Unicode support | ☐ Pass ☐ Fail | |
| Performance | ☐ Pass ☐ Fail | |
| Error handling | ☐ Pass ☐ Fail | |
| Concurrent requests | ☐ Pass ☐ Fail | |
| Platform status | ☐ Pass ☐ Fail | |

**Overall Status**: ☐ Pass ☐ Fail

**Issues Found**:
1.
2.
3.

**Recommendations**:
1.
2.
3.

---

## Automated Test Results

For reference, automated test results are in [TEST_RESULTS.md](file:///d:/test_mcp/everything-search-mcp/TEST_RESULTS.md).

**Automated Test Status**: ✅ ALL TESTS PASSED (44/44)

*Last Updated: 2026-01-20*
