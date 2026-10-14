# Quick start

Fast setup, platform details, query syntax and troubleshooting for `everything-search-mcp`. Tool parameters, response examples and the security model stay in [README.md](README.md) and [SECURITY.md](SECURITY.md).

## Get started in 2 minutes

1. Install the server globally (requires Node.js >= 20):
   ```bash
   npm install -g everything-search-mcp
   ```
2. Add it to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS, `%APPDATA%\Claude\claude_desktop_config.json` on Windows):
   ```json
   {
     "mcpServers": {
       "everything-search": { "command": "everything-search-mcp", "args": [] }
     }
   }
   ```
3. Restart Claude Desktop. For other MCP clients, or local development installs (`npm install`, `npm run build`, `npm link`), see the Installation and Configuration sections of README.md.

## Platform setup

### Windows

Everything's CLI (`es.exe`) is the search engine. The package ships a bundled binary at `bin/es.exe`, so a normal install needs no download and no manual steps. The postinstall download only runs when `bin/es.exe` is missing; when it does run, it detects your architecture (x64, x86, or ARM64), downloads the matching ES release zip from the voidtools/ES GitHub releases, extracts es.exe into the package's `bin/` directory, and cleans up the zip. `check_status` reports the bundled es.exe as version `1.1.0.36`.

**Optional**: the full Everything application from [voidtools.com](https://www.voidtools.com/) is not required — the MCP server works with just es.exe. Install it only for its extra features or a live index maintained by the running app.

### macOS

Nothing to install. Spotlight (`mdfind`) is built into macOS and used automatically.

### Linux

The Linux adapter probes ripgrep first and falls back to locate when ripgrep is unavailable.

Install ripgrep for best performance:

```bash
sudo apt install ripgrep  # Ubuntu/Debian
sudo dnf install ripgrep  # Fedora
sudo pacman -S ripgrep    # Arch Linux
```

Or use locate as the fallback (slower, needs an up-to-date database):

```bash
sudo apt install mlocate  # Ubuntu/Debian
sudo dnf install mlocate  # Fedora
sudo pacman -S mlocate    # Arch Linux
sudo updatedb             # build the locate database
```

## Query syntax by platform

Queries are interpreted by the platform's own search engine, so supported syntax differs per OS.

### Windows (Everything)

Query operators:
- `AND` - Both terms must match
- `OR` - Either term can match
- `NOT` - Exclude term
- `""` - Exact phrase
- `*` - Wildcard for multiple characters
- `?` - Wildcard for single character

Examples:
- `*.txt` - All .txt files
- `*.pdf` - All PDF files
- `invoice AND pdf` - Files containing both "invoice" and "pdf"
- `document AND (pdf OR docx)` - Documents with PDF or DOCX extension
- `report NOT draft` - Files with "report" but not "draft"
- `"my document".pdf` - Exact phrase with .pdf extension
- `"my file".txt` - Exact phrase match
- `size:>1mb` - Files larger than 1MB

### macOS (Spotlight)

Query syntax:
- Basic text search
- `kind:pdf` - File type filter
- `date:today` - Date filter
- `name:document` - Name search

Examples:
- `document` - Search for "document"
- `kind:pdf document` - PDF files with "document"
- `date:today` - Modified today
- `name:report` - Files with "report" in name

### Linux (ripgrep/locate)

Query syntax:
- Basic pattern matching
- Regex supported
- Case-insensitive by default

Examples:
- `document` - Search for "document"
- `\.txt$` - Regex for .txt files
- `invoice.*pdf` - Regex pattern

## Example prompts and tool calls

### Basic file search

```
Find all .txt files
```

```json
{
  "name": "search_files",
  "arguments": {
    "query": "*.txt"
  }
}
```

### Advanced search

```
Find all PDF invoices from 2024
```

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

### Get file info

```
Show details for a specific file
```

```json
{
  "name": "get_file_info",
  "arguments": {
    "path": "C:\\Documents\\report.pdf"
  }
}
```

### Check status

```
Verify Everything is available
```

```json
{
  "name": "check_status",
  "arguments": {}
}
```

## Troubleshooting

### Windows

**Error: "es.exe not found"**

The package ships `bin/es.exe`, and the install step downloads it only when that file is missing. If you see this error:

1. Run the download script manually: `node node_modules/everything-search-mcp/scripts/download-es.js`
2. Check that you have internet connectivity to download from GitHub
3. Verify npm install completed successfully
4. Try reinstalling: `npm uninstall everything-search-mcp && npm install -g everything-search-mcp`

**Download fails during npm install**

If the automatic download fails:

1. Check your internet connection
2. Ensure GitHub is accessible from your network
3. Manually download es.exe from https://github.com/voidtools/ES/releases
4. Pick the zip for your architecture (x64, x86, or ARM64), extract es.exe, and place it in the package's `bin/` directory

**Search returns no results**

1. Use the `check_status` tool to verify the engine is available
2. Ensure Everything (full application) is running and has finished indexing
3. Check that file paths are accessible
4. Try a broader search query

### macOS

**Error: "mdfind command not found"**
- This should not happen as mdfind is built into macOS
- Check that Spotlight is enabled in System Settings

### Linux

**Error: "Neither ripgrep nor locate found"**
- Install ripgrep for best performance (commands in Linux platform setup above)
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
- es.exe CLI tool is sufficient for most use cases; installing the full Everything application is optional
