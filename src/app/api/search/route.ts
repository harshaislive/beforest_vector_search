import { NextResponse } from 'next/server';
import { searchImages } from '@/lib/vector-search';
import { getCachedSearchResults, cacheSearchResults } from '@/lib/redis';
import { getTemporaryLink } from '@/lib/dropbox';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '12', 10);
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');

  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter is required' },
      { status: 400 }
    );
  }

  try {
    // Create cache key including date range
    const cacheKey = `${query}:${startDate || ''}:${endDate || ''}`;
    
    // Check cache first
    let results = await getCachedSearchResults(cacheKey);

    // If not in cache, fetch from vector search API
    if (!results) {
      results = await searchImages({ query });
      await cacheSearchResults(cacheKey, results);
    }

    // Apply date filtering while maintaining similarity-based sorting
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate + 'T00:00:00Z') : new Date(0);
      const end = endDate ? new Date(endDate + 'T23:59:59Z') : new Date();
      
      results = results.filter(result => {
        const modifiedDate = new Date(result.modified_date);
        return modifiedDate >= start && modifiedDate <= end;
      });

      console.log(`Date filtering: ${results.length} results between ${start.toISOString()} and ${end.toISOString()}`);
    }

    // Calculate pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedResults = results.slice(startIndex, endIndex);

    // Get temporary links for the paginated results
    const resultsWithLinks = await Promise.all(
      paginatedResults.map(async (result) => {
        try {
          const temporaryLink = await getTemporaryLink(result.dropbox_path);
          return {
            ...result,
            temporaryLink,
          };
        } catch (error) {
          console.error(`Error getting temporary link for ${result.dropbox_path}:`, error);
          return {
            ...result,
            temporaryLink: null,
          };
        }
      })
    );

    return NextResponse.json({
      results: resultsWithLinks,
      pagination: {
        total: results.length,
        page,
        totalPages: Math.ceil(results.length / limit),
        hasMore: endIndex < results.length,
      },
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 