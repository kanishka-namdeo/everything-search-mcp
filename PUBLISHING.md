# Publishing to npm

This guide explains how to publish the Everything Search MCP Server to npm.

## Prerequisites

1. **npm account**: Create an account at [npmjs.com](https://www.npmjs.com/) if you don't have one
2. **Login to npm**: Run `npm login` in your terminal
3. **Update repository URLs**: Replace `your-username` in [package.json](package.json#L36-L42) with your actual GitHub username

## Pre-Publishing Checklist

- [ ] Update version number in [package.json](package.json#L3)
- [ ] Update [CHANGELOG.md](CHANGELOG.md) with release notes
- [ ] Run `npm run build` to ensure build succeeds
- [ ] Run `npm test` to ensure all tests pass
- [ ] Update repository URLs in package.json if needed
- [ ] Verify README.md is up to date

## Publishing Steps

### 1. Dry Run (Recommended)

Test what will be published without actually publishing:

```bash
npm publish --dry-run
```

This will show you exactly what files will be included in the package.

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

For emergency situations, you can skip the pre-publish checks:
```bash
npm publish --ignore-scripts
```

## Package Contents

The published package includes:
- `dist/` - Compiled JavaScript and TypeScript definitions
- `LICENSE` - MIT license
- `README.md` - Documentation

The following are excluded (see [.npmignore](.npmignore)):
- Source files (`.ts`)
- Test files
- Development configs
- Internal documentation

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
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Set `NPM_TOKEN` in GitHub repository secrets (get from npmjs.com: Account → Access Tokens).
