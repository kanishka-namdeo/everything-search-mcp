#!/usr/bin/env node

import { searchFilesUnified, getFileInfoUnified, getStatusUnified } from '../dist/search/unified.js';

async function test() {
  console.log('Testing Everything Search MCP Server...\n');
  
  try {
    console.log('1. Checking status...');
    const status = await getStatusUnified();
    console.log(JSON.stringify(status, null, 2));
    console.log();
    
    if (!status.available) {
      console.log('Search engine not available. Exiting.');
      return;
    }
    
    console.log('2. Searching for files...');
    const searchResults = await searchFilesUnified({
      query: '*.txt',
      maxResults: 5,
    });
    console.log(`Found ${searchResults.length} results`);
    console.log(JSON.stringify(searchResults, null, 2));
    console.log();
    
    if (searchResults.length > 0) {
      console.log('3. Getting file info...');
      const fileInfo = await getFileInfoUnified(searchResults[0].fullPath);
      console.log(JSON.stringify(fileInfo, null, 2));
    }
    
    console.log('\nAll tests passed!');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

test();
