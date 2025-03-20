'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import SearchBar from './SearchBar';
import ImageGrid from './ImageGrid';
import SortControl, { SortDirection, SortType } from './SortControl';
import { SearchResult } from '@/lib/types';

interface SearchResponse {
  results: (SearchResult & { temporaryLink: string | null })[];
  pagination: {
    total: number;
    page: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export default function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('query');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const storedSortDirection = searchParams.get('sort_direction') as SortDirection || 'desc';
  const storedSortType = searchParams.get('sort_type') as SortType || 'date';
  
  const [isLoading, setIsLoading] = useState(false);
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(storedSortDirection);
  const [sortType, setSortType] = useState<SortType>(storedSortType);

  // Handle sort change
  const handleSortChange = (type: SortType, direction: SortDirection) => {
    setSortType(type);
    setSortDirection(direction);
    
    // Update URL with new sort parameters and trigger a new search
    const params = new URLSearchParams(searchParams);
    params.set('sort_type', type);
    params.set('sort_direction', direction);
    params.set('page', '1'); // Reset to first page when sort changes
    router.push(`/?${params.toString()}`);
  };

  useEffect(() => {
    async function performSearch() {
      if (!query) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const certaintyThreshold = searchParams.get('certainty_threshold');
        const searchUrl = new URL('/api/search', window.location.origin);
        searchUrl.searchParams.set('query', query);
        searchUrl.searchParams.set('page', page.toString());
        searchUrl.searchParams.set('limit', '12');
        searchUrl.searchParams.set('sort_direction', sortDirection);
        searchUrl.searchParams.set('sort_type', sortType);
        
        if (certaintyThreshold) {
          searchUrl.searchParams.set('certainty_threshold', certaintyThreshold);
        }

        const response = await fetch(searchUrl.toString());
        if (!response.ok) {
          throw new Error('Search failed');
        }
        const data = await response.json();
        setSearchResponse(data);
      } catch (err) {
        setError('Failed to load search results');
        console.error('Search error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    performSearch();
  }, [query, page, searchParams, sortDirection, sortType]);

  // Handle image search results
  useEffect(() => {
    const handleImageSearchResults = (event: CustomEvent<SearchResponse>) => {
      setSearchResponse(event.detail);
    };

    window.addEventListener('image-search-results', handleImageSearchResults as EventListener);

    return () => {
      window.removeEventListener('image-search-results', handleImageSearchResults as EventListener);
    };
  }, []);

  return (
    <>
      <div className="flex flex-col items-center mb-8 px-4 sm:px-0">
        <h1 className="font-arizona text-[28px] sm:text-[32px] text-beforest-earth tracking-wide text-center">
          Image Search
        </h1>
      </div>
      
      <SearchBar />

      {error && (
        <div className="mt-8 px-4 sm:px-0 text-center text-beforest-red font-arizona-sans">
          {error}
        </div>
      )}
      
      {searchResponse && searchResponse.results.length > 0 && (
        <div className="flex justify-end mt-6 px-4 sm:px-6 lg:px-8">
          <SortControl 
            onSortChange={handleSortChange} 
            initialDirection={sortDirection}
            initialType={sortType}
            isSearchResults={true}
          />
        </div>
      )}

      <div className="mt-4 px-4 sm:px-6 lg:px-8">
        <ImageGrid
          images={searchResponse?.results || []}
          isLoading={isLoading}
          showScores={true}
        />
      </div>

      {searchResponse && searchResponse.pagination.totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2 px-4 sm:px-0 overflow-x-auto pb-2">
          {Array.from({ length: searchResponse.pagination.totalPages }).map((_, i) => (
            <button
              key={i + 1}
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.set('page', (i + 1).toString());
                window.history.pushState(null, '', `?${params.toString()}`);
              }}
              className={`px-3 sm:px-4 py-2 rounded font-arizona text-[13px] sm:text-[14px] uppercase tracking-wide transition-colors flex-shrink-0
                ${page === i + 1
                  ? 'bg-beforest-green text-white'
                  : 'bg-white text-beforest-earth hover:bg-beforest-gray'
                }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </>
  );
}