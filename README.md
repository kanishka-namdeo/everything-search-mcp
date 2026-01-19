# Everything Search MCP Server

A Model Context Protocol (MCP) server for fast file search using Everything (Windows) with cross-platform fallbacks for macOS (Spotlight) and Linux (ripgrep/locate).

## Features

### Search Capabilities

- **Windows**: Everything CLI integration (es.exe)
  - Fast, indexed file search
  - Wildcards, operators (AND, OR, NOT)
  - Regex support
  - Sorting by name, size, date, etc.
  - File metadata retrieval

- **macOS**: Spotlight integration via mdfind
  - Native macOS search
  - File and folder search
  - Spotlight query syntax

- **Linux**: ripgrep and locate support
  - Fast search with ripgrep (preferred)
  - Fallback to locate
  - Pattern matching and regex

### Security Features

- **Input Validation**: All user inputs are validated and sanitized
- **Command Injection Protection**: Shell metacharacters are removed from queries
- **Path Traversal Protection**: Prevents access outside intended directories
- **Resource Limits**: Built-in timeouts and buffer size limits
- **Error Handling**: Secure error messages without information leakage
- **Type Safety**: Strict TypeScript types prevent runtime errors

## Installation

### Prerequisites

#### Windows Users

1. Install Everything from [voidtools.com](https://www.voidtools.com/)
2. Ensure Everything is running
3. Enable "Run as administrator" for best results

#### macOS Users

No additional installation required - Spotlight is built into macOS.

#### Linux Users

Install ripgrep for best performance:

```bash
sudo apt install ripgrep  # Ubuntu/Debian
sudo dnf install ripgrep  # Fedora
sudo pacman -S ripgrep    # Arch Linux
```

Or use locate (slower):

```bash
sudo apt install mlocate  # Ubuntu/Debian
sudo dnf install mlocate  # Fedora
sudo pacman -S mlocate    # Arch Linux
```

### Install the MCP Server

```bash
npm install -g everything-search-mcp
```

Or for local development:

```bash
npm install
npm run build
npm link
```

## Configuration

### Claude Desktop Configuration

Add to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "everything-search": {
      "command": "everything-search-mcp",
      "args": []
    }
  }
}
```

### Advanced Configuration

The MCP server uses standard configuration and doesn't require additional environment variables. Simply ensure Everything (Windows) or ripgrep/locate (Linux) are installed and accessible in your system PATH.

## Usage

### Search Files

Basic search:

```json
{
  "name": "search_files",
  "arguments": {
    "query": "*.txt"
  }
}
```

Advanced search with sorting and options:

```json
{
  "name": "search_files",
  "arguments": {
    "query": "invoice AND (pdf OR docx)",
    "maxResults": 50,
    "sortBy": "date_modified",
    "sortOrder": "descending",
    "matchPath": true,
    "regex": false
  }
}
```

### Get File Info

```json
{
  "name": "get_file_info",
  "arguments": {
    "path": "C:\\Documents\\report.pdf"
  }
}
```

### Check Status

```json
{
  "name": "check_status",
  "arguments": {}
}
```

## Tool Reference

### search_files

Search for files and folders using the platform's search engine.

**Parameters:**

| Parameter | Type | Required | Description | Limits |
|-----------|------|----------|-------------|---------|
| query | string | Yes | Search query. Supports wildcards (*, ?), operators (AND, OR, NOT), and regex on Windows | 1-1000 characters |
| maxResults | number | No | Maximum results to return (default: 100) | 1-1000 |
| offset | number | No | Number of results to skip (default: 0) | 0-100000 |
| sortBy | string | No | Sort field: name, path, size, extension, date_modified, date_created, attributes, run_count (Windows only) | - |
| sortOrder | string | No | Sort order: ascending or descending (Windows only) | - |
| matchPath | boolean | No | Match against full path (Windows only) | - |
| matchCase | boolean | No | Enable case-sensitive matching | - |
| matchWholeWord | boolean | No | Match whole words only (Windows only) | - |
| regex | boolean | No | Enable regex mode | - |

**Validation:**
- Empty queries are rejected
- Queries exceeding 1000 characters are rejected
- Shell metacharacters are automatically removed
- Path traversal attempts are blocked

**Response:**

```json
{
  "success": true,
  "count": 5,
  "results": [
    {
      "name": "document.txt",
      "path": "C:\\Documents",
      "fullPath": "C:\\Documents\\document.txt",
      "size": 1024,
      "modified": "2024-01-20T10:30:00.000Z",
      "created": "2024-01-15T08:00:00.000Z",
      "extension": "txt",
      "isFolder": false,
      "isFile": true
    }
  ]
}
```

### get_file_info

Get detailed metadata for a specific file or folder.

**Parameters:**

| Parameter | Type | Required | Description | Limits |
|-----------|------|----------|-------------|---------|
| path | string | Yes | Full path to file or folder | 1-4096 characters |

**Validation:**
- Empty paths are rejected
- Paths exceeding 4096 characters are rejected
- Path traversal attempts are blocked
- Shell metacharacters are rejected

**Response:**

```json
{
  "success": true,
  "info": {
    "name": "document.txt",
    "path": "C:\\Documents",
    "size": 1024,
    "created": "2024-01-15T08:00:00.000Z",
    "modified": "2024-01-20T10:30:00.000Z",
    "accessed": "2024-01-20T10:30:00.000Z",
    "attributes": 32,
    "extension": "txt",
    "isFolder": false,
    "isFile": true
  }
}
```

### check_status

Check the status of the search engine and platform.

**Parameters:** None

**Response:**

```json
{
  "success": true,
  "status": {
    "platform": "windows",
    "searchEngine": "Everything",
    "available": true,
    "version": "1.4.1.1019",
    "message": "Everything search available"
  }
}
```

## Platform-Specific Features

### Windows (Everything)

**Query Operators:**
- `AND` - Both terms must match
- `OR` - Either term can match
- `NOT` - Exclude term
- `""` - Exact phrase
- `*` - Wildcard for multiple characters
- `?` - Wildcard for single character

**Examples:**
- `*.txt` - All .txt files
- `invoice AND pdf` - Files containing both "invoice" and "pdf"
- `report NOT draft` - Files with "report" but not "draft"
- `"my document".pdf` - Exact phrase with .pdf extension

### macOS (Spotlight)

**Query Syntax:**
- Basic text search
- `kind:pdf` - File type filter
- `date:today` - Date filter
- `name:document` - Name search

**Examples:**
- `document` - Search for "document"
- `kind:pdf document` - PDF files with "document"
- `date:today` - Modified today

### Linux (ripgrep/locate)

**Query Syntax:**
- Basic pattern matching
- Regex supported
- Case-insensitive by default

**Examples:**
- `document` - Search for "document"
- `\.txt$` - Regex for .txt files
- `invoice.*pdf` - Regex pattern

## Security

### Overview

This MCP server implements comprehensive security measures to protect against common vulnerabilities:

- **Command Injection Protection**: All user inputs are sanitized to remove shell metacharacters (`;`, `&`, `|`, `$`, `(`, `)`, `` ` ``, `~`)
- **Path Traversal Protection**: Detects and blocks `..` sequences and home directory access (`~`)
- **Input Validation**: Strict validation of query length (max 1000 chars), path length (max 4096 chars), and parameter bounds
- **Resource Limits**: Command timeouts (30 seconds) and buffer size limits (50MB) prevent DoS attacks
- **Error Handling**: Secure error messages that don't leak system information
- **Type Safety**: TypeScript strict mode prevents type-related vulnerabilities

