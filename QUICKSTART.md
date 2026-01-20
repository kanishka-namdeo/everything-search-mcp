# Quick Start Guide

## Installation

1. **Install MCP server:**
   ```bash
   npm install -g everything-search-mcp
   ```

2. **Windows users:**
   - es.exe CLI tool is **automatically downloaded** during npm install
   - No manual installation required
   - For additional features, optionally install Everything from https://www.voidtools.com/

3. **Linux users (optional but recommended):**
   ```bash
   sudo apt install ripgrep
   ```

## How Automatic es.exe Download Works

When you run `npm install -g everything-search-mcp` on Windows:

1. The postinstall script automatically runs
2. Your system architecture is detected (x64, x86, or ARM64)
3. The latest ES release is downloaded from GitHub
4. es.exe is extracted to the package's bin directory
5. The package is ready to use immediately

**No manual steps required!**

## Configuration

Add to Claude Desktop config:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

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
Verify Everything is available
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
- `report NOT draft` - Reports without "draft" in name
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

### Windows

**es.exe not found during installation**

If the automatic download fails:
1. Check your internet connection
2. Ensure GitHub is accessible from your network
3. Try reinstalling the package:
   ```bash
   npm uninstall everything-search-mcp
   npm install -g everything-search-mcp
   ```

**Search returns no results**
1. Use `check_status` tool to verify Everything is available
2. For best results, install full Everything application and run it
3. Ensure files are indexed
4. Try a broader search query

**Manual es.exe download (fallback)**

If automatic download fails completely:
1. Visit https://github.com/voidtools/ES/releases
2. Download the appropriate zip file for your architecture (x64, x86, or ARM64)
3. Extract es.exe from the zip
4. Place es.exe in the package's bin directory

### macOS

**mdfind command not found**
- This should not happen as mdfind is built into macOS
- Check that Spotlight is enabled in System Settings

### Linux

**Neither ripgrep nor locate found**
- Install ripgrep for best performance:
  ```bash
  sudo apt install ripgrep
  ```
- Or install locate as a fallback:
  ```bash
  sudo apt install mlocate
  sudo updatedb
  ```

## Tips

- Use `check_status` first to verify the search engine is available
- Start with simple queries and add filters gradually
- Use `maxResults` to limit results for large searches
- Combine `sortBy` and `sortOrder` for organized results
- On Windows, Everything's query syntax is most powerful
- es.exe CLI tool is sufficient for most use cases; installing full Everything application is optional
