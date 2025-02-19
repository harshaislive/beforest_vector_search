import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  // For mobile, show only current page, prev, next, first and last
  // For desktop, show all pages with ellipsis if needed
  const getPageNumbers = () => {
    if (isMobile) {
      return [currentPage];
    }

    const pages = [];
    if (totalPages <= 7) {
      // Show all pages if total is 7 or less
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push('...');
      }
      
      // Show pages around current page
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      
      // Always show last page
      pages.push(totalPages);
    }
    
    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`p-2 rounded-lg border-2 ${
          currentPage === 1
            ? 'border-beforest-gray/30 text-beforest-charcoal/30 cursor-not-allowed'
            : 'border-beforest-olive/60 text-beforest-olive hover:border-beforest-olive hover:bg-beforest-olive/5'
        }`}
        aria-label="Previous page"
      >
        <ChevronLeftIcon className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-1">
        {getPageNumbers().map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === 'number' ? onPageChange(page) : null}
            disabled={page === '...'}
            className={`min-w-[40px] h-10 flex items-center justify-center rounded-lg border-2 text-sm font-arizona-flare
              ${page === currentPage
                ? 'border-beforest-olive bg-beforest-olive/10 text-beforest-olive'
                : page === '...'
                  ? 'border-transparent text-beforest-charcoal/60'
                  : 'border-beforest-olive/60 text-beforest-olive hover:border-beforest-olive hover:bg-beforest-olive/5'
              }`}
          >
            {page}
          </button>
        ))}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`p-2 rounded-lg border-2 ${
          currentPage === totalPages
            ? 'border-beforest-gray/30 text-beforest-charcoal/30 cursor-not-allowed'
            : 'border-beforest-olive/60 text-beforest-olive hover:border-beforest-olive hover:bg-beforest-olive/5'
        }`}
        aria-label="Next page"
      >
        <ChevronRightIcon className="h-5 w-5" />
      </button>

      {isMobile && (
        <span className="text-sm text-beforest-charcoal/60 font-arizona-flare ml-2">
          Page {currentPage} of {totalPages}
        </span>
      )}
    </div>
  );
} 