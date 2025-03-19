import { NextResponse } from 'next/server';
import { searchImages } from '@/lib/vector-search';
import { getCachedSearchResults, cacheSearchResults } from '@/lib/redis';
import { getOptimizedImageUrl } from '@/lib/dropbox';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '12', 10);
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');
  const certaintyThreshold = searchParams.get('certainty_threshold');

  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter is required' },
      { status: 400 }
    );
  }

  try {
    // Create cache key including date range and certainty threshold
    const cacheKey = `${query}:${startDate || ''}:${endDate || ''}:${certaintyThreshold || '0.5'}`;
    
    // Check cache first
    let results = await getCachedSearchResults(cacheKey);

    // If not in cache, fetch from vector search API
    if (!results) {
      try {
        console.log('Fetching from vector search API with query:', query);
        results = await searchImages({ 
          query,
          certainty_threshold: certaintyThreshold ? parseFloat(certaintyThreshold) : 0.5,
          exact_match_threshold: 0.95,
          similarity_weight: 0.6,
          recency_weight: 0.2,
          source_weight: 0.2,
          include_vectors: false,
          limit: 144  // Using a large limit for initial fetch, we'll paginate later
        });
        
        if (!results || !Array.isArray(results)) {
          console.error('Invalid results format:', results);
          throw new Error('Invalid response format from search API');
        }

        if (results.length === 0) {
          console.log('No results found for query:', query);
        } else {
          console.log(`Found ${results.length} results for query:`, query);
        }

        await cacheSearchResults(cacheKey, results);
      } catch (error) {
        console.error('Vector search error:', {
          query,
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
        
        return NextResponse.json(
          { 
            error: 'Search failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
            query: query
          },
          { status: 500 }
        );
      }
    }

    // Filter results by date if date range is provided
    if (startDate || endDate) {
      const startDateTime = startDate ? new Date(startDate + 'T00:00:00Z') : null;
      const endDateTime = endDate ? new Date(endDate + 'T23:59:59Z') : null;
      
      results = results.filter(result => {
        const modifiedDate = new Date(result.modified_date);
        if (startDateTime && endDateTime) {
          return modifiedDate >= startDateTime && modifiedDate <= endDateTime;
        } else if (startDateTime) {
          return modifiedDate >= startDateTime;
        } else if (endDateTime) {
          return modifiedDate <= endDateTime;
        }
        return true;
      });
    }

    // Calculate pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedResults = results.slice(startIndex, endIndex);

    // Get temporary links for the paginated results
    const resultsWithLinks = await Promise.all(
      paginatedResults.map(async (result) => {
        try {
          const [thumbnailLink, previewLink] = await Promise.all([
            getOptimizedImageUrl(result.dropbox_path, 'thumbnail'),
            getOptimizedImageUrl(result.dropbox_path, 'preview')
          ]);
          
          return {
            ...result,
            temporaryLink: previewLink,
            thumbnailUrl: thumbnailLink
          };
        } catch (error) {
          console.error(`Error getting optimized URLs for ${result.dropbox_path}:`, error);
          return {
            ...result,
            temporaryLink: null,
            thumbnailUrl: null
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