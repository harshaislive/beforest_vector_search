'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { MagnifyingGlassIcon, PhotoIcon, QuestionMarkCircleIcon, CalendarIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDebounce } from '@/lib/hooks';
import HelpModal from './HelpModal';
import * as Slider from '@radix-ui/react-slider';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import "./date-picker.css";
import SearchSuggestions from './SearchSuggestions';
import Image from 'next/image';

function formatDateForAPI(date: Date | null): string {
  if (!date) return '';
  // Ensure consistent timezone handling by using UTC
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    .toISOString()
    .split('T')[0];
}

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
  const imageFile = useRef<File | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [similarityThreshold, setSimilarityThreshold] = useState(() => {
    const defaultThreshold = 0.5;
    const urlThreshold = searchParams.get('certainty_threshold');
    return urlThreshold ? parseFloat(urlThreshold) : defaultThreshold;
  });
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

  const debouncedSearch = useCallback(
    (value: string, dates: { start: string; end: string }) => {
      const params = new URLSearchParams(searchParams);
      if (value) {
        params.set('query', value);
        // Ensure image search state is cleared
        params.delete('search_type');
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
      // Maintain similarity threshold in URL
      params.set('certainty_threshold', similarityThreshold.toString());
      params.set('page', '1');
      router.push(`/?${params.toString()}`);
    },
    [router, searchParams, similarityThreshold]
  );

  const debouncedSearchHandler = useDebounce(debouncedSearch, 300);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    // Clear image search state when performing text search
    imageFile.current = null;
    setPreviewUrl(null);
    setImageDescription(null);
    
    // Update URL params and remove image search type
    const params = new URLSearchParams(searchParams);
    params.delete('search_type'); // Remove image search marker
    
    debouncedSearchHandler(value, dateRange);
  };

  const handleDateChange = (field: 'start' | 'end', date: Date | null) => {
    const formattedDate = formatDateForAPI(date);
    const newDateRange = { ...dateRange, [field]: formattedDate };
    setDateRange(newDateRange);
    
    // If we have a query or image search active, trigger a new search
    if (query || (searchParams.get('search_type') === 'image' && imageFile.current)) {
      debouncedSearch(query, newDateRange);
    }
  };

  const debouncedThresholdSearch = useDebounce((threshold: number) => {
    if (query) {
      const searchUrl = new URL('/api/search', window.location.origin);
      searchUrl.searchParams.set('query', query);
      searchUrl.searchParams.set('page', searchParams.get('page') || '1');
      searchUrl.searchParams.set('limit', '12');
      searchUrl.searchParams.set('certainty_threshold', threshold.toString());
      if (dateRange.start) searchUrl.searchParams.set('start_date', dateRange.start);
      if (dateRange.end) searchUrl.searchParams.set('end_date', dateRange.end);

      fetch(searchUrl.toString())
        .then(response => {
          if (!response.ok) throw new Error('Search failed');
          return response.json();
        })
        .then(data => {
          window.dispatchEvent(new CustomEvent('image-search-results', { detail: data }));
        })
        .catch(error => {
          console.error('Error during search:', error);
        });
    } else if (searchParams.get('search_type') === 'image' && imageFile.current) {
      handleImageSearch(imageFile.current, threshold);
    }
  }, 300);

  const handleSimilarityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setSimilarityThreshold(value);
    
    // Update URL params without triggering a page navigation
    const params = new URLSearchParams(searchParams);
    params.set('certainty_threshold', value.toString());
    window.history.replaceState({}, '', `/?${params.toString()}`);

    // Debounce the API call
    debouncedThresholdSearch(value);
  };

  // New helper function for image search
  const handleImageSearch = async (file: File, threshold: number) => {
    const formData = new FormData();
    formData.append('file', file);

    const searchUrl = new URL('/api/search/image', window.location.origin);
    const currentPage = searchParams.get('page') || '1';
    searchUrl.searchParams.set('page', currentPage);
    searchUrl.searchParams.set('limit', '12');
    searchUrl.searchParams.set('certainty_threshold', threshold.toString());
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

      const data = await response.json();
      window.dispatchEvent(new CustomEvent('image-search-results', { detail: data }));
    } catch (error) {
      console.error('Error searching by image:', error);
      alert('Failed to search by image. Please try again.');
    }
  };

  // Add cleanup for preview URL
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const clearImageSearch = () => {
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
    setIsInitialImageSearch(true); // Reset flag for new image upload
    
    // Store the file for pagination
    imageFile.current = file;

    try {
      // Add date range and similarity threshold to the image search
      const searchUrl = new URL('/api/search/image', window.location.origin);
      const currentPage = searchParams.get('page') || '1';
      searchUrl.searchParams.set('page', currentPage);
      searchUrl.searchParams.set('limit', '12');
      searchUrl.searchParams.set('certainty_threshold', similarityThreshold.toString());
      if (dateRange.start) searchUrl.searchParams.set('start_date', dateRange.start);
      if (dateRange.end) searchUrl.searchParams.set('end_date', dateRange.end);

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
      if (dateRange.start) params.set('start_date', dateRange.start);
      if (dateRange.end) params.set('end_date', dateRange.end);
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
      if (dateRange.start) searchUrl.searchParams.set('start_date', dateRange.start);
      if (dateRange.end) searchUrl.searchParams.set('end_date', dateRange.end);

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
  }, [searchParams, dateRange, similarityThreshold, isInitialImageSearch]);

  return (
    <div className="relative">
      <div className="w-full max-w-3xl mx-auto space-y-6 px-4 sm:px-0">
        {/* Search Bar and Upload Button */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 min-w-0">
              <div className="relative group">
                <input
                  type="text"
                  value={query}
                  onChange={handleSearch}
                  placeholder={imageSearchStatus === 'searching' ? 'Searching by image...' : 'Search by keywords...'}
                  className="w-full px-4 py-3 pl-11 text-[15px] font-arizona-flare text-beforest-earth placeholder-beforest-charcoal/40
                    border-2 border-beforest-gray/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-beforest-olive/30 focus:border-beforest-olive
                    bg-white shadow-sm transition-all duration-200 group-hover:border-beforest-olive/60"
                  disabled={isUploading || imageSearchStatus === 'searching'}
                />
                {imageSearchStatus === 'searching' ? (
                  <div className="absolute left-3.5 top-3 h-5 w-5">
                    <div className="h-5 w-5 border-2 border-beforest-olive/30 border-t-beforest-olive rounded-full animate-spin" />
                  </div>
                ) : (
                  <MagnifyingGlassIcon className="absolute left-3.5 top-3 h-5 w-5 text-beforest-charcoal/60 group-hover:text-beforest-olive transition-colors duration-200" />
                )}
              </div>
            </div>

            <div className="sm:flex-shrink-0">
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
                className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 font-arizona-flare text-[13px] uppercase tracking-wide rounded-lg
                  shadow-sm transition-all duration-200 border-2 whitespace-nowrap ${
                    isUploading || imageSearchStatus === 'searching' 
                    ? 'bg-beforest-gray/20 text-beforest-charcoal/50 cursor-not-allowed border-beforest-gray/30' 
                    : 'bg-white text-beforest-earth border-beforest-olive/60 hover:bg-beforest-olive/5 hover:border-beforest-olive hover:text-beforest-olive'
                }`}
                disabled={isUploading || imageSearchStatus === 'searching'}
              >
                <PhotoIcon className="h-4.5 w-4.5" />
                <span className="hidden sm:inline">Upload Image to Search</span>
                <span className="sm:hidden">Upload Image</span>
              </button>
            </div>
          </div>

          {/* Image Preview with Expandable Description */}
          {previewUrl && (
            <div className="relative bg-white p-3 rounded-lg border border-beforest-gray/20">
              <div className="flex items-start gap-3">
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-md overflow-hidden bg-beforest-gray/10">
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
                      <p className={`font-arizona-flare text-beforest-earth text-sm ${!isDescriptionExpanded && 'line-clamp-2 sm:line-clamp-none'}`}>
                        {imageDescription || "Analyzing image..."}
                      </p>
                      {imageDescription && imageDescription.length > 100 && (
                        <button
                          onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                          className="mt-1 text-xs text-beforest-olive hover:text-beforest-olive/80 transition-colors sm:hidden"
                        >
                          {isDescriptionExpanded ? 'Show less' : 'Read more'}
                        </button>
                      )}
                    </div>
                    <button
                      onClick={clearImageSearch}
                      className="p-1 hover:bg-beforest-gray/10 rounded-full transition-colors flex-shrink-0"
                      aria-label="Clear image search"
                    >
                      <XMarkIcon className="w-5 h-5 text-beforest-charcoal/60" />
                    </button>
                  </div>
                  <p className="text-xs text-beforest-charcoal/60 mt-2">
                    Adjust the similarity threshold below to refine your results
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Search Suggestions */}
        <SearchSuggestions
          currentQuery={query}
          currentImage={imageFile.current}
          onSuggestionClick={(suggestion) => {
            setQuery(suggestion);
            debouncedSearchHandler(suggestion, dateRange);
          }}
        />
      </div>

      {/* Search Controls */}
      <div className="grid sm:grid-cols-2 gap-6">
        {/* Similarity Score Slider */}
        <div className="bg-white p-5 rounded-xl border border-beforest-gray/20 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <span className="font-arizona-flare text-beforest-earth text-[13px] uppercase tracking-wide">
              Similarity Threshold
            </span>
            <span className="font-arizona-flare text-sm bg-beforest-olive/10 text-beforest-olive px-3 py-1 rounded-full">
              {Math.round(similarityThreshold * 100)}%
            </span>
          </div>
          <Slider.Root
            className="relative flex items-center select-none touch-none w-full h-5"
            value={[similarityThreshold]}
            onValueChange={([value]) => handleSimilarityChange({ target: { value: value.toString() } } as React.ChangeEvent<HTMLInputElement>)}
            max={0.9}
            min={0.1}
            step={0.05}
            aria-label="Similarity Threshold"
          >
            <Slider.Track className="bg-beforest-gray/20 relative grow rounded-full h-2">
              <Slider.Range className="absolute bg-gradient-to-r from-beforest-olive/20 to-beforest-olive/40 rounded-full h-full" />
            </Slider.Track>
            <Slider.Thumb
              className="block w-5 h-5 bg-white border-2 border-beforest-olive shadow-lg rounded-full hover:scale-110 focus:outline-none focus:ring-2 focus:ring-beforest-olive/30 transition-transform duration-200"
              aria-label="Similarity Threshold"
            />
          </Slider.Root>
        </div>

        {/* Date Range Filters */}
        <div className="relative bg-white p-5 rounded-xl border border-beforest-gray/20 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="absolute inset-0 bg-beforest-earth/5 backdrop-blur-[1px] rounded-xl z-10 flex items-center justify-center">
            <span className="font-arizona-flare text-beforest-earth text-sm bg-white/80 px-4 py-2 rounded-full border border-beforest-olive/20">
              Work in Progress
            </span>
          </div>
          <span className="block font-arizona-flare text-beforest-earth text-[13px] uppercase tracking-wide mb-4">
            Filter by Date
          </span>
          <div className="flex flex-col sm:flex-row items-center gap-2 opacity-50">
            <div className="flex-1 w-full">
              <DatePicker
                selected={dateRange.start ? new Date(dateRange.start + 'T00:00:00Z') : null}
                onChange={(date) => handleDateChange('start', date)}
                dateFormat="MMM dd, yyyy"
                placeholderText="Start date"
                isClearable
                showPopperArrow={false}
                disabled
                customInput={
                  <div className="relative cursor-not-allowed group">
                    <input
                      readOnly
                      placeholder="Start date"
                      className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-beforest-gray/30 
                        bg-beforest-offwhite cursor-not-allowed
                        font-arizona-flare text-sm text-beforest-earth/50
                        transition-all duration-200"
                    />
                    <CalendarIcon 
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 
                        text-beforest-charcoal/40
                        transition-colors duration-200" 
                    />
                  </div>
                }
                popperClassName="date-picker-popper"
                calendarClassName="date-picker-calendar"
              />
            </div>

            <ChevronRightIcon className="h-4 w-4 text-beforest-charcoal/30 hidden sm:block flex-shrink-0" />
            <span className="font-arizona-flare text-beforest-earth/40 sm:hidden">to</span>

            <div className="flex-1 w-full">
              <DatePicker
                selected={dateRange.end ? new Date(dateRange.end + 'T00:00:00Z') : null}
                onChange={(date) => handleDateChange('end', date)}
                dateFormat="MMM dd, yyyy"
                placeholderText="End date"
                isClearable
                showPopperArrow={false}
                minDate={dateRange.start ? new Date(dateRange.start + 'T00:00:00Z') : undefined}
                disabled
                customInput={
                  <div className="relative cursor-not-allowed group">
                    <input
                      readOnly
                      placeholder="End date"
                      className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-beforest-gray/30 
                        bg-beforest-offwhite cursor-not-allowed
                        font-arizona-flare text-sm text-beforest-earth/50
                        transition-all duration-200"
                    />
                    <CalendarIcon 
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 
                        text-beforest-charcoal/40
                        transition-colors duration-200" 
                    />
                  </div>
                }
                popperClassName="date-picker-popper"
                calendarClassName="date-picker-calendar"
              />
            </div>
          </div>
        </div>
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
