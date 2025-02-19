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
  const [dateRange, setDateRange] = useState({
    start: searchParams.get('start_date') || '',
    end: searchParams.get('end_date') || ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const debouncedSearch = useCallback(
    (value: string, dates: { start: string; end: string }) => {
      const params = new URLSearchParams(searchParams);
      if (value) {
        params.set('query', value);
      } else {
        params.delete('query');
      }
      if (dates.start) {
        params.set('start_date', dates.start);
      } else {
        params.delete('start_date');
      }
      if (dates.end) {
        params.set('end_date', dates.end);
      } else {
        params.delete('end_date');
      }
      params.set('page', '1');
      router.push(`/?${params.toString()}`);
    },
    [router, searchParams]
  );

  const debouncedSearchHandler = useDebounce(debouncedSearch, 300);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearchHandler(value, dateRange);
  };

  const handleDateChange = (field: 'start' | 'end', value: string) => {
    const newDateRange = { ...dateRange, [field]: value };
    setDateRange(newDateRange);
    debouncedSearch(value, newDateRange);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    // Add date range to the image search if selected
    const searchUrl = new URL('/api/search/image', window.location.origin);
    searchUrl.searchParams.set('page', '1');
    searchUrl.searchParams.set('limit', '12');
    if (dateRange.start) searchUrl.searchParams.set('start_date', dateRange.start);
    if (dateRange.end) searchUrl.searchParams.set('end_date', dateRange.end);

    try {
      const response = await fetch(searchUrl.toString(), {
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
      if (dateRange.start) params.set('start_date', dateRange.start);
      if (dateRange.end) params.set('end_date', dateRange.end);
      router.push(`/?${params.toString()}`);

      const data = await response.json();
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
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Text Search */}
        <div className="flex-1">
          <div className="relative group">
            <input
              type="text"
              value={query}
              onChange={handleSearch}
              placeholder="Search by keywords..."
              className="w-full px-4 py-3.5 pl-11 text-[18px] font-arizona-sans text-beforest-earth placeholder-beforest-charcoal/40
                border-2 border-beforest-gray/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-beforest-olive/30 focus:border-beforest-olive
                bg-white shadow-sm transition-all duration-200 group-hover:border-beforest-olive/60"
              disabled={isUploading}
            />
            <MagnifyingGlassIcon className="absolute left-3 top-3.5 h-6 w-6 text-beforest-charcoal/60 group-hover:text-beforest-olive transition-colors duration-200" />
          </div>
        </div>

        {/* Image Search Button */}
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
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 font-arizona text-[15px] uppercase tracking-wide rounded-xl
              shadow-sm transition-all duration-200 border-2 ${
                isUploading 
                  ? 'bg-beforest-gray/20 text-beforest-charcoal/50 cursor-not-allowed border-beforest-gray/30' 
                  : 'bg-white text-beforest-earth border-beforest-olive/60 hover:bg-beforest-olive/5 hover:border-beforest-olive hover:text-beforest-olive'
              }`}
            disabled={isUploading}
          >
            <PhotoIcon className="h-5 w-5" />
            {isUploading ? 'Uploading...' : 'Upload Image to Search'}
          </button>
        </div>
      </div>

      {/* Date Range Filters */}
      <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-xl border-2 border-beforest-gray/60">
        <span className="font-arizona text-beforest-earth text-[15px] uppercase tracking-wide">Filter by date</span>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => handleDateChange('start', e.target.value)}
            className="px-3 py-2 rounded-lg border-2 border-beforest-gray/40 focus:outline-none focus:ring-2 focus:ring-beforest-olive/30 focus:border-beforest-olive
              font-arizona-sans text-sm text-beforest-earth bg-beforest-offwhite hover:border-beforest-olive/60 transition-all duration-200"
          />
          <span className="font-arizona text-beforest-earth/60">to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => handleDateChange('end', e.target.value)}
            className="px-3 py-2 rounded-lg border-2 border-beforest-gray/40 focus:outline-none focus:ring-2 focus:ring-beforest-olive/30 focus:border-beforest-olive
              font-arizona-sans text-sm text-beforest-earth bg-beforest-offwhite hover:border-beforest-olive/60 transition-all duration-200"
          />
        </div>
      </div>
    </div>
  );
} 