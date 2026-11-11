import type { Category } from '@/lib/domain/types';

const COLORS: Record<Category, string> = {
  Warhammer: '#1f3f99',
  Paints: '#d0202e',
  StarCraft: '#121317',
  'D&D': '#7a2a2a',
  Cards: '#5b3fa6',
  'Board games': '#17724a',
};

export function categoryColor(c: Category): string {
  return COLORS[c];
}

/** Simple line icons drawn for this site. No publisher logos or artwork. */
export function CategoryIcon({ category }: { category: Category }) {
  const p = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, width: 24, height: 24, 'aria-hidden': true, focusable: false } as const;
  switch (category) {
    case 'Warhammer':
      return (
        <svg {...p}>
          <path d="M12 3l3 4-3 3-3-3z" />
          <path d="M8 21v-5l4-6 4 6v5" />
        </svg>
      );
    case 'Paints':
      return (
        <svg {...p}>
          <rect x="7" y="8" width="10" height="13" />
          <path d="M9 8V4h6v4" />
        </svg>
      );
    case 'StarCraft':
      return (
        <svg {...p}>
          <path d="M12 2l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" />
        </svg>
      );
    case 'D&D':
      return (
        <svg {...p}>
          <polygon points="12,3 20,8 20,16 12,21 4,16 4,8" />
          <polygon points="12,8 15.5,14 8.5,14" />
        </svg>
      );
    case 'Cards':
      return (
        <svg {...p}>
          <rect x="9" y="4" width="11" height="15" />
          <path d="M6 7l-2 .5 2.6 13 7-1.4" />
        </svg>
      );
    case 'Board games':
      return (
        <svg {...p}>
          <rect x="3" y="3" width="18" height="18" />
          <circle cx="8" cy="8" r="1.4" fill="currentColor" />
          <circle cx="16" cy="16" r="1.4" fill="currentColor" />
          <circle cx="12" cy="12" r="1.4" fill="currentColor" />
        </svg>
      );
  }
}
