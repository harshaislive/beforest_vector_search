import { Dropbox } from 'dropbox';
import fetch from 'node-fetch';

// Polyfill fetch for Node.js environment
if (typeof globalThis.fetch === 'undefined') {
  globalThis.fetch = fetch as any;
}

let dbx: Dropbox | null = null;

export function getDropboxClient(): Dropbox {
  if (!dbx) {
    if (!process.env.DROPBOX_APP_KEY) {
      throw new Error('DROPBOX_APP_KEY environment variable is required');
    }
    
    if (!process.env.DROPBOX_APP_SECRET) {
      throw new Error('DROPBOX_APP_SECRET environment variable is required');
    }
    
    if (!process.env.DROPBOX_REFRESH_TOKEN) {
      throw new Error('DROPBOX_REFRESH_TOKEN environment variable is required');
    }

    dbx = new Dropbox({
      clientId: process.env.DROPBOX_APP_KEY,
      clientSecret: process.env.DROPBOX_APP_SECRET,
      refreshToken: process.env.DROPBOX_REFRESH_TOKEN,
      fetch: fetch as any, // Explicitly provide fetch
    });
  }
  
  return dbx;
}

export interface DropboxFileInfo {
  id: string;
  name: string;
  path: string;
  thumbnailUrl?: string;
  downloadUrl?: string;
  size?: number;
  modified?: string;
}

export async function getFileThumbnail(path: string): Promise<string | null> {
  const client = getDropboxClient();
  
  try {
    const response = await client.filesGetThumbnail({
      path: path,
      format: { '.tag': 'jpeg' } as any,
      size: { '.tag': 'w640h480' } as any
    });
    
    // The response contains binary data in fileBinary property
    const result = response.result as any;
    if (result && result.fileBinary) {
      // Convert binary to base64 data URL
      const buffer = Buffer.from(result.fileBinary, 'binary');
      const base64 = buffer.toString('base64');
      return `data:image/jpeg;base64,${base64}`;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting thumbnail:', error);
    return null;
  }
}

// Alias for the search API consistency
export const getDropboxThumbnail = getFileThumbnail;

export async function getFileDownloadLink(path: string): Promise<string | null> {
  const client = getDropboxClient();
  
  try {
    const response = await client.filesGetTemporaryLink({
      path: path
    });
    
    return response.result.link;
  } catch (error) {
    console.error('Error getting download link:', error);
    return null;
  }
}

// Alias for the search API consistency
export const generateDropboxDownloadLink = getFileDownloadLink;

export async function getFileInfo(path: string): Promise<DropboxFileInfo | null> {
  const client = getDropboxClient();
  
  try {
    const response = await client.filesGetMetadata({
      path: path
    });
    
    const metadata = response.result;
    
    return {
      id: metadata.path_lower || path,
      name: metadata.name,
      path: metadata.path_display || path,
      size: 'size' in metadata ? metadata.size : undefined,
      modified: 'client_modified' in metadata ? metadata.client_modified : undefined,
    };
  } catch (error) {
    console.error('Error getting file info:', error);
    return null;
  }
}

export async function getFilesInfo(paths: string[]): Promise<DropboxFileInfo[]> {
  // Process files concurrently but in batches to avoid rate limiting
  const batchSize = 10;
  const results: DropboxFileInfo[] = [];
  
  for (let i = 0; i < paths.length; i += batchSize) {
    const batch = paths.slice(i, i + batchSize);
    const batchPromises = batch.map(async (path) => {
      try {
        const fileInfo = await getFileInfo(path);
        return fileInfo;
      } catch (error) {
        console.error(`Error processing file ${path}:`, error);
        return null;
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults.filter((result): result is DropboxFileInfo => result !== null));
  }
  
  return results;
}

export async function getFilesWithThumbnails(paths: string[]): Promise<Array<DropboxFileInfo & { thumbnailUrl?: string; downloadUrl?: string }>> {
  const filesInfo = await getFilesInfo(paths);
  
  // Get thumbnails and download links concurrently
  const enrichedFiles = await Promise.all(
    filesInfo.map(async (fileInfo) => {
      const [thumbnailUrl, downloadUrl] = await Promise.all([
        getFileThumbnail(fileInfo.path),
        getFileDownloadLink(fileInfo.path)
      ]);
      
      return {
        ...fileInfo,
        thumbnailUrl: thumbnailUrl || undefined,
        downloadUrl: downloadUrl || undefined
      };
    })
  );
  
  return enrichedFiles;
}

/**
 * Advanced batch processing for search results
 * Gets fresh thumbnails and download links for multiple files concurrently
 */
export async function enhanceSearchResults(
  dropboxPaths: string[],
  batchSize: number = 20
): Promise<Map<string, { thumbnailUrl?: string; downloadUrl?: string }>> {
  const resultMap = new Map<string, { thumbnailUrl?: string; downloadUrl?: string }>();
  
  console.log(`🔄 Enhancing ${dropboxPaths.length} search results with fresh Dropbox URLs`);
  
  // Process in batches to avoid rate limiting
  for (let i = 0; i < dropboxPaths.length; i += batchSize) {
    const batch = dropboxPaths.slice(i, i + batchSize);
    console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(dropboxPaths.length / batchSize)}`);
    
    const batchPromises = batch.map(async (path) => {
      try {
        const [thumbnailUrl, downloadUrl] = await Promise.all([
          getDropboxThumbnail(path).catch(() => null),
          generateDropboxDownloadLink(path).catch(() => null)
        ]);
        
        return {
          path,
          result: {
            thumbnailUrl: thumbnailUrl || undefined,
            downloadUrl: downloadUrl || undefined
          }
        };
      } catch (error) {
        console.error(`⚠️ Error processing ${path}:`, error);
        return {
          path,
          result: {
            thumbnailUrl: undefined,
            downloadUrl: undefined
          }
        };
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    
    // Add to result map
    batchResults.forEach(({ path, result }) => {
      resultMap.set(path, result);
    });
  }
  
  console.log(`✅ Enhanced ${resultMap.size} search results`);
  return resultMap;
} 