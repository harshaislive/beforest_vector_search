'use client';

import { Suspense } from 'react';
import SearchContent from '@/components/SearchContent';

export default function Home() {
  return (
    <main className="min-h-screen bg-beforest-offwhite">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Suspense fallback={
          <div className="animate-pulse">
            <div className="h-[80px] w-[240px] bg-beforest-gray/20 rounded-lg mx-auto mb-8" />
            <div className="h-[52px] w-[200px] bg-beforest-gray/20 rounded-lg mx-auto mb-12" />
            <div className="h-[48px] w-full max-w-4xl mx-auto bg-beforest-gray/20 rounded-lg" />
          </div>
        }>
          <SearchContent />
        </Suspense>
      </div>
    </main>
  );
}
