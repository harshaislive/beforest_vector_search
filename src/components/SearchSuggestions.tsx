import { useState, useRef, useEffect, useCallback } from 'react';
import { SparklesIcon, ChevronUpIcon, ChevronDownIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface SearchSuggestionsProps {
  onSuggestionClick: (suggestion: string) => void;
  currentQuery: string;
  currentImage?: File | null;
}

const MAX_IMAGE_SIZE = 1024 * 1024; // 1MB

async function resizeImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      
      // Calculate new dimensions (max 800px width/height)
      let width = img.width;
      let height = img.height;
      const maxDimension = 800;
      
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      // Create canvas and resize
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert image'));
          }
        },
        'image/jpeg',
        0.8
      );
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

export default function SearchSuggestions({ onSuggestionClick, currentQuery, currentImage }: SearchSuggestionsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previousQuery = useRef(currentQuery);

  // Move generateSuggestions before useEffect
  const generateSuggestions = useCallback(async () => {
    if (!currentQuery && !currentImage) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      if (currentQuery) {
        formData.append('query', currentQuery);
      }
      if (currentImage) {
        // Check file size
        if (currentImage.size > MAX_IMAGE_SIZE) {
          try {
            // Resize the image
            const resizedImage = await resizeImage(currentImage);
            formData.append('image', resizedImage, 'image.jpg');
          } catch (err) {
            console.error('Error resizing image:', err);
            throw new Error('Failed to process image. Please try a smaller image.');
          }
        } else {
          formData.append('image', currentImage);
        }
      }

      const response = await fetch('/api/suggestions', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate suggestions');
      }
      
      if (!Array.isArray(data.suggestions) || data.suggestions.length === 0) {
        throw new Error('No suggestions available');
      }

      setSuggestions(data.suggestions);
      setIsExpanded(true);
    } catch (err) {
      console.error('Error generating suggestions:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate suggestions');
      setIsExpanded(false);
    } finally {
      setIsLoading(false);
    }
  }, [currentQuery, currentImage]);

  // Generate new suggestions when query changes and suggestions are expanded
  useEffect(() => {
    if (isExpanded && currentQuery && currentQuery !== previousQuery.current) {
      generateSuggestions();
      previousQuery.current = currentQuery;
    }
  }, [currentQuery, isExpanded, generateSuggestions]);

  if (!currentQuery && !currentImage) return null;

  return (
    <div className="w-full bg-white rounded-lg border border-beforest-gray/20 shadow-sm overflow-hidden transition-all duration-300">
      <button
        onClick={() => {
          if (!isExpanded) {
            setIsExpanded(true);
            generateSuggestions();
          } else {
            setIsExpanded(false);
          }
        }}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-beforest-olive/5 transition-colors duration-200"
      >
        <div className="flex items-center gap-2">
          {error ? (
            <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
          ) : (
            <SparklesIcon className="h-5 w-5 text-beforest-olive" />
          )}
          <span className="font-arizona-flare text-beforest-earth text-sm">
            {error ? error : currentImage ? 'Similar search queries for this image' : currentQuery ? `Similar search queries to "${currentQuery}"` : 'Try similar search queries'}
          </span>
        </div>
        {isLoading ? (
          <div className="h-5 w-5 border-2 border-beforest-olive/30 border-t-beforest-olive rounded-full animate-spin" />
        ) : (
          isExpanded ? (
            <ChevronUpIcon className="h-5 w-5 text-beforest-charcoal/40" />
          ) : (
            <ChevronDownIcon className="h-5 w-5 text-beforest-charcoal/40" />
          )
        )}
      </button>

      {isExpanded && suggestions.length > 0 && (
        <div className="px-4 py-3 border-t border-beforest-gray/10">
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => onSuggestionClick(suggestion)}
                className="px-3 py-1.5 text-sm font-arizona-flare text-beforest-earth bg-beforest-olive/5 
                  rounded-full hover:bg-beforest-olive/10 transition-colors duration-200"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 