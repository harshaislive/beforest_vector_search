'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import Image from 'next/image';
import { XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { SearchResult } from '@/lib/types';

interface ImagePreviewModalProps {
  image: SearchResult & { temporaryLink: string | null };
  onClose: () => void;
}

export default function ImagePreviewModal({ image, onClose }: ImagePreviewModalProps) {
  const handleDownload = async () => {
    if (!image.temporaryLink) return;

    try {
      const response = await fetch(image.temporaryLink);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = image.dropbox_path.split('/').pop() || 'image';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  const formatScore = (score: number): string => {
    return `${Math.round(score * 100)}%`;
  };

  return (
    <Transition appear show={true} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-beforest-earth bg-opacity-75" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-4xl transform rounded-lg bg-beforest-offwhite shadow-xl transition-all">
                <div className="absolute left-2 top-2 z-10 flex items-center gap-2">
                  <span className="text-beforest-earth/90 font-arizona-sans text-sm bg-white/80 backdrop-blur-sm px-2 py-1 rounded-sm">
                    {formatScore(image.similarity_score)}
                  </span>
                  {image.exact_match && (
                    <span className="text-beforest-earth/90 font-arizona-sans text-sm bg-white/80 backdrop-blur-sm px-2 py-1 rounded-sm">
                      Exact Match
                    </span>
                  )}
                </div>

                <button
                  onClick={onClose}
                  className="absolute right-2 top-2 z-10 rounded-full bg-white/80 backdrop-blur-sm p-2 
                    hover:bg-beforest-gray/80 transition-colors duration-200"
                >
                  <XMarkIcon className="h-5 w-5 text-beforest-earth" />
                </button>

                <button
                  onClick={handleDownload}
                  className="absolute right-12 top-2 z-10 rounded-full bg-white/80 backdrop-blur-sm p-2 
                    hover:bg-beforest-gray/80 transition-colors duration-200"
                  disabled={!image.temporaryLink}
                >
                  <ArrowDownTrayIcon className="h-5 w-5 text-beforest-earth" />
                </button>

                <div className="aspect-square relative w-full">
                  {image.temporaryLink ? (
                    <Image
                      src={image.temporaryLink}
                      alt={image.dropbox_path.split('/').pop() || ''}
                      fill
                      className="object-contain"
                      sizes="(max-width: 1024px) 100vw, 1024px"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-beforest-gray">
                      <p className="text-beforest-charcoal font-arizona-sans">Failed to load image</p>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-beforest-offwhite">
                  <p className="text-[22px] font-arizona-sans text-beforest-earth truncate">
                    {image.dropbox_path.split('/').pop()}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-4 text-sm font-arizona-sans text-beforest-charcoal/80">
                    <span>Path: {image.dropbox_path}</span>
                    <span>Source: {image.source_csv.split('_')[0]}</span>
                    <span>Modified: {new Date(image.modified_date).toLocaleDateString()}</span>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
} 