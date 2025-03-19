'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function NavigationHeader() {
  const pathname = usePathname();
  
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <div className="w-[120px] h-[40px] relative">
            <Image
              src="https://beforest.co/wp-content/uploads/2024/10/23-Beforest-Black-with-Tagline.png"
              alt="Beforest Logo"
              fill
              priority
              className="object-contain"
            />
          </div>
        </Link>
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