'use client';

import { Suspense } from 'react';
import RecentUploads from '@/components/RecentUploads';

export default function RecentUploadsPage() {
  return (
    <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={
        <div className="animate-pulse">
          <div className="h-[80px] w-[240px] bg-beforest-gray/20 rounded-lg mx-auto mb-8" />
          <div className="h-[52px] w-[200px] bg-beforest-gray/20 rounded-lg mx-auto mb-12" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square bg-beforest-gray/20 rounded-lg"
              />
            ))}
          </div>
        </div>
      }>
        <RecentUploads />
      </Suspense>
    </main>
  );
} 