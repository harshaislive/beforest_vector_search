import { NextRequest, NextResponse } from 'next/server';
import { searchByImage } from '@/lib/vector-search';
import { getTemporaryLink } from '@/lib/dropbox';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const searchParams = new URL(request.url).searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);

    // Perform the image search
    const results = await searchByImage(file, {
      limit: 144, // Always fetch max results for pagination
    });

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
    console.error('Image search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 