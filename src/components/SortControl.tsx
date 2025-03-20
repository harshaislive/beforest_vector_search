'use client';

import { useState } from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

export type SortDirection = 'asc' | 'desc';
export type SortType = 'date' | 'score';

interface SortControlProps {
  onSortChange: (type: SortType, direction: SortDirection) => void;
  initialDirection?: SortDirection;
  initialType?: SortType;
  isSearchResults?: boolean;
}

export default function SortControl({ 
  onSortChange, 
  initialDirection = 'desc', 
  initialType = 'date',
  isSearchResults = false
}: SortControlProps) {
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialDirection);
  const [sortType, setSortType] = useState<SortType>(initialType);

  const toggleDirection = () => {
    const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    setSortDirection(newDirection);
    onSortChange(sortType, newDirection);
  };
  
  const changeType = (newType: SortType) => {
    if (newType === sortType) {
      // If clicking the same type, toggle direction
      toggleDirection();
    } else {
      // If changing type, reset to default direction for that type
      const defaultDirection = newType === 'score' ? 'desc' : 'desc';
      setSortType(newType);
      setSortDirection(defaultDirection);
      onSortChange(newType, defaultDirection);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => changeType('date')}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors text-sm font-arizona-sans
          ${sortType === 'date' 
            ? 'bg-beforest-green/10 text-beforest-green border border-beforest-green/30' 
            : 'bg-beforest-offwhite hover:bg-beforest-gray/20 text-beforest-earth border border-transparent'
          }`}
        aria-label={`Sort by date ${sortDirection === 'asc' ? 'ascending' : 'descending'}`}
      >
        <span>Date</span>
        {sortType === 'date' && (
          sortDirection === 'asc' 
            ? <ArrowUpIcon className="h-4 w-4" /> 
            : <ArrowDownIcon className="h-4 w-4" />
        )}
      </button>
      
      {isSearchResults && (
        <button
          onClick={() => changeType('score')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors text-sm font-arizona-sans
            ${sortType === 'score' 
              ? 'bg-beforest-green/10 text-beforest-green border border-beforest-green/30' 
              : 'bg-beforest-offwhite hover:bg-beforest-gray/20 text-beforest-earth border border-transparent'
            }`}
          aria-label={`Sort by similarity score ${sortDirection === 'asc' ? 'ascending' : 'descending'}`}
        >
          <span>Similarity</span>
          {sortType === 'score' && (
            sortDirection === 'asc' 
              ? <ArrowUpIcon className="h-4 w-4" /> 
              : <ArrowDownIcon className="h-4 w-4" />
          )}
        </button>
      )}
    </div>
  );
}