'use client';

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Dropbox Image Search",
  description: "Search and preview images from your Dropbox using semantic vector search",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-beforest-offwhite">
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
          {children}
        </div>
      </body>
    </html>
  );
}
