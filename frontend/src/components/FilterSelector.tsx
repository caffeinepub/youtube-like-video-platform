import React from 'react';
import { FILTERS, FILTER_ORDER, FilterType } from '../types/filters';
import { useVideoFilter } from '../hooks/useVideoFilter';

interface FilterSelectorProps {
  onFilterChange?: (filter: FilterType) => void;
  activeFilter?: FilterType;
}

export default function FilterSelector({ onFilterChange, activeFilter = 'normal' }: FilterSelectorProps) {
  const handleSelect = (filter: FilterType) => {
    onFilterChange?.(filter);
  };

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
      {FILTER_ORDER.map((filterKey) => {
        const filter = FILTERS[filterKey];
        const isActive = activeFilter === filterKey;
        return (
          <button
            key={filterKey}
            onClick={() => handleSelect(filterKey)}
            className={`
              shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200
              ${isActive
                ? 'bg-mt-red-500 text-white shadow-glow-red-sm scale-105'
                : 'bg-mt-charcoal-800 text-mt-charcoal-300 hover:bg-mt-charcoal-700 hover:text-foreground'
              }
            `}
          >
            <span>{filter.icon}</span>
            <span>{filter.name}</span>
          </button>
        );
      })}
    </div>
  );
}
