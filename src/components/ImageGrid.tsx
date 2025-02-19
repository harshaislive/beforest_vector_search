'use client';

import { useState } from 'react';
import Image from 'next/image';
import { SearchResult } from '@/lib/types';
import ImagePreviewModal from './ImagePreviewModal';

interface ImageGridProps {
  images: (SearchResult & { temporaryLink: string | null })[];
  isLoading: boolean;
}

export default function ImageGrid({ images, isLoading }: ImageGridProps) {
  const [selectedImage, setSelectedImage] = useState<SearchResult & { temporaryLink: string | null } | null>(null);

  const formatScore = (score: number): string => {
    return `${Math.round(score * 100)}%`;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square bg-beforest-gray rounded-lg animate-pulse"
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
        {images.map((image, index) => (
          <div
            key={`${image.dropbox_path}-${index}`}
            className="relative aspect-square group cursor-pointer rounded-lg overflow-hidden bg-beforest-gray"
            onClick={() => setSelectedImage(image)}
          >
            {image.temporaryLink ? (
              <>
                <Image
                  src={image.temporaryLink}
                  alt={image.dropbox_path.split('/').pop() || ''}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
                  <div className="flex items-center gap-2">
                    <span className="text-white/90 font-arizona-sans text-xs">
                      {formatScore(image.similarity_score)}
                    </span>
                    {image.exact_match && (
                      <span className="text-white/90 font-arizona-sans text-xs bg-beforest-blue/30 px-1.5 py-0.5 rounded-sm">
                        Exact
                      </span>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-beforest-gray">
                <p className="text-beforest-charcoal font-arizona-sans text-sm">Failed to load image</p>
              </div>
            )}
            <div className="absolute inset-0 bg-beforest-earth bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-300" />
          </div>
        ))}
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