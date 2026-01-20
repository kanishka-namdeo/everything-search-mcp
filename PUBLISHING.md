# Publishing to npm

This guide explains how to publish Everything Search MCP Server to npm.

## Prerequisites

1. **npm account**: Create an account at [npmjs.com](https://www.npmjs.com/) if you don't have one
2. **Login to npm**: Run `npm login` in your terminal
3. **Update repository URLs**: Replace `your-username` in [package.json](package.json#L50-L56) with your actual GitHub username

## Pre-Publishing Checklist

- [ ] Update version number in [package.json](package.json#L3)
- [ ] Update [CHANGELOG.md](CHANGELOG.md) with release notes
- [ ] Run `npm run build` to ensure build succeeds
- [ ] Run `npm test` to ensure all tests pass
- [ ] Update repository URLs in package.json if needed
- [ ] Verify README.md is up to date
- [ ] Verify bin/es.exe is present (Windows only)

## Publishing Steps

### 1. Dry Run (Recommended)

Test what will be published without actually publishing:

```bash
npm publish --dry-run
```

This will show you exactly what files will be included in package.

**Expected Package Contents:**
- `dist/` - Compiled JavaScript and TypeScript definitions
- `bin/` - es.exe CLI tool (Windows)
- `scripts/download-es.js` - Automatic download script for Windows
- `LICENSE` - MIT license
- `README.md` - Documentation

### 2. Publish to npm

```bash
npm publish
```

The `prepublishOnly` script will automatically:
- Run `npm run build` to compile TypeScript
- Run `npm test` to ensure all tests pass

If either step fails, publishing will be aborted.

### 3. Verify Publication

Visit your package page:
```
https://www.npmjs.com/package/everything-search-mcp
```

## Versioning

Use semantic versioning (SemVer):
- **Major version (X.0.0)**: Breaking changes
- **Minor version (1.X.0)**: New features, backward compatible
- **Patch version (1.0.X)**: Bug fixes, backward compatible

Update version in [package.json](package.json#L3):

```bash
# Patch (bug fix)
npm version patch

# Minor (new feature)
npm version minor

# Major (breaking change)
npm version major
```

Then publish:
```bash
npm publish
```

## Post-Publishing

1. **Update GitHub**:
   - Create a git tag: `git tag v1.0.0`
   - Push tags: `git push --tags`
   - Create a GitHub release with changelog

2. **Update Documentation** (if needed):
   - Update README with new features
   - Update examples if API changed

3. **Announce** (optional):
   - Share on social media
   - Post in relevant communities

## Troubleshooting

### "You do not have permission to publish this package"

This means someone else has already published this package name. You need to:
- Choose a different package name (update in [package.json](package.json#L2))
- Or contact the current owner to transfer ownership

### "404 Not Found" during publish

Check that you're logged in:
```bash
npm whoami
```

If not logged in:
```bash
npm login
```

### Build or test fails during prepublishOnly

Fix the issue and try again:
```bash
npm run build
npm test
npm publish
```

### Want to skip tests (not recommended)

For emergency situations, you can skip pre-publish checks:
```bash
npm publish --ignore-scripts
```

### Windows: es.exe not included in package

If dry-run shows bin/es.exe is missing:
1. Run the download script:
   ```bash
   node scripts/download-es.js
   ```
2. Verify es.exe was created in bin/ directory
3. Run npm publish again

## Package Contents

The published package includes:
- `dist/` - Compiled JavaScript and TypeScript definitions
- `bin/` - es.exe CLI tool (Windows only, auto-downloaded)
- `scripts/download-es.js` - Automatic download script for Windows
- `LICENSE` - MIT license
- `README.md` - Documentation

The following are excluded (see [.npmignore](.npmignore)):
- Source files (`.ts`)
- Test files
- Development configs
- Internal documentation

## Windows-Specific Publishing Notes

### Automatic es.exe Download

On Windows, es.exe is automatically downloaded during npm install via the postinstall script. This means:

1. You don't need to include es.exe in the git repository
2. The postinstall script will download it from GitHub releases
3. Users will have es.exe available immediately after npm install

### Verifying Download Script Works

Before publishing, verify the download script works:

```bash
node scripts/download-es.js
```

This should:
1. Detect your system architecture
2. Download the latest ES release from GitHub
3. Extract es.exe to bin/ directory
4. Clean up the zip file

### bin/es.exe in Git

The bin/es.exe file should be in your git repository for development, but it's not required for npm publishing. The [.gitignore](.gitignore) file includes:

```
!bin/
!bin/es.exe
```

This keeps bin/es.exe tracked in git for local development, while the [.npmignore](.npmignore) ensures it's included in the published package.

## Unpublishing (Emergency Only)

**Warning**: Unpublishing is only allowed within 72 hours and only for packages without other dependents.

```bash
npm unpublish everything-search-mcp@1.0.0
```

## Useful npm Commands

```bash
# View package info
npm info everything-search-mcp

# View package versions
npm view everything-search-mcp versions

# Check if package name is available
npm view <package-name>

# View published package contents
npm pack everything-search-mcp
tar -tzf everything-search-mcp-*.tgz
```

## CI/CD Integration

For automated publishing, you can use GitHub Actions or similar:

```yaml
# .github/workflows/publish.yml
name: Publish to npm

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: windows-latest  # Windows to ensure es.exe download works
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm test
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Set `NPM_TOKEN` in GitHub repository secrets (get from npmjs.com: Account → Access Tokens).

## Cross-Platform Considerations

The package is designed to work on:
- Windows (x64, x86, ARM64) - Uses es.exe CLI
- macOS - Uses Spotlight (mdfind)
- Linux - Uses ripgrep or locate

When testing before publishing:
1. Test on Windows to verify es.exe download works
2. Test on macOS to verify Spotlight integration
3. Test on Linux to verify ripgrep/locate integration

Use GitHub Actions matrix strategy for cross-platform testing:

```yaml
strategy:
  matrix:
    os: [windows-latest, macos-latest, ubuntu-latest]
    node-version: [18, 20]
```
