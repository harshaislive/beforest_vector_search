import { Dropbox, files } from 'dropbox';
import fetch from 'node-fetch';

if (!process.env.DROPBOX_APP_KEY || !process.env.DROPBOX_APP_SECRET || !process.env.DROPBOX_REFRESH_TOKEN) {
  throw new Error('Missing Dropbox configuration');
}

export const dropboxClient = new Dropbox({
  clientId: process.env.DROPBOX_APP_KEY,
  clientSecret: process.env.DROPBOX_APP_SECRET,
  refreshToken: process.env.DROPBOX_REFRESH_TOKEN,
  fetch: fetch as unknown as typeof fetch,
});

export async function getTemporaryLink(path: string): Promise<string> {
  try {
    const response = await dropboxClient.filesGetTemporaryLink({ path });
    return response.result.link;
  } catch (error) {
    console.error('Error getting temporary link:', error);
    throw error;
  }
}

const DEFAULT_SIZE: files.ThumbnailSize = {
  '.tag': 'w640h480'
};

export async function getThumbnail(path: string, size: files.ThumbnailSize = DEFAULT_SIZE): Promise<string> {
  try {
    const response = await dropboxClient.filesGetThumbnail({
      path,
      format: {
        '.tag': 'jpeg'
      } as files.ThumbnailFormat,
      size,
      mode: {
        '.tag': 'fitone_bestfit'
      } as files.ThumbnailMode
    });
    
    if (response.status === 200 && response.result) {
      // The response includes a fileBinary field when using the Node SDK
      const fileData = (response.result as unknown as { fileBinary: Buffer }).fileBinary;
      const buffer = Buffer.from(fileData || '');
      return `data:image/jpeg;base64,${buffer.toString('base64')}`;
    }
    throw new Error('Failed to get thumbnail');
  } catch (error) {
    console.error('Error getting thumbnail:', error);
    // Fallback to temporary link if thumbnail generation fails
    return getTemporaryLink(path);
  }
}

export async function getOptimizedImageUrl(path: string, type: 'thumbnail' | 'preview' | 'full' = 'preview'): Promise<string> {
  try {
    switch (type) {
      case 'thumbnail':
        // Small thumbnails for grid view
        return getThumbnail(path, { '.tag': 'w256h256' });
      case 'preview':
        // Medium size for preview modal
        return getThumbnail(path, { '.tag': 'w1024h768' });
      case 'full':
        // Full resolution for downloads
        return getTemporaryLink(path);
      default:
        return getTemporaryLink(path);
    }
  } catch (error) {
    console.error('Error getting optimized image URL:', error);
    return getTemporaryLink(path);
  }
}

export async function getDownloadLink(path: string): Promise<string> {
  return getTemporaryLink(path);
} 