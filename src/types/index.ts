export interface SearchResult {
  name: string;
  path: string;
  fullPath: string;
  size?: number;
  modified?: Date;
  created?: Date;
  attributes?: number;
  extension?: string;
  isFolder: boolean;
  isFile: boolean;
  runCount?: number;
}

export interface SearchOptions {
  query: string;
  maxResults?: number;
  offset?: number;
  sortBy?: 'name' | 'path' | 'size' | 'extension' | 'date_modified' | 'date_created' | 'attributes' | 'run_count';
  sortOrder?: 'ascending' | 'descending';
  matchPath?: boolean;
  matchCase?: boolean;
  matchWholeWord?: boolean;
  regex?: boolean;
  requestFlags?: number;
}

export interface FileInfo {
  path: string;
  name: string;
  size?: number;
  created?: Date;
  modified?: Date;
  accessed?: Date;
  attributes?: number;
  extension?: string;
  isFolder: boolean;
  isFile: boolean;
}

export interface PlatformStatus {
  platform: string;
  searchEngine: string;
  available: boolean;
  version?: string;
  message?: string;
}

export type SortType = 
  | 1  
  | 2  
  | 3  
  | 4  
  | 5  
  | 6  
  | 7  
  | 8  
  | 9  
  | 10 
  | 11 
  | 12 
  | 13 
  | 14 
  | 15 
  | 16 
  | 17 
  | 18 
  | 19 
  | 20 
  | 21 
  | 22 
  | 23 
  | 24 
  | 25 
  | 26 ;

export type RequestFlag = number;

export const RequestFlags = {
  FILE_NAME: 0x00000001 as RequestFlag,
  PATH: 0x00000002 as RequestFlag,
  FULL_PATH_AND_FILE_NAME: 0x00000004 as RequestFlag,
  EXTENSION: 0x00000008 as RequestFlag,
  SIZE: 0x00000010 as RequestFlag,
  DATE_CREATED: 0x00000020 as RequestFlag,
  DATE_MODIFIED: 0x00000040 as RequestFlag,
  DATE_ACCESSED: 0x00000080 as RequestFlag,
  ATTRIBUTES: 0x00000100 as RequestFlag,
  FILE_LIST_FILE_NAME: 0x00000200 as RequestFlag,
  RUN_COUNT: 0x00000400 as RequestFlag,
  DATE_RUN: 0x00000800 as RequestFlag,
  DATE_RECENTLY_CHANGED: 0x00001000 as RequestFlag,
  HIGHLIGHTED_FILE_NAME: 0x00002000 as RequestFlag,
  HIGHLIGHTED_PATH: 0x00004000 as RequestFlag,
  HIGHLIGHTED_FULL_PATH_AND_FILE_NAME: 0x00008000 as RequestFlag,
};

export const SortTypes = {
  NAME_ASCENDING: 1 as SortType,
  NAME_DESCENDING: 2 as SortType,
  PATH_ASCENDING: 3 as SortType,
  PATH_DESCENDING: 4 as SortType,
  SIZE_ASCENDING: 5 as SortType,
  SIZE_DESCENDING: 6 as SortType,
  EXTENSION_ASCENDING: 7 as SortType,
  EXTENSION_DESCENDING: 8 as SortType,
  TYPE_NAME_ASCENDING: 9 as SortType,
  TYPE_NAME_DESCENDING: 10 as SortType,
  DATE_CREATED_ASCENDING: 11 as SortType,
  DATE_CREATED_DESCENDING: 12 as SortType,
  DATE_MODIFIED_ASCENDING: 13 as SortType,
  DATE_MODIFIED_DESCENDING: 14 as SortType,
  ATTRIBUTES_ASCENDING: 15 as SortType,
  ATTRIBUTES_DESCENDING: 16 as SortType,
  FILE_LIST_FILENAME_ASCENDING: 17 as SortType,
  FILE_LIST_FILENAME_DESCENDING: 18 as SortType,
  RUN_COUNT_ASCENDING: 19 as SortType,
  RUN_COUNT_DESCENDING: 20 as SortType,
  DATE_RECENTLY_CHANGED_ASCENDING: 21 as SortType,
  DATE_RECENTLY_CHANGED_DESCENDING: 22 as SortType,
  DATE_ACCESSED_ASCENDING: 23 as SortType,
  DATE_ACCESSED_DESCENDING: 24 as SortType,
  DATE_RUN_ASCENDING: 25 as SortType,
  DATE_RUN_DESCENDING: 26 as SortType,
};

export const EverythingErrorCodes = {
  OK: 0,
  ERROR_MEMORY: 1,
  ERROR_IPC: 2,
  ERROR_REGISTERCLASSEX: 3,
  ERROR_CREATEWINDOW: 4,
  ERROR_CREATETHREAD: 5,
  ERROR_INVALIDINDEX: 6,
  ERROR_INVALIDCALL: 7,
  ERROR_INVALIDREQUEST: 8,
  ERROR_INVALIDPARAMETER: 9,
};
