import Redis from 'ioredis';
import { SearchResult } from './types';

if (!process.env.REDIS_URL) {
  throw new Error('Missing Redis configuration');
}

export const redis = new Redis(process.env.REDIS_URL);

// Cache keys
const SEARCH_RESULTS_PREFIX = 'search:results:';
const IMAGE_PREVIEW_PREFIX = 'image:preview:';

// TTL values (in seconds)
const SEARCH_RESULTS_TTL = 300; // 5 minutes
const IMAGE_PREVIEW_TTL = 3600; // 1 hour

export async function cacheSearchResults(query: string, results: SearchResult[]): Promise<void> {
  const key = `${SEARCH_RESULTS_PREFIX}${query}`;
  await redis.setex(key, SEARCH_RESULTS_TTL, JSON.stringify(results));
}

export async function getCachedSearchResults(query: string): Promise<SearchResult[] | null> {
  const key = `${SEARCH_RESULTS_PREFIX}${query}`;
  const cached = await redis.get(key);
  return cached ? JSON.parse(cached) : null;
}

export async function cacheImagePreview(path: string, previewUrl: string): Promise<void> {
  const key = `${IMAGE_PREVIEW_PREFIX}${path}`;
  await redis.setex(key, IMAGE_PREVIEW_TTL, previewUrl);
}

export async function getCachedImagePreview(path: string): Promise<string | null> {
  const key = `${IMAGE_PREVIEW_PREFIX}${path}`;
  return redis.get(key);
}

// Helper function to generate cache key for batch operations
export function getBatchPreviewKey(paths: string[]): string[] {
  return paths.map(path => `${IMAGE_PREVIEW_PREFIX}${path}`);
}

// Get multiple image previews at once
export async function getCachedImagePreviews(paths: string[]): Promise<(string | null)[]> {
  const keys = getBatchPreviewKey(paths);
  return redis.mget(...keys);
} 