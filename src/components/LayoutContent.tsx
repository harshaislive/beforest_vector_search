'use client';

import NavigationHeader from '@/components/NavigationHeader';

export default function LayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-beforest-offwhite">
      <NavigationHeader />
      {children}
    </div>
  );
} 