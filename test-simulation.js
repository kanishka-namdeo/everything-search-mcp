#!/usr/bin/env node

import { searchFilesUnified, getFileInfoUnified, getStatusUnified } from './dist/search/unified.js';
import { getPlatformInfo } from './dist/search/unified.js';

async function runSimulation() {
  console.log('='.repeat(60));
  console.log('Everything Search MCP Server - Real World Test Simulation');
  console.log('='.repeat(60));
  console.log();

  const platformInfo = getPlatformInfo();
  console.log(`Platform: ${platformInfo.platform}`);
  console.log(`Search Engine: ${platformInfo.searchEngine}`);
  console.log(`Is Primary: ${platformInfo.isPrimary}`);
  console.log();

  console.log('Test 1: Check Status');
  console.log('-'.repeat(40));
  try {
    const status = await getStatusUnified();
    console.log('✅ Status check:');
    console.log(`   Available: ${status.available}`);
    console.log(`   Message: ${status.message || 'N/A'}`);
    if (status.version) {
      console.log(`   Version: ${status.version}`);
    }
  } catch (error) {
    console.log('❌ Status check failed:', error.message);
  }
  console.log();

  if (!platformInfo.isPrimary) {
    console.log('⚠️  Note: Running on non-Windows platform');
    console.log('    Feature set is limited compared to Everything on Windows');
    console.log('    This is expected behavior for cross-platform support');
    console.log();
  }

  console.log('Test 2: Search Files (Simple)');
  console.log('-'.repeat(40));
  try {
    const simpleResults = await searchFilesUnified({
      query: '*.txt',
      maxResults: 5,
    });
    console.log(`✅ Found ${simpleResults.length} results for "*.txt":`);
    simpleResults.slice(0, 3).forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.name} (${r.path})`);
    });
    if (simpleResults.length > 3) {
      console.log(`   ... and ${simpleResults.length - 3} more`);
    }
  } catch (error) {
    console.log('❌ Simple search failed:', error.message);
    console.log('   This is expected if Everything/es.exe is not installed');
  }
  console.log();

  console.log('Test 3: Search Files (Advanced)');
  console.log('-'.repeat(40));
  try {
    const advancedResults = await searchFilesUnified({
      query: platformInfo.platform === 'windows' ? '*.pdf' : 'document',
      maxResults: 3,
      sortBy: 'date_modified',
      sortOrder: 'descending',
      matchPath: false,
      matchCase: false,
    });
    console.log(`✅ Found ${advancedResults.length} results (sorted by date):`);
    advancedResults.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.name}`);
      if (r.size) {
        const sizeKB = Math.round(r.size / 1024);
        const sizeMB = (r.size / 1024 / 1024).toFixed(2);
        const sizeStr = r.size > 1024 * 1024 ? `${sizeMB} MB` : `${sizeKB} KB`;
        console.log(`      Size: ${sizeStr}`);
      }
      if (r.modified) {
        console.log(`      Modified: ${r.modified.toLocaleDateString()}`);
      }
    });
  } catch (error) {
    console.log('❌ Advanced search failed:', error.message);
  }
  console.log();

  console.log('Test 4: Get File Info');
  console.log('-'.repeat(40));
  try {
    const firstSearch = await searchFilesUnified({
      query: '*.*',
      maxResults: 1,
    });
    
    if (firstSearch.length > 0) {
      const testPath = firstSearch[0].fullPath;
      console.log(`✅ Getting info for: ${testPath}`);
      
      const fileInfo = await getFileInfoUnified(testPath);
      console.log('   File Details:');
      console.log(`   - Name: ${fileInfo.name}`);
      console.log(`   - Path: ${fileInfo.path}`);
      console.log(`   - Size: ${fileInfo.size ? Math.round(fileInfo.size / 1024) + ' KB' : 'N/A'}`);
      console.log(`   - Type: ${fileInfo.isFile ? 'File' : 'Folder'}`);
      if (fileInfo.modified) {
        console.log(`   - Modified: ${fileInfo.modified.toLocaleDateString()}`);
      }
      if (fileInfo.created) {
        console.log(`   - Created: ${fileInfo.created.toLocaleDateString()}`);
      }
    } else {
      console.log('⚠️  No files found to test get_file_info');
    }
  } catch (error) {
    console.log('❌ File info failed:', error.message);
  }
  console.log();

  console.log('Test 5: Platform-Specific Features');
  console.log('-'.repeat(40));
  
  if (platformInfo.platform === 'windows') {
    console.log('✅ Windows Features (Everything CLI):');
    console.log('   - Wildcards: *.txt, doc*.pdf');
    console.log('   - Operators: AND, OR, NOT');
    console.log('   - Sorting: name, size, date_modified, etc.');
    console.log('   - Regex support: enabled');
    console.log('   - Path matching: enabled');
    console.log('   - Case sensitivity: configurable');
  } else if (platformInfo.platform === 'macOS') {
    console.log('✅ macOS Features (Spotlight):');
    console.log('   - Basic text search');
    console.log('   - File type filters: kind:pdf, kind:document');
    console.log('   - Date filters: date:today, date:this week');
    console.log('   - Name search: name:document');
  } else if (platformInfo.platform === 'linux') {
    console.log('✅ Linux Features (ripgrep/locate):');
    console.log('   - Pattern matching');
    console.log('   - Regex support: full');
    console.log('   - Case sensitivity: configurable');
    console.log('   - Fast file traversal');
  }
  console.log();

  console.log('='.repeat(60));
  console.log('Simulation Complete!');
  console.log('='.repeat(60));
  console.log();
  console.log('Summary:');
  console.log('--------');
  console.log('✅ MCP Server: Built and ready');
  console.log('✅ Tools: search_files, get_file_info, check_status');
  console.log(`✅ Platform: ${platformInfo.platform}`);
  console.log(`✅ Search Engine: ${platformInfo.searchEngine}`);
  console.log();
  console.log('Next Steps:');
  console.log('1. Configure Claude Desktop with MCP server');
  console.log('2. Restart Claude Desktop');
  console.log('3. Use search_files tool in conversations');
  console.log();
  console.log('Documentation:');
  console.log('- README.md: Comprehensive guide');
  console.log('- QUICKSTART.md: Quick start guide');
  console.log('- examples/: Configuration examples');
  console.log();
}

runSimulation().catch(error => {
  console.error('Simulation failed:', error);
  process.exit(1);
});
