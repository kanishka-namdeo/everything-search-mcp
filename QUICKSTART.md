# Quick Start Guide

## Installation

1. **Install the MCP server:**
   ```bash
   npm install -g everything-search-mcp
   ```

2. **Windows users only:**
   - Install Everything from https://www.voidtools.com/
   - Start Everything (ensure it's running before using the MCP server)

3. **Linux users (optional but recommended):**
   ```bash
   sudo apt install ripgrep
   ```

## Configuration

Add to Claude Desktop config:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows:** `%APPDATA%\Claude/claude_desktop_config.json`

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

Restart Claude Desktop.

## Usage Examples

### Basic File Search
```
Find all .txt files
```

**MCP Tool Call:**
```json
{
  "name": "search_files",
  "arguments": {
    "query": "*.txt"
  }
}
```

### Advanced Search
```
Find all PDF invoices from 2024
```

**MCP Tool Call:**
```json
{
  "name": "search_files",
  "arguments": {
    "query": "invoice AND pdf AND 2024",
    "sortBy": "date_modified",
    "sortOrder": "descending",
    "maxResults": 20
  }
}
```

### Get File Info
```
Show details for a specific file
```

**MCP Tool Call:**
```json
{
  "name": "get_file_info",
  "arguments": {
    "path": "C:\\Documents\\report.pdf"
  }
}
```

### Check Status
```
Verify Everything is running
```

**MCP Tool Call:**
```json
{
  "name": "check_status",
  "arguments": {}
}
```

## Platform-Specific Query Examples

### Windows (Everything)
- `*.pdf` - All PDF files
- `document AND (pdf OR docx)` - Documents with PDF or DOCX extension
- `report NOT draft` - Reports without "draft" in the name
- `"my file".txt` - Exact phrase match
- `size:>1mb` - Files larger than 1MB

### macOS (Spotlight)
- `document` - Search for "document"
- `kind:pdf document` - PDF files with "document"
- `date:today` - Modified today
- `name:report` - Files with "report" in name

### Linux (ripgrep)
- `document` - Search for "document"
- `\.txt$` - All .txt files (regex)
- `invoice.*pdf` - Pattern matching

## Troubleshooting

### Everything not running (Windows)
1. Install Everything from voidtools.com
2. Start Everything and wait for indexing
3. Restart Claude Desktop

### Search returns no results
1. Check search engine is available using `check_status`
2. Ensure files are indexed
3. Try a broader search query

### Errors with specific paths
1. Use full paths
2. Escape special characters on Windows: `\\` instead of `\`
3. Check file permissions

## Tips

- Use `check_status` first to verify the search engine is available
- Start with simple queries and add filters gradually
- Use `maxResults` to limit results for large searches
- Combine `sortBy` and `sortOrder` for organized results
- On Windows, Everything's query syntax is most powerful
