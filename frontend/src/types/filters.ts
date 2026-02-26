export type FilterType = 'normal' | 'beauty' | 'vivid' | 'bw' | 'warm' | 'cool' | 'vintage';

export interface FilterConfig {
  name: FilterType;
  displayName: string;
  cssFilter: string;
  /** Emoji or short icon label shown in the strip */
  icon: string;
}

export const FILTERS: Record<FilterType, FilterConfig> = {
  normal: {
    name: 'normal',
    displayName: 'Normal',
    cssFilter: 'none',
    icon: '✨',
  },
  beauty: {
    name: 'beauty',
    displayName: 'Beauty',
    cssFilter: 'brightness(1.05) contrast(0.95) saturate(1.1)',
    icon: '💄',
  },
  vivid: {
    name: 'vivid',
    displayName: 'Vivid',
    cssFilter: 'saturate(1.8) contrast(1.1)',
    icon: '🌈',
  },
  bw: {
    name: 'bw',
    displayName: 'B&W',
    cssFilter: 'grayscale(1)',
    icon: '🎞️',
  },
  warm: {
    name: 'warm',
    displayName: 'Warm',
    cssFilter: 'sepia(0.3) saturate(1.2) brightness(1.05)',
    icon: '🌅',
  },
  cool: {
    name: 'cool',
    displayName: 'Cool',
    cssFilter: 'hue-rotate(180deg) saturate(1.2) brightness(1.05)',
    icon: '❄️',
  },
  vintage: {
    name: 'vintage',
    displayName: 'Vintage',
    cssFilter: 'sepia(0.5) contrast(0.8) brightness(0.95) saturate(0.9)',
    icon: '📷',
  },
};

export const FILTER_ORDER: FilterType[] = ['normal', 'beauty', 'vivid', 'bw', 'warm', 'cool', 'vintage'];
