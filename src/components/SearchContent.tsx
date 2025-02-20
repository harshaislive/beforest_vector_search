'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import SearchBar from './SearchBar';
import ImageGrid from './ImageGrid';
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
  const searchParams = useSearchParams();
  const query = searchParams.get('query');
  const page = parseInt(searchParams.get('page') || '1', 10);
  
  const [isLoading, setIsLoading] = useState(false);
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function performSearch() {
      if (!query) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/search?query=${encodeURIComponent(query)}&page=${page}&limit=12`);
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
  }, [query, page]);

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
        <div className="w-[140px] sm:w-[180px] h-[46px] sm:h-[60px] relative mb-4 sm:mb-6">
          <Image
            src="https://beforest.co/wp-content/uploads/2024/10/23-Beforest-Black-with-Tagline.png"
            alt="Beforest Logo"
            fill
            priority
            className="object-contain"
          />
        </div>
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

      <div className="mt-8 px-4 sm:px-6 lg:px-8">
        <ImageGrid
          images={searchResponse?.results || []}
          isLoading={isLoading}
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