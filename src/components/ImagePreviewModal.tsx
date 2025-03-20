'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import Image from 'next/image';
import { XMarkIcon, ArrowDownTrayIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { SearchResult } from '@/lib/types';

interface ImagePreviewModalProps {
  image: SearchResult & { temporaryLink: string | null };
  onClose: () => void;
}

export default function ImagePreviewModal({ image, onClose }: ImagePreviewModalProps) {
  const [downloadState, setDownloadState] = useState<'idle' | 'downloading' | 'success' | 'error'>('idle');
  const [showMetadata, setShowMetadata] = useState(false);
  
  const handleDownload = async () => {
    if (!image.dropbox_path) return;
    
    setDownloadState('downloading');
    
    try {
      // Request the full-size original image directly from API
      const response = await fetch(`/api/download?path=${encodeURIComponent(image.dropbox_path)}`);
      
      if (!response.ok) {
        throw new Error('Download failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = image.dropbox_path.split('/').pop() || 'image';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setDownloadState('success');
      setTimeout(() => setDownloadState('idle'), 2000);
    } catch (error) {
      console.error('Error downloading image:', error);
      setDownloadState('error');
      setTimeout(() => setDownloadState('idle'), 3000);
    }
  };

  const formatScore = (score: number): string => {
    return `${Math.round(score * 100)}%`;
  };
  
  const filename = image.dropbox_path.split('/').pop() || 'image';
  
  // Format date nicely
  const formattedDate = new Date(image.modified_date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

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
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
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
              <Dialog.Panel className="relative w-full max-w-5xl transform rounded-lg bg-white shadow-xl transition-all overflow-hidden flex flex-col">
                {/* Header with controls */}
                <div className="px-4 py-3 bg-beforest-offwhite border-b border-beforest-gray/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Dialog.Title className="text-lg font-arizona text-beforest-earth truncate max-w-md">
                      {filename}
                    </Dialog.Title>
                    
                    {image.exact_match && (
                      <span className="text-beforest-green text-xs font-arizona-sans bg-beforest-green/10 px-2 py-0.5 rounded-full">
                        Exact Match
                      </span>
                    )}
                    
                    <span className="text-beforest-earth/80 text-xs font-arizona-sans bg-beforest-gray/20 px-2 py-0.5 rounded-full">
                      {formatScore(image.similarity_score)}
                    </span>
                    
                    <span className="text-beforest-earth/70 text-xs font-arizona-sans hidden sm:block">
                      {formattedDate}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowMetadata(!showMetadata)}
                      className="rounded-full p-2 hover:bg-beforest-gray/20 transition-colors"
                      aria-label="Toggle metadata"
                    >
                      <InformationCircleIcon className="h-5 w-5 text-beforest-earth" />
                    </button>

                    <button
                      onClick={handleDownload}
                      disabled={downloadState === 'downloading'}
                      className={`rounded-full p-2 transition-colors flex items-center gap-1 ${
                        downloadState === 'downloading' 
                          ? 'bg-beforest-gray/30 cursor-wait' 
                          : downloadState === 'success'
                          ? 'bg-beforest-green/20 text-beforest-green'
                          : downloadState === 'error'
                          ? 'bg-red-100 text-red-600'
                          : 'hover:bg-beforest-gray/20 text-beforest-earth'
                      }`}
                      aria-label="Download original image"
                    >
                      {downloadState === 'downloading' ? (
                        <span className="h-5 w-5 border-2 border-beforest-gray border-t-beforest-green rounded-full animate-spin" />
                      ) : downloadState === 'success' ? (
                        <CheckCircleIcon className="h-5 w-5" />
                      ) : (
                        <ArrowDownTrayIcon className="h-5 w-5" />
                      )}
                      
                      {downloadState === 'downloading' && (
                        <span className="text-xs">Downloading...</span>
                      )}
                      {downloadState === 'success' && (
                        <span className="text-xs">Downloaded!</span>
                      )}
                      {downloadState === 'error' && (
                        <span className="text-xs">Failed</span>
                      )}
                    </button>
                    
                    <button
                      onClick={onClose}
                      className="rounded-full p-2 hover:bg-beforest-gray/20 transition-colors"
                      aria-label="Close modal"
                    >
                      <XMarkIcon className="h-5 w-5 text-beforest-earth" />
                    </button>
                  </div>
                </div>
                
                {/* Main content area with image and optional metadata sidebar */}
                <div className={`flex flex-col md:flex-row flex-grow ${showMetadata ? 'md:divide-x' : ''}`}>
                  {/* Image container with flexible aspect ratio */}
                  <div className="relative flex-grow bg-beforest-gray/10 flex items-center justify-center p-2 max-h-[75vh] md:max-h-[80vh]">
                    {image.temporaryLink ? (
                      <div className="relative h-full w-full flex items-center justify-center">
                        <Image
                          src={image.temporaryLink}
                          alt={filename}
                          className="object-contain max-h-full"
                          width={1024}
                          height={768}
                          sizes="(max-width: 1024px) 100vw, 1024px"
                          quality={90}
                          loading="eager"
                          priority={true}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-64 w-full">
                        <p className="text-beforest-charcoal font-arizona-sans">Failed to load image</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Metadata sidebar - only shown when toggled */}
                  {showMetadata && (
                    <div className="w-full md:w-80 p-4 bg-white overflow-y-auto">
                      <h3 className="font-arizona text-beforest-earth text-base mb-3">Image Details</h3>
                      
                      <div className="space-y-3 font-arizona-sans text-sm">
                        <div>
                          <p className="text-beforest-charcoal/60 text-xs mb-0.5">Filename</p>
                          <p className="text-beforest-earth break-all">{filename}</p>
                        </div>
                        
                        <div>
                          <p className="text-beforest-charcoal/60 text-xs mb-0.5">Path</p>
                          <p className="text-beforest-earth break-all">{image.dropbox_path}</p>
                        </div>
                        
                        <div>
                          <p className="text-beforest-charcoal/60 text-xs mb-0.5">Source</p>
                          <p className="text-beforest-earth">{image.source_csv.split('_')[0]}</p>
                        </div>
                        
                        <div>
                          <p className="text-beforest-charcoal/60 text-xs mb-0.5">Modified</p>
                          <p className="text-beforest-earth">{formattedDate}</p>
                        </div>
                        
                        <div>
                          <p className="text-beforest-charcoal/60 text-xs mb-0.5">Similarity Score</p>
                          <div className="w-full bg-beforest-gray/20 rounded-full h-2 mt-1">
                            <div 
                              className="bg-beforest-green h-2 rounded-full" 
                              style={{ width: `${image.similarity_score * 100}%` }}
                            />
                          </div>
                          <p className="text-beforest-earth text-xs mt-1">
                            {formatScore(image.similarity_score)}
                            {image.exact_match && " - Exact Match"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
} 