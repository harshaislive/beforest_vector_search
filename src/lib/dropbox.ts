import { Dropbox } from 'dropbox';
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

export async function getThumbnail(path: string): Promise<string> {
  try {
    // Instead of getting thumbnails directly, we'll use the temporary link
    const response = await dropboxClient.filesGetTemporaryLink({ path });
    return response.result.link;
  } catch (error) {
    console.error('Error getting thumbnail:', error);
    throw error;
  }
}

export async function getDownloadLink(path: string): Promise<string> {
  try {
    const response = await dropboxClient.filesGetTemporaryLink({ path });
    return response.result.link;
  } catch (error) {
    console.error('Error getting download link:', error);
    throw error;
  }
} 