'use client';

import { useState } from 'react';
import Image from 'next/image';
import { SearchResult } from '@/lib/types';
import ImagePreviewModal from './ImagePreviewModal';

interface ImageGridProps {
  images: (SearchResult & { temporaryLink: string | null })[];
  isLoading: boolean;
  showScores?: boolean;
}

export default function ImageGrid({ images, isLoading, showScores = false }: ImageGridProps) {
  const [selectedImage, setSelectedImage] = useState<SearchResult & { temporaryLink: string | null } | null>(null);

  const formatScore = (score: number): string => {
    return `${(score * 100).toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square bg-beforest-gray/40 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-beforest-charcoal font-arizona-sans text-[22px]">No images found</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-4">
        {images.map((image, index) => {
          const filename = image.dropbox_path.split('/').pop() || '';
          return (
            <div
              key={`${image.dropbox_path}-${index}`}
              className="relative aspect-square group cursor-pointer rounded-lg overflow-hidden bg-beforest-gray/30 border border-beforest-gray/20 shadow-sm hover:shadow-md transition-shadow duration-200"
              onClick={() => setSelectedImage(image)}
            >
              {image.temporaryLink ? (
                <>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Image
                      src={image.temporaryLink}
                      alt={filename}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      quality={75}
                      loading="lazy"
                      placeholder="blur"
                      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDABQODxIPDRQSEBIXFRQdHx4eHRseHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/2wBDAR4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                    />
                  </div>
                  
                  {/* File details overlay at the bottom */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent pt-8 pb-3 px-3">
                    <h3 className="text-white font-arizona-sans text-sm truncate mb-1">
                      {filename}
                    </h3>
                    
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      {/* Modified date */}
                      <span className="text-white/80 font-arizona-sans text-xs">
                        {new Date(image.modified_date).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                      
                      {showScores && (
                        <>
                          <span className="text-white/90 font-arizona-sans text-xs">
                            {formatScore(image.similarity_score)}
                          </span>
                          {image.exact_match && (
                            <span className="text-white/90 font-arizona-sans text-xs bg-beforest-green/30 px-1.5 py-0.5 rounded-sm">
                              Exact
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-beforest-gray/30">
                  <p className="text-beforest-charcoal font-arizona-sans text-sm">Failed to load image</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedImage && (
        <ImagePreviewModal
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </>
  );
} 