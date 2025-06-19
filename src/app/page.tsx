'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Download, Image as ImageIcon, Loader2, Filter, Grid, List, Sparkles, Camera, Calendar, FileType, Palette, Upload, X, ChevronLeft, ChevronRight, ExternalLink, Copy, Check } from 'lucide-react';

interface SearchResult {
  id: string;
  dropbox_path: string;
  file_name?: string;
  caption?: string;
  tags?: string[];
  similarity: number;
  similarity_percentage?: number;
  public_url?: string;
  thumbnail_url?: string;
  download_url?: string;
  file_type?: string;
  file_size?: number;
  source: 'vector' | 'text' | 'hybrid' | 'unknown';
  search_source?: string;
  enhanced: boolean;
  metadata?: Record<string, any>;
  modified_date?: string;
  processed_date?: string;
  file_extension?: string;
  // Advanced scoring fields
  advanced_scores?: {
    composite: number;
    vector: number;
    text: number;
    tag: number;
    quality: number;
  };
  composite_score?: number;
  vector_score?: number;
  text_score?: number;
  tag_score?: number;
  quality_score?: number;
}

interface SearchResponse {
  results: SearchResult[];
  totalFound: number;
  query: string;
  processingTime: number;
  searchStrategy: string;
  hasMore: boolean;
  currentPage: number;
  debug?: {
    vectorResults: number;
    textResults: number;
    uniqueResults: number;
    qualityScoreRange?: { min: number; max: number };
    compositeScoreRange?: { min: number; max: number };
  };
  error?: string;
}

interface SearchFilters {
  dateRange: {
    start?: string;
    end?: string;
  };
  fileTypes: string[];
  minFileSize?: number;
  maxFileSize?: number;
  minSimilarity?: number;
  tags: string[];
  sortBy: 'relevance' | 'date' | 'size' | 'name';
  sortOrder: 'desc' | 'asc';
}

