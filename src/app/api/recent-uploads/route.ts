import { NextResponse } from 'next/server';
import { getOptimizedImageUrl } from '@/lib/dropbox';
import { SearchResult } from '@/lib/types';

const DEFAULT_PAGE_SIZE = 20;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page') || '1';
  
  // Use environment variable with fallback to query param or default value
  const defaultPageSize = process.env.NEXT_PUBLIC_RECENT_UPLOADS_PER_PAGE 
    ? parseInt(process.env.NEXT_PUBLIC_RECENT_UPLOADS_PER_PAGE, 10)
    : DEFAULT_PAGE_SIZE;
    
  // Safely handle the page_size parameter
  const pageSizeParam = searchParams.get('page_size');
  const pageSize = pageSizeParam ? parseInt(pageSizeParam, 10) : defaultPageSize;

  try {
    const response = await fetch(
      `https://weaviatefilesearch-production.up.railway.app/recent_uploads?page=${page}&page_size=${pageSize}&include_vectors=false`,
      {
        headers: {
          'accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch recent uploads');
    }

    const data = await response.json();

    // Get temporary links for all images concurrently
    const itemsWithLinks = await Promise.all(
      data.items.map(async (item: SearchResult) => {
        try {
          const [thumbnailLink, previewLink] = await Promise.all([
            getOptimizedImageUrl(item.dropbox_path, 'thumbnail'),
            getOptimizedImageUrl(item.dropbox_path, 'preview')
          ]);
          
          return {
            ...item,
            temporaryLink: previewLink,
            thumbnailUrl: thumbnailLink
          };
        } catch (error) {
          console.error(`Error getting optimized URLs for ${item.dropbox_path}:`, error);
          return {
            ...item,
            temporaryLink: null,
            thumbnailUrl: null
          };
        }
      })
    );

    return NextResponse.json({
      ...data,
      items: itemsWithLinks
    });
  } catch (error) {
    console.error('Error fetching recent uploads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent uploads' },
      { status: 500 }
    );
  }
} 