'use client';

import { useState, useCallback, useRef } from 'react';
import { MagnifyingGlassIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDebounce } from '@/lib/hooks';

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('query') || '');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const debouncedSearch = useCallback(
    useDebounce((value: string) => {
      const params = new URLSearchParams(searchParams);
      if (value) {
        params.set('query', value);
      } else {
        params.delete('query');
      }
      params.set('page', '1');
      router.push(`/?${params.toString()}`);
    }, 300),
    [router, searchParams]
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/search/image?page=1&limit=12', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Image search failed');
      }

      // Clear the text search query
      setQuery('');
      const params = new URLSearchParams(searchParams);
      params.delete('query');
      params.set('page', '1');
      router.push(`/?${params.toString()}`);

      // Trigger the parent component's onImageSearch callback
      const data = await response.json();
      // We'll handle this in the page component
      window.dispatchEvent(new CustomEvent('image-search-results', { detail: data }));
    } catch (error) {
      console.error('Error searching by image:', error);
      alert('Failed to search by image. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={handleSearch}
            placeholder="Search images..."
            className="w-full px-4 py-2 pl-10 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isUploading}
          />
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
        
        <div className="relative">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            disabled={isUploading}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg 
              ${isUploading 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            disabled={isUploading}
          >
            <PhotoIcon className="h-5 w-5" />
            {isUploading ? 'Uploading...' : 'Search by Image'}
          </button>
        </div>
      </div>
    </div>
  );
} 