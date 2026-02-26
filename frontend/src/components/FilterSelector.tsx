import React from 'react';
import { FilterType, FILTERS, FILTER_ORDER } from '../types/filters';
import { cn } from '@/lib/utils';

interface FilterSelectorProps {
  selectedFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  isVisible: boolean;
}

export default function FilterSelector({
  selectedFilter,
  onFilterChange,
  isVisible,
}: FilterSelectorProps) {
  if (!isVisible) return null;

  return (
    <div className="w-full">
      <div
        className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {FILTER_ORDER.map((filterKey) => {
          const filter = FILTERS[filterKey];
          const isSelected = selectedFilter === filterKey;

          return (
            <button
              key={filterKey}
              onClick={() => onFilterChange(filterKey)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 snap-start shrink-0',
                'min-w-[72px] py-2 px-2 rounded-xl transition-all duration-200',
                'text-xs font-medium select-none touch-manipulation',
                isSelected
                  ? 'bg-primary text-primary-foreground shadow-md scale-105'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
              aria-pressed={isSelected}
              aria-label={`Apply ${filter.displayName} filter`}
            >
              <span className="text-base leading-none">{filter.icon}</span>
              <span className="leading-none">{filter.displayName}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