export default function BeforestImageSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState<'text' | 'image'>('text');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultsPerPage = 21; // 3x7 grid layout
  const [useAdvanced, setUseAdvanced] = useState(true);
  const [showAdvancedScores, setShowAdvancedScores] = useState(false);

  // Quick preview modal states
  const [previewResult, setPreviewResult] = useState<SearchResult | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number>(-1);
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);

  // Filter states
  const [filters, setFilters] = useState<SearchFilters>({
    dateRange: {},
    fileTypes: [],
    minFileSize: undefined,
    maxFileSize: undefined,
    minSimilarity: 0,
    tags: [],
    sortBy: 'relevance',
    sortOrder: 'desc'
  });

  const searchImages = async (searchQuery: string, pageNum: number = 1, append: boolean = false, searchFilters?: SearchFilters) => {
    if (!searchQuery.trim() && !uploadedImage) return;

    setLoading(true);
    setError(null);

    try {
      const offset = (pageNum - 1) * resultsPerPage;
      
      let requestBody: any = {
        query: searchQuery,
        limit: resultsPerPage,
        offset,
        useAdvanced,
        filters: searchFilters || filters
      };

      // Handle image search
      if (searchMode === 'image' && uploadedImage) {
        const formData = new FormData();
        formData.append('image', uploadedImage);
        formData.append('limit', resultsPerPage.toString());
        formData.append('offset', offset.toString());
        formData.append('useAdvanced', useAdvanced.toString());
        formData.append('filters', JSON.stringify(searchFilters || filters));

        const response = await fetch('/api/search/image', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Image search failed');
        }

        const data: SearchResponse = await response.json();
        handleSearchResponse(data, append, pageNum);
        return;
      }

      // Text search
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data: SearchResponse = await response.json();
      handleSearchResponse(data, append, pageNum);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchResponse = (data: SearchResponse, append: boolean, pageNum: number) => {
    if (data.error) {
      throw new Error(data.error);
    }
    
    if (append) {
      setResults(prev => [...prev, ...data.results]);
    } else {
      setResults(data.results);
    }
    
    setHasMore(data.hasMore);
    setTotalResults(data.totalFound);
    setPage(pageNum);

    // Log search strategy for debugging
    console.log(`🎯 Search completed using ${data.searchStrategy} in ${data.processingTime}ms`);
    if (data.debug) {
      console.log(`📊 Results: ${data.debug.vectorResults} vector + ${data.debug.textResults} text = ${data.debug.uniqueResults} unique`);
    }
    console.log(`📄 Page ${data.currentPage}, hasMore: ${data.hasMore}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if ((query.trim() && searchMode === 'text') || (uploadedImage && searchMode === 'image')) {
      setPage(1);
      searchImages(query, 1, false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setUploadedImage(file);
      setSearchMode('image');
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // Clear text query when uploading image
      setQuery('');
    }
  };

  const clearImageUpload = () => {
    setUploadedImage(null);
    setImagePreview(null);
    setSearchMode('text');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      searchImages(query, page + 1, true);
    }
  };

  const applyFilters = () => {
    setPage(1);
    searchImages(query, 1, false, filters);
  };

  const resetFilters = () => {
    setFilters({
      dateRange: {},
      fileTypes: [],
      minFileSize: undefined,
      maxFileSize: undefined,
      minSimilarity: 0,
      tags: [],
      sortBy: 'relevance',
      sortOrder: 'desc'
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown date';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  const suggestedSearches = [
    'farm', 'collective', 'nature', 'agriculture', 'tree', 'landscape', 'visit', 'photos'
  ];

  const fileTypeOptions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'svg', 'mp4', 'mov', 'avi'];

  const getSearchStrategyDisplay = (strategy: string) => {
    switch (strategy) {
      case 'advanced_multi_stage':
        return { text: 'Advanced Multi-Stage', color: 'text-purple-600', icon: '🎯' };
      case 'dual_search':
        return { text: 'Dual Search', color: 'text-blue-600', icon: '🔍' };
      case 'fallback_search':
        return { text: 'Fallback Search', color: 'text-yellow-600', icon: '🔄' };
      case 'fallback_only':
        return { text: 'Text Only', color: 'text-orange-600', icon: '📝' };
      case 'image_search':
        return { text: 'Image Search', color: 'text-green-600', icon: '🖼️' };
      default:
        return { text: strategy, color: 'text-gray-600', icon: '❓' };
    }
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'vector':
        return { text: 'Vector', color: 'bg-purple-100 text-purple-800', icon: '🎯' };
      case 'text':
        return { text: 'Text', color: 'bg-blue-100 text-blue-800', icon: '📝' };
      case 'hybrid':
        return { text: 'Hybrid', color: 'bg-green-100 text-green-800', icon: '🔀' };
      default:
        return { text: 'Unknown', color: 'bg-gray-100 text-gray-800', icon: '❓' };
    }
  };

  // Quick preview functions
  const openPreview = (result: SearchResult, index: number) => {
    setPreviewResult(result);
    setPreviewIndex(index);
    setShowPreview(true);
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  };

  const closePreview = () => {
    setShowPreview(false);
    setPreviewResult(null);
    setPreviewIndex(-1);
    setCopied(false);
    document.body.style.overflow = 'unset';
  };

  const navigatePreview = (direction: 'prev' | 'next') => {
    if (!results.length) return;
    
    let newIndex = previewIndex;
    if (direction === 'prev') {
      newIndex = previewIndex > 0 ? previewIndex - 1 : results.length - 1;
    } else {
      newIndex = previewIndex < results.length - 1 ? previewIndex + 1 : 0;
    }
    
    setPreviewIndex(newIndex);
    setPreviewResult(results[newIndex]);
    setCopied(false);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Keyboard navigation for preview
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showPreview) return;
      
      switch (e.key) {
        case 'Escape':
          closePreview();
          break;
        case 'ArrowLeft':
          navigatePreview('prev');
          break;
        case 'ArrowRight':
          navigatePreview('next');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPreview, previewIndex, results.length]);

  return (
    <div className="min-h-screen beforest-gradient-bg">
      {/* Header */}
      <header className="beforest-header sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 py-2 md:px-4 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img 
                src="/23-Beforest-Black-with-Tagline.png" 
                alt="Beforest" 
                className="h-6 md:h-8 w-auto"
              />
            </div>
            
            <div className="flex items-center space-x-2 md:space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-1.5 md:p-2 rounded-lg transition-colors ${
                  showFilters ? 'beforest-btn-primary' : 'beforest-btn-secondary'
                }`}
              >
                <Filter className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </button>
              <div className="flex items-center space-x-0.5 md:space-x-1 bg-white rounded-lg p-0.5 md:p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 md:p-2 rounded-md transition-colors ${
                    viewMode === 'grid' ? 'beforest-btn-primary' : 'hover:bg-gray-100'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 md:p-2 rounded-md transition-colors ${
                    viewMode === 'list' ? 'beforest-btn-primary' : 'hover:bg-gray-100'
                  }`}
                >
                  <List className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 py-4 md:px-4 md:py-8">
        {/* Hero Search Section */}
        {!results.length && !loading && (
          <div className="text-center mb-6 md:mb-12 beforest-fade-in">
            <div className="beforest-search-hero rounded-2xl md:rounded-3xl p-6 md:p-12 mb-4 md:mb-8 text-white">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl md:text-5xl lg:text-6xl mb-3 md:mb-4 font-bold text-white" style={{ letterSpacing: '-0.025em', lineHeight: '1.2' }}>
                  Find Beforest
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">
                    Brand Assets
                  </span>
                </h2>
                <p className="text-base md:text-xl lg:text-2xl mb-4 md:mb-8 text-blue-100">
                  Explore our collective's visual library with intelligent AI search
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search Form */}
        <form onSubmit={handleSearch} className={`max-w-4xl mx-auto mb-4 md:mb-8 ${results.length ? 'beforest-fade-in' : ''}`}>
          <div className="beforest-search-bar rounded-xl md:rounded-2xl p-4 md:p-6">
            {/* Search Mode Toggle */}
            <div className="flex items-center justify-center mb-3 md:mb-4">
              <div className="flex items-center space-x-0.5 md:space-x-1 bg-gray-100 rounded-lg p-0.5 md:p-1">
                <button
                  type="button"
                  onClick={() => {
                    setSearchMode('text');
                    clearImageUpload();
                  }}
                  className={`px-3 py-1.5 md:px-4 md:py-2 rounded-md transition-colors flex items-center space-x-1.5 md:space-x-2 text-sm md:text-base ${
                    searchMode === 'text' ? 'beforest-btn-primary text-white' : 'hover:bg-gray-200'
                  }`}
                >
                  <Search className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span>Text Search</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSearchMode('image')}
                  className={`px-3 py-1.5 md:px-4 md:py-2 rounded-md transition-colors flex items-center space-x-1.5 md:space-x-2 text-sm md:text-base ${
                    searchMode === 'image' ? 'beforest-btn-primary text-white' : 'hover:bg-gray-200'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span>Image Search</span>
                </button>
              </div>
            </div>

            {/* Text Search */}
            {searchMode === 'text' && (
              <div className="relative">
                <div className="absolute left-4 md:left-6 top-1/2 transform -translate-y-1/2">
                  <Search className="text-gray-400 w-4 h-4 md:w-6 md:h-6" />
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search your brand assets..."
                  className="w-full pl-12 md:pl-16 pr-28 md:pr-40 py-3 md:py-4 text-base md:text-lg bg-transparent border-none outline-none placeholder-gray-500 text-gray-900"
                  disabled={loading}
                />
                <div className="absolute right-1 md:right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1 md:space-x-2">
                  <button
                    type="submit"
                    disabled={loading || !query.trim()}
                    className="beforest-btn-primary px-3 py-2 md:px-6 md:py-3 rounded-lg md:rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 md:space-x-2 text-sm md:text-base"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin w-4 h-4 md:w-5 md:h-5" />
                    ) : (
                      <>
                        <Search className="w-4 h-4 md:w-5 md:h-5" />
                        <span className="hidden sm:inline">Search</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Image Search */}
            {searchMode === 'image' && (
              <div className="space-y-4">
                {!imagePreview ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">
                      Upload an image to find similar photos in your collection
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="beforest-btn-secondary px-6 py-3 rounded-xl"
                    >
                      Choose Image
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                      <img
                        src={imagePreview}
                        alt="Upload preview"
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{uploadedImage?.name}</p>
                        <p className="text-sm text-gray-500">
                          {uploadedImage ? formatFileSize(uploadedImage.size) : ''}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={clearImageUpload}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="mt-4 flex justify-center">
                      <button
                        type="submit"
                        disabled={loading || !uploadedImage}
                        className="beforest-btn-primary px-8 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        {loading ? (
                          <Loader2 className="animate-spin w-5 h-5" />
                        ) : (
                          <>
                            <Camera className="w-5 h-5" />
                            <span>Find Similar Images</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Suggested Searches */}
            {!results.length && !loading && searchMode === 'text' && (
              <div className="mt-4 md:mt-6 flex flex-wrap gap-1.5 md:gap-2">
                <span className="text-xs md:text-sm text-gray-600 mr-1 md:mr-2">Try:</span>
                {suggestedSearches.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      setQuery(suggestion);
                      searchImages(suggestion, 1, false);
                    }}
                    className="beforest-tag hover:bg-opacity-20 transition-colors text-xs md:text-sm px-2 md:px-3 py-1 md:py-1.5"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Filters Panel */}
        {showFilters && (
          <div className="max-w-4xl mx-auto mb-8 beforest-fade-in">
            <div className="beforest-search-bar rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Search Filters</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={resetFilters}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Reset All
                  </button>
                  <button
                    onClick={applyFilters}
                    className="beforest-btn-primary px-4 py-2 rounded-lg text-sm"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Date Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Date Range
                  </label>
                  <div className="space-y-2">
                    <input
                      type="date"
                      value={filters.dateRange.start || ''}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, start: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Start date"
                    />
                    <input
                      type="date"
                      value={filters.dateRange.end || ''}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, end: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="End date"
                    />
                  </div>
                </div>

                {/* File Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FileType className="w-4 h-4 inline mr-1" />
                    File Types
                  </label>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {fileTypeOptions.map((type) => (
                      <label key={type} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.fileTypes.includes(type)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilters(prev => ({
                                ...prev,
                                fileTypes: [...prev.fileTypes, type]
                              }));
                            } else {
                              setFilters(prev => ({
                                ...prev,
                                fileTypes: prev.fileTypes.filter(t => t !== type)
                              }));
                            }
                          }}
                          className="mr-2 rounded"
                        />
                        <span className="text-sm text-gray-700">.{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* File Size Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    File Size (MB)
                  </label>
                  <div className="space-y-2">
                    <input
                      type="number"
                      placeholder="Min size"
                      value={filters.minFileSize ? filters.minFileSize / (1024 * 1024) : ''}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        minFileSize: e.target.value ? Number(e.target.value) * 1024 * 1024 : undefined
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="number"
                      placeholder="Max size"
                      value={filters.maxFileSize ? filters.maxFileSize / (1024 * 1024) : ''}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        maxFileSize: e.target.value ? Number(e.target.value) * 1024 * 1024 : undefined
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Similarity Threshold */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Similarity: {filters.minSimilarity}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={filters.minSimilarity}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      minSimilarity: Number(e.target.value)
                    }))}
                    className="w-full"
                  />
                </div>

                {/* Sort Options */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <div className="space-y-2">
                    <select
                      value={filters.sortBy}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        sortBy: e.target.value as any
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="relevance">Relevance</option>
                      <option value="date">Date</option>
                      <option value="size">File Size</option>
                      <option value="name">Name</option>
                    </select>
                    <select
                      value={filters.sortOrder}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        sortOrder: e.target.value as any
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="desc">Descending</option>
                      <option value="asc">Ascending</option>
                    </select>
                  </div>
                </div>

                {/* Tags Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Palette className="w-4 h-4 inline mr-1" />
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="farm, nature, collective"
                    value={filters.tags.join(', ')}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Stats */}
        {totalResults > 0 && (
          <div className="max-w-4xl mx-auto mb-8 beforest-fade-in">
            <div className="beforest-stats-card rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="font-medium">
                  {totalResults.toLocaleString()} results found
                </span>
                <span className="text-sm ml-2">
                  {searchMode === 'image' && uploadedImage 
                    ? `for similar images to "${uploadedImage.name}"` 
                    : `for "${query}"`
                  }
                </span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <span>Page {page}</span>
                {hasMore && <span>• More available</span>}
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="max-w-4xl mx-auto mb-8 beforest-fade-in">
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-6">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-red-200 rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-xs">!</span>
                </div>
                <span className="font-medium">{error}</span>
              </div>
            </div>
          </div>
        )}

        {/* Results Grid */}
        {results.length > 0 && (
          <div className={`beforest-fade-in mb-12 ${
            viewMode === 'grid' 
              ? 'beforest-grid' 
              : 'max-w-4xl mx-auto space-y-4'
          }`}>
            {results.map((result, index) => (
              <div
                key={result.id}
                className={`beforest-result-card group cursor-pointer ${
                  viewMode === 'list' ? 'flex items-start space-x-4 p-4 min-h-[140px]' : ''
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => openPreview(result, index)}
              >
                {/* Image Container */}
                <div className={`relative ${
                  viewMode === 'list' ? 'w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0' : 'aspect-video'
                } bg-gray-100 overflow-hidden ${
                  viewMode === 'grid' ? 'rounded-t-xl' : 'rounded-lg'
                }`}>
                                  {result.thumbnail_url ? (
                  <img
                    src={result.thumbnail_url}
                    alt={result.file_name || 'Untitled'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="text-gray-400 w-12 h-12" />
                    </div>
                  )}
                  
                  {/* Similarity Badge */}
                  <div className="absolute top-3 right-3">
                    <div className="beforest-similarity-badge">
                      {result.similarity_percentage || Math.round(result.similarity * 100)}% match
                    </div>
                  </div>
                  
                  {/* Search Source Badge */}
                  {result.search_source && (
                    <div className="absolute top-3 left-3">
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        result.search_source === 'vector' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {result.search_source}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Content */}
                <div className={`${viewMode === 'grid' ? 'p-6' : 'flex-1 min-w-0 py-2'}`}>
                  <div className="flex items-start justify-between mb-3">
                    <h3 className={`beforest-heading ${viewMode === 'list' ? 'text-base' : 'text-lg'} truncate pr-2`}>
                      {result.file_name || 'Untitled'}
                    </h3>
                    {viewMode === 'list' && result.download_url && (
                      <a
                        href={result.download_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="beforest-download-btn px-3 py-1.5 rounded-lg text-xs flex items-center space-x-1.5 flex-shrink-0 ml-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Download</span>
                      </a>
                    )}
                  </div>
                  
                  {result.caption && (
                    <p className={`beforest-subheading ${viewMode === 'list' ? 'text-xs' : 'text-sm'} mb-2 line-clamp-2`}>
                      {result.caption}
                    </p>
                  )}
                  
                  {/* Tags */}
                  {result.tags && result.tags.length > 0 && (
                    <div className={`flex flex-wrap gap-1.5 ${viewMode === 'list' ? 'mb-2' : 'mb-4'}`}>
                      {result.tags.slice(0, viewMode === 'list' ? 2 : 3).map((tag, tagIndex) => (
                        <span key={tagIndex} className={`beforest-tag ${viewMode === 'list' ? 'text-xs px-2 py-1' : ''}`}>
                          {tag}
                        </span>
                      ))}
                      {result.tags.length > (viewMode === 'list' ? 2 : 3) && (
                        <span className={`beforest-tag ${viewMode === 'list' ? 'text-xs px-2 py-1' : ''}`}>
                          +{result.tags.length - (viewMode === 'list' ? 2 : 3)} more
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* File Info */}
                  <div className={`flex items-center justify-between text-xs text-gray-500 ${viewMode === 'list' ? 'mt-auto' : ''}`}>
                    <div className={`${viewMode === 'list' ? 'flex flex-wrap gap-x-4 gap-y-1 text-xs' : 'space-y-1'}`}>
                      <div>Size: {formatFileSize(result.file_size)}</div>
                      <div>Match: {result.similarity_percentage || Math.round(result.similarity * 100)}%</div>
                      <div>Source: {result.search_source || result.source}</div>
                      {(result.modified_date || result.processed_date) && (
                        <div>Date: {formatDate(result.modified_date || result.processed_date)}</div>
                      )}
                    </div>
                    
                    {viewMode === 'grid' && result.download_url && (
                      <a
                        href={result.download_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="beforest-download-btn px-4 py-2 rounded-lg text-sm flex items-center space-x-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Download className="w-4 h-4" />
                        <span>Download</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {hasMore && (
          <div className="text-center beforest-fade-in">
            <button
              onClick={loadMore}
              disabled={loading}
              className="beforest-btn-primary px-8 py-4 rounded-xl text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center space-x-3">
                  <Loader2 className="animate-spin w-5 h-5" />
                  <span>Loading more amazing results...</span>
                </span>
              ) : (
                <span className="flex items-center space-x-3">
                  <Sparkles className="w-5 h-5" />
                  <span>Load More Results</span>
                </span>
              )}
            </button>
          </div>
        )}

        {/* No Results State */}
        {!loading && results.length === 0 && query && (
          <div className="text-center py-16 beforest-fade-in">
            <div className="beforest-card rounded-3xl p-12 max-w-lg mx-auto">
              <div className="w-20 h-20 beforest-search-hero rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-white" />
              </div>
              <h3 className="beforest-heading text-2xl mb-4">No results found</h3>
              <p className="beforest-subheading mb-6">
                We couldn't find any images matching "<strong>{query}</strong>". 
                Try different keywords or check your search terms.
              </p>
              <div className="space-y-3">
                <p className="text-sm text-gray-600">Try searching for:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {suggestedSearches.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        setQuery(suggestion);
                        searchImages(suggestion, 1, false);
                      }}
                      className="beforest-tag hover:bg-opacity-20 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Preview Modal */}
      {showPreview && previewResult && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          {/* Modal Content */}
          <div className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center">
            
            {/* Close Button */}
            <button
              onClick={closePreview}
              className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-3 transition-all"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Navigation Arrows */}
            {results.length > 1 && (
              <>
                <button
                  onClick={() => navigatePreview('prev')}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-3 transition-all"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() => navigatePreview('next')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-3 transition-all"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Image and Details Container */}
            <div className="flex flex-col lg:flex-row max-w-full max-h-full bg-white rounded-2xl overflow-hidden shadow-2xl">
              
              {/* Image Section */}
              <div className="flex-1 flex items-center justify-center bg-gray-100 min-h-96 lg:min-h-[600px]">
                {previewResult.thumbnail_url || previewResult.public_url ? (
                  <img
                    src={previewResult.thumbnail_url || previewResult.public_url}
                    alt={previewResult.file_name || 'Preview'}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-400 p-8">
                    <ImageIcon className="w-24 h-24 mb-4" />
                    <p className="text-lg">No preview available</p>
                  </div>
                )}
              </div>

              {/* Details Panel */}
              <div className="w-full lg:w-96 p-6 lg:p-8 bg-white overflow-y-auto">
                <div className="space-y-6">
                  
                  {/* Title */}
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {previewResult.file_name || 'Untitled'}
                    </h2>
                    {previewResult.caption && (
                      <p className="text-gray-600 leading-relaxed">
                        {previewResult.caption}
                      </p>
                    )}
                  </div>

                  {/* Similarity Score */}
                  <div className="flex items-center space-x-3">
                    <div className="beforest-similarity-badge text-lg px-4 py-2">
                      {previewResult.similarity_percentage || Math.round(previewResult.similarity * 100)}% match
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getSourceBadge(previewResult.source).color}`}>
                      {getSourceBadge(previewResult.source).icon} {getSourceBadge(previewResult.source).text}
                    </div>
                  </div>

                  {/* Tags */}
                  {previewResult.tags && previewResult.tags.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {previewResult.tags.map((tag, index) => (
                          <span key={index} className="beforest-tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* File Details */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">File Details</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Size:</span>
                        <span className="font-medium">{formatFileSize(previewResult.file_size)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Type:</span>
                        <span className="font-medium">{previewResult.file_type || previewResult.file_extension || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Source:</span>
                        <span className="font-medium">{previewResult.search_source || previewResult.source}</span>
                      </div>
                      {(previewResult.modified_date || previewResult.processed_date) && (
                        <div className="flex justify-between">
                          <span>Date:</span>
                          <span className="font-medium">{formatDate(previewResult.modified_date || previewResult.processed_date)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Advanced Scores */}
                  {showAdvancedScores && previewResult.advanced_scores && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Advanced Scores</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Composite:</span>
                          <span className="font-medium">{previewResult.advanced_scores.composite.toFixed(3)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Vector:</span>
                          <span className="font-medium">{previewResult.advanced_scores.vector.toFixed(3)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Text:</span>
                          <span className="font-medium">{previewResult.advanced_scores.text.toFixed(3)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tag:</span>
                          <span className="font-medium">{previewResult.advanced_scores.tag.toFixed(3)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Quality:</span>
                          <span className="font-medium">{previewResult.advanced_scores.quality.toFixed(3)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dropbox Path */}
                  {previewResult.dropbox_path && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">File Path</h3>
                      <div className="flex items-center space-x-2 bg-gray-50 rounded-lg p-3">
                        <code className="text-xs text-gray-600 flex-1 break-all">
                          {previewResult.dropbox_path}
                        </code>
                        <button
                          onClick={() => copyToClipboard(previewResult.dropbox_path!)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                          title="Copy path"
                        >
                          {copied ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-500" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col space-y-3 pt-4 border-t">
                    {previewResult.download_url && (
                      <a
                        href={previewResult.download_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="beforest-btn-primary px-6 py-3 rounded-xl text-center flex items-center justify-center space-x-2"
                      >
                        <Download className="w-5 h-5" />
                        <span>Download Original</span>
                      </a>
                    )}
                    
                    {previewResult.public_url && (
                      <a
                        href={previewResult.public_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="beforest-btn-secondary px-6 py-3 rounded-xl text-center flex items-center justify-center space-x-2"
                      >
                        <ExternalLink className="w-5 h-5" />
                        <span>View in Dropbox</span>
                      </a>
                    )}
                  </div>

                  {/* Navigation Info */}
                  {results.length > 1 && (
                    <div className="text-center text-sm text-gray-500 pt-4 border-t">
                      {previewIndex + 1} of {results.length} results
                      <div className="text-xs mt-1">
                        Use arrow keys or buttons to navigate
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 