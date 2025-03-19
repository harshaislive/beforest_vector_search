'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavigationHeader() {
  const pathname = usePathname();
  
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-end">
        <Link
          href={pathname === '/recent-uploads' ? '/' : '/recent-uploads'}
          className="px-4 py-2 rounded bg-beforest-green text-white font-arizona text-[14px] uppercase tracking-wide hover:bg-beforest-green/90 transition-colors"
        >
          {pathname === '/recent-uploads' ? 'Search Images' : 'Recent Uploads'}
        </Link>
      </div>
    </header>
  );
} 