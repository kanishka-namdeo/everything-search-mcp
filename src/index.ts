#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { searchFilesUnified, getFileInfoUnified, getStatusUnified } from './search/unified.js';
import type { SearchResult, FileInfo, PlatformStatus } from './types/index.js';

const server = new Server(
  {
    name: 'everything-search-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const tools: Tool[] = [
  {
    name: 'search_files',
    description: 'Search for files and folders using Everything (Windows) or platform-specific search engines (macOS Spotlight, Linux ripgrep/locate).',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query. Supports wildcards (*, ?), operators (AND, OR, NOT), and regex on Windows. On macOS, supports Spotlight query syntax. On Linux, supports ripgrep patterns or locate patterns.',
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of results to return (default: 100)',
          default: 100,
        },
        offset: {
          type: 'number',
          description: 'Number of results to skip (for pagination)',
          default: 0,
        },
        sortBy: {
          type: 'string',
          description: 'Sort results by field (Windows only)',
          enum: ['name', 'path', 'size', 'extension', 'date_modified', 'date_created', 'attributes', 'run_count'],
          default: 'name',
        },
        sortOrder: {
          type: 'string',
          description: 'Sort order (Windows only)',
          enum: ['ascending', 'descending'],
          default: 'ascending',
        },
        matchPath: {
          type: 'boolean',
          description: 'Match against full path instead of just filename (Windows only)',
          default: false,
        },
        matchCase: {
          type: 'boolean',
          description: 'Enable case-sensitive matching',
          default: false,
        },
        matchWholeWord: {
          type: 'boolean',
          description: 'Match whole words only (Windows only)',
          default: false,
        },
        regex: {
          type: 'boolean',
          description: 'Enable regex mode',
          default: false,
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_file_info',
    description: 'Get detailed metadata for a specific file or folder.',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Full path to the file or folder',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'check_status',
    description: 'Check the status of the search engine and platform.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools,
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'search_files': {
        const query = args?.query as string;
        const maxResults = (args?.maxResults as number) ?? 100;
        const offset = (args?.offset as number) ?? 0;
        const sortBy = args?.sortBy as 'name' | 'path' | 'size' | 'extension' | 'date_modified' | 'date_created' | 'attributes' | 'run_count';
        const sortOrder = args?.sortOrder as 'ascending' | 'descending';
        const matchPath = args?.matchPath as boolean;
        const matchCase = args?.matchCase as boolean;
        const matchWholeWord = args?.matchWholeWord as boolean;
        const regex = args?.regex as boolean;

        if (!query || query.trim().length === 0) {
          throw new Error('Query is required');
        }

        const results = await searchFilesUnified({
          query,
          maxResults,
          offset,
          sortBy,
          sortOrder,
          matchPath,
          matchCase,
          matchWholeWord,
          regex,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                count: results.length,
                results: results.map(r => ({
                  name: r.name,
                  path: r.path,
                  fullPath: r.fullPath,
                  size: r.size,
                  modified: r.modified,
                  created: r.created,
                  extension: r.extension,
                  isFolder: r.isFolder,
                  isFile: r.isFile,
                })),
              }, null, 2),
            },
          ],
        };
      }

      case 'get_file_info': {
        const path = args?.path as string;

        if (!path || path.trim().length === 0) {
          throw new Error('Path is required');
        }

        const info = await getFileInfoUnified(path);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                info: {
                  name: info.name,
                  path: info.path,
                  size: info.size,
                  created: info.created,
                  modified: info.modified,
                  accessed: info.accessed,
                  attributes: info.attributes,
                  extension: info.extension,
                  isFolder: info.isFolder,
                  isFile: info.isFile,
                },
              }, null, 2),
            },
          ],
        };
      }

      case 'check_status': {
        const status = await getStatusUnified();

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                status: {
                  platform: status.platform,
                  searchEngine: status.searchEngine,
                  available: status.available,
                  version: status.version,
                  message: status.message,
                },
              }, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    let errorMessage = 'An unexpected error occurred';
    let errorCode = 'UNKNOWN_ERROR';

    if (error instanceof Error) {
      errorMessage = error.message;
      if ('code' in error) {
        errorCode = (error as any).code;
      }
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else {
      errorMessage = String(error);
    }

    console.error(`[${name}] Error:`, errorMessage, 'Code:', errorCode);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: errorMessage,
            errorCode,
            tool: name,
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error('Everything Search MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
