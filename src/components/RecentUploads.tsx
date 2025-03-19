'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ImageGrid from './ImageGrid';
import { SearchResult } from '@/lib/types';

interface RecentUploadsResponse {
  items: (SearchResult & { temporaryLink: string | null })[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export default function RecentUploads() {
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10);
  
  const [isLoading, setIsLoading] = useState(false);
  const [uploadsResponse, setUploadsResponse] = useState<RecentUploadsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRecentUploads() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/recent-uploads?page=${page}&page_size=20`);
        if (!response.ok) {
          throw new Error('Failed to fetch recent uploads');
        }
        const data = await response.json();
        setUploadsResponse(data);
      } catch (err) {
        setError('Failed to load recent uploads');
        console.error('Recent uploads error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRecentUploads();
  }, [page]);

  return (
    <>
      <div className="flex flex-col items-center mb-8 px-4 sm:px-0">
        <h1 className="font-arizona text-[28px] sm:text-[32px] text-beforest-earth tracking-wide text-center">
          Recent Uploads
        </h1>
      </div>

      {error && (
        <div className="mt-8 px-4 sm:px-0 text-center text-beforest-red font-arizona-sans">
          {error}
        </div>
      )}

      <div className="mt-8 px-4 sm:px-6 lg:px-8">
        <ImageGrid
          images={uploadsResponse?.items.map(item => ({
            ...item,
            dropbox_path: item.dropbox_path,
            thumbnail_url: item.thumbnail_url
          })) || []}
          isLoading={isLoading}
        />
      </div>

      {uploadsResponse && uploadsResponse.total_pages > 1 && (
        <div className="mt-8 flex justify-center gap-4 px-4 sm:px-0">
          <button
            onClick={() => {
              const params = new URLSearchParams(searchParams);
              params.set('page', (page - 1).toString());
              window.history.pushState(null, '', `?${params.toString()}`);
            }}
            disabled={!uploadsResponse.has_previous}
            className={`px-4 py-2 rounded font-arizona text-[14px] uppercase tracking-wide transition-colors
              ${!uploadsResponse.has_previous
                ? 'bg-beforest-gray/50 text-beforest-earth/50 cursor-not-allowed'
                : 'bg-white text-beforest-earth hover:bg-beforest-gray'
              }`}
          >
            Previous
          </button>
          
          <span className="px-4 py-2 font-arizona text-[14px] text-beforest-earth">
            Page {page} of {uploadsResponse.total_pages}
          </span>

          <button
            onClick={() => {
              const params = new URLSearchParams(searchParams);
              params.set('page', (page + 1).toString());
              window.history.pushState(null, '', `?${params.toString()}`);
            }}
            disabled={!uploadsResponse.has_next}
            className={`px-4 py-2 rounded font-arizona text-[14px] uppercase tracking-wide transition-colors
              ${!uploadsResponse.has_next
                ? 'bg-beforest-gray/50 text-beforest-earth/50 cursor-not-allowed'
                : 'bg-white text-beforest-earth hover:bg-beforest-gray'
              }`}
          >
            Next
          </button>
        </div>
      )}
    </>
  );
} 