### Security Testing

All security measures are validated by 44 automated tests:

- **22 Security Tests**: Input validation, sanitization, and protection mechanisms
- **22 Integration Tests**: Real-world attack scenarios and edge cases

For detailed test results, see [TEST_RESULTS.md](TEST_RESULTS.md).

### Best Practices

When using this MCP server:

1. **Use Specific Queries**: Narrow searches to specific file patterns instead of wildcards
2. **Set Reasonable Limits**: Keep `maxResults` under 100 for typical use cases
3. **Validate Results**: Always verify file paths before accessing files
4. **Monitor Logs**: Check server logs for validation errors and security warnings

## Troubleshooting

### Windows

**Error: "es.exe not found"**
- Install Everything from https://www.voidtools.com/
- Ensure es.exe is in your system PATH
- Restart Claude Desktop after installation

### macOS

**Error: "mdfind command not found"**
- This should not happen as mdfind is built into macOS
- Check that Spotlight is enabled in System Settings

### Linux

**Error: "Neither ripgrep nor locate found"**
- Install ripgrep for best performance:
  ```bash
  sudo apt install ripgrep
  ```
- Or install locate as a fallback:
  ```bash
  sudo apt install mlocate
  sudo updatedb
  ```

## Development

### Building

```bash
npm run build
```

### Running in Development

```bash
npm run dev
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- tests/security.test.ts
npm test -- tests/integration.test.ts
```

**Test Coverage:**
- 44 automated tests covering security, validation, and edge cases
- See [TEST_RESULTS.md](TEST_RESULTS.md) for detailed test results
- See [MANUAL_TESTING_GUIDE.md](MANUAL_TESTING_GUIDE.md) for manual testing procedures

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## Acknowledgments

- Everything search by voidtools.com
- Model Context Protocol by Anthropic
