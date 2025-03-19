import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import LayoutContent from '@/components/LayoutContent';

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
  return (
    <html lang="en">
      <body className={inter.className}>
        <LayoutContent>
          {children}
        </LayoutContent>
      </body>
    </html>
  );
}
