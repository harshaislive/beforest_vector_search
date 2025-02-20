'use client';

import { useState, useRef, useEffect } from 'react';
import { MagnifyingGlassIcon, PhotoIcon, QuestionMarkCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useRouter, useSearchParams } from 'next/navigation';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import "./date-picker.css";
import SearchSuggestions from './SearchSuggestions';
import Image from 'next/image';
import HelpModal from './HelpModal';

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('query') || '');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageFile = useRef<File | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [similarityThreshold, setSimilarityThreshold] = useState(0.5);
  const [imageSearchStatus, setImageSearchStatus] = useState<'idle' | 'searching' | 'error'>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageDescription, setImageDescription] = useState<string | null>(null);
  const [isInitialImageSearch, setIsInitialImageSearch] = useState(true);

  // Update similarity threshold when URL params change
  useEffect(() => {
    const threshold = searchParams.get('certainty_threshold');
    if (threshold) {
      setSimilarityThreshold(parseFloat(threshold));
    }
  }, [searchParams]);

  const handleSimilarityChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setSimilarityThreshold(value);
    
    // Update URL params
    const params = new URLSearchParams(searchParams);
    params.set('certainty_threshold', value.toString());
    params.set('page', '1'); // Reset to first page

    // Trigger new search with updated threshold
    if (query) {
      // For text search
      params.set('query', query);
      router.push(`/?${params.toString()}`);
    } else if (searchParams.get('search_type') === 'image' && imageFile.current) {
      // For image search
      setImageSearchStatus('searching');
      const formData = new FormData();
      formData.append('file', imageFile.current);

      try {
        const searchUrl = new URL('/api/search/image', window.location.origin);
        searchUrl.searchParams.set('page', '1');
        searchUrl.searchParams.set('limit', '12');
        searchUrl.searchParams.set('certainty_threshold', value.toString());

        const response = await fetch(searchUrl.toString(), {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) throw new Error('Image search failed');
        const data = await response.json();
        window.dispatchEvent(new CustomEvent('image-search-results', { detail: data }));
        params.set('search_type', 'image');
        window.history.replaceState({}, '', `/?${params.toString()}`);
      } catch (error) {
        console.error('Error updating search:', error);
        setImageSearchStatus('error');
      } finally {
        setImageSearchStatus('idle');
      }
    } else {
      // Just update URL if no active search
      window.history.replaceState({}, '', `/?${params.toString()}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      const params = new URLSearchParams(searchParams);
      params.set('query', query);
      params.set('certainty_threshold', similarityThreshold.toString());
      params.set('page', '1');
      router.push(`/?${params.toString()}`);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    // Clear image search state when performing text search
    imageFile.current = null;
    setPreviewUrl(null);
    setImageDescription(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    const newPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(newPreviewUrl);

    setIsUploading(true);
    setImageSearchStatus('searching');
    setIsInitialImageSearch(true);
    
    // Store the file for pagination
    imageFile.current = file;

    try {
      // Add date range and similarity threshold to the image search
      const searchUrl = new URL('/api/search/image', window.location.origin);
      const currentPage = searchParams.get('page') || '1';
      searchUrl.searchParams.set('page', currentPage);
      searchUrl.searchParams.set('limit', '12');
      searchUrl.searchParams.set('certainty_threshold', similarityThreshold.toString());

      // Create form data for both requests
      const descriptionFormData = new FormData();
      descriptionFormData.append('file', file);

      const searchFormData = new FormData();
      searchFormData.append('file', file);
      
      const [descriptionResponse, searchResponse] = await Promise.all([
        fetch('/api/describe-image', {
          method: 'POST',
          body: descriptionFormData,
        }),
        fetch(searchUrl.toString(), {
          method: 'POST',
          body: searchFormData,
        })
      ]);

      if (descriptionResponse.ok) {
        const { description } = await descriptionResponse.json();
        setImageDescription(description);
      }

      if (!searchResponse.ok) {
        throw new Error('Image search failed');
      }

      const data = await searchResponse.json();

      // Update URL params
      setQuery('');
      const params = new URLSearchParams(searchParams);
      params.delete('query');
      params.set('certainty_threshold', similarityThreshold.toString());
      params.set('page', currentPage);
      params.set('search_type', 'image');
      router.push(`/?${params.toString()}`);

      // Dispatch results
      window.dispatchEvent(new CustomEvent('image-search-results', { detail: data }));
      setImageSearchStatus('idle');
    } catch (error) {
      console.error('Error searching by image:', error);
      alert('Failed to search by image. Please try again.');
      setImageSearchStatus('error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Update effect to include similarity threshold in pagination
  useEffect(() => {
    const searchType = searchParams.get('search_type');
    const page = searchParams.get('page') || '1';
    
    // Skip the first image search since handleImageUpload already does it
    if (searchType === 'image' && imageFile.current && !isInitialImageSearch) {
      setImageSearchStatus('searching');
      const formData = new FormData();
      formData.append('file', imageFile.current);

      const searchUrl = new URL('/api/search/image', window.location.origin);
      searchUrl.searchParams.set('page', page);
      searchUrl.searchParams.set('limit', '12');
      searchUrl.searchParams.set('certainty_threshold', similarityThreshold.toString());

      fetch(searchUrl.toString(), {
        method: 'POST',
        body: formData,
      })
        .then(response => {
          if (!response.ok) throw new Error('Image search failed');
          return response.json();
        })
        .then(data => {
          window.dispatchEvent(new CustomEvent('image-search-results', { detail: data }));
          setImageSearchStatus('idle');
        })
        .catch(error => {
          console.error('Error during image search pagination:', error);
          alert('Failed to load page. Please try again.');
          setImageSearchStatus('error');
        });
    }
    // Set flag to false after first render
    setIsInitialImageSearch(false);
  }, [searchParams, similarityThreshold, isInitialImageSearch]);

  // Add cleanup for preview URL
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className="relative">
      <div className="w-full max-w-3xl mx-auto space-y-4 px-4 sm:px-0">
        {/* Search Bar and Upload Button */}
        <div className="flex flex-col gap-3">
          <div className="relative">
            <div className="relative">
              <p className="absolute -top-5 left-0 text-[11px] text-beforest-charcoal/60 font-arizona-flare">
                Press Enter to search
              </p>
              <input
                type="text"
                value={query}
                onChange={handleSearch}
                onKeyDown={handleKeyDown}
                placeholder={imageSearchStatus === 'searching' ? 'Searching by image...' : 'Search by keywords...'}
                className="w-full px-4 py-3 pl-11 pr-[100px] text-[15px] font-arizona-flare text-beforest-earth placeholder-beforest-charcoal/40
                  border-2 border-beforest-gray/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-beforest-olive/30 focus:border-beforest-olive
                  bg-white shadow-sm transition-all duration-200 hover:border-beforest-olive/60"
                disabled={isUploading || imageSearchStatus === 'searching'}
              />
            </div>

            {/* Search and Upload Buttons */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {/* Search Button */}
              {imageSearchStatus === 'searching' ? (
                <div className="h-5 w-5 border-2 border-beforest-olive/30 border-t-beforest-olive rounded-full animate-spin" />
              ) : (
                <button 
                  onClick={() => {
                    const params = new URLSearchParams(searchParams);
                    params.set('query', query);
                    params.set('certainty_threshold', similarityThreshold.toString());
                    params.set('page', '1');
                    router.push(`/?${params.toString()}`);
                  }}
                  className="p-2 rounded-md transition-all duration-200 bg-beforest-olive/5 text-beforest-olive hover:bg-beforest-olive/10 active:scale-95"
                  aria-label="Search"
                >
                  <MagnifyingGlassIcon className="h-5 w-5" />
                </button>
              )}

              {/* Image Upload Button */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={isUploading || imageSearchStatus === 'searching'}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    isUploading || imageSearchStatus === 'searching'
                    ? 'bg-beforest-gray/20 text-beforest-charcoal/50 cursor-not-allowed'
                    : 'bg-beforest-olive/5 text-beforest-olive hover:bg-beforest-olive/10 active:scale-95'
                  }`}
                  disabled={isUploading || imageSearchStatus === 'searching'}
                  aria-label="Upload image to search"
                >
                  <PhotoIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Image Preview with Description */}
          {previewUrl && (
            <div className="relative bg-white p-3 rounded-lg border border-beforest-gray/20">
              <div className="flex items-start gap-3">
                <div className="relative w-16 h-16 sm:w-24 sm:h-24 flex-shrink-0 rounded-md overflow-hidden bg-beforest-gray/10">
                  <Image
                    src={previewUrl}
                    alt="Search reference"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div 
                        className={`font-arizona-flare text-beforest-earth text-sm prose prose-sm max-w-none prose-beforest ${!isDescriptionExpanded && 'line-clamp-2'}`}
                        dangerouslySetInnerHTML={{ 
                          __html: imageDescription ? 
                            imageDescription
                              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                              .replace(/\*(.*?)\*/g, '<em>$1</em>')
                              .replace(/\n/g, '<br />') 
                            : "Analyzing image..." 
                        }}
                      />
                      {imageDescription && imageDescription.length > 100 && (
                        <button
                          onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                          className="mt-1 text-xs text-beforest-olive hover:text-beforest-olive/80 transition-colors"
                        >
                          {isDescriptionExpanded ? 'Show less' : 'Read more'}
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        if (previewUrl) {
                          URL.revokeObjectURL(previewUrl);
                        }
                        setPreviewUrl(null);
                        setImageDescription(null);
                        setIsDescriptionExpanded(false);
                        imageFile.current = null;
                        const params = new URLSearchParams(searchParams);
                        params.delete('search_type');
                        router.push(`/?${params.toString()}`);
                      }}
                      className="p-1.5 -m-1 hover:bg-beforest-gray/10 rounded-full transition-colors flex-shrink-0"
                      aria-label="Clear image search"
                    >
                      <XMarkIcon className="w-5 h-5 text-beforest-charcoal/60" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Search Controls - Compact Layout */}
        <div className="flex flex-col sm:flex-row gap-3 bg-white rounded-lg border border-beforest-gray/20 p-3">
          {/* Similarity Threshold */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <span className="font-arizona-flare text-beforest-earth text-xs uppercase tracking-wide">
                Similarity
              </span>
              <span className="font-arizona-flare text-sm bg-beforest-olive/10 text-beforest-olive px-2 py-0.5 rounded-full">
                {Math.round(similarityThreshold * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={similarityThreshold}
              onChange={handleSimilarityChange}
              className="w-full h-1.5 bg-beforest-olive/20 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-beforest-olive
                [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-all
                [&::-webkit-slider-thumb]:hover:scale-125"
            />
          </div>

          {/* Date Range - Compact */}
          <div className="flex-shrink-0 flex items-center gap-2 border-l border-beforest-gray/20 pl-3 opacity-50">
            <div className="relative">
              <DatePicker
                selected={null}
                onChange={() => {}}
                placeholderText="Start date"
                className="w-28 px-2 py-1 text-sm font-arizona-flare text-beforest-earth border border-beforest-gray/40 rounded focus:outline-none focus:border-beforest-olive cursor-not-allowed"
                disabled
              />
              <div className="absolute -top-5 left-0 whitespace-nowrap">
                <span className="text-[10px] font-arizona-flare text-beforest-olive/80 bg-white px-1 rounded">Coming soon</span>
              </div>
            </div>
            <span className="text-beforest-charcoal/40">-</span>
            <DatePicker
              selected={null}
              onChange={() => {}}
              placeholderText="End date"
              className="w-28 px-2 py-1 text-sm font-arizona-flare text-beforest-earth border border-beforest-gray/40 rounded focus:outline-none focus:border-beforest-olive cursor-not-allowed"
              disabled
            />
          </div>
        </div>

        {/* Search Suggestions */}
        <SearchSuggestions
          currentQuery={query}
          currentImage={imageFile.current}
          onSuggestionClick={(suggestion) => {
            setQuery(suggestion);
            {
              const params = new URLSearchParams(searchParams);
              params.set('query', suggestion);
              params.set('certainty_threshold', similarityThreshold.toString());
              params.set('page', '1');
              router.push(`/?${params.toString()}`);
            }
          }}
        />
      </div>

      {/* Help Button */}
      <div className="fixed bottom-6 right-6 z-40 group">
        <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-white rounded-lg border border-beforest-gray/20 shadow-lg
          opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-1 group-hover:translate-y-0">
          <p className="text-xs text-beforest-charcoal/80 font-arizona-flare">
            Click for search tips!
            <span className="block mt-1 text-beforest-olive">Try: &quot;morning fog in forest&quot;</span>
          </p>
        </div>
        <button
          onClick={() => setIsHelpOpen(true)}
          className="bg-white rounded-full p-2.5 shadow-lg border-2 border-beforest-olive/60 hover:border-beforest-olive transition-colors flex items-center gap-2"
          aria-label="Search Help"
        >
          <QuestionMarkCircleIcon className="h-6 w-6 text-beforest-olive" />
          <span className="text-sm text-beforest-olive font-arizona-flare pr-2">Need help?</span>
        </button>
      </div>

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
} 
