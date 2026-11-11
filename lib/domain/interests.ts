import type { Category, EventType, Interest } from './types';

export function interestForCategory(category: Category): Interest {
  switch (category) {
    case 'Warhammer':
    case 'StarCraft':
      return 'Warhammer';
    case 'Paints':
      return 'Paints';
    case 'D&D':
      return 'D&D';
    case 'Cards':
      return 'Cards';
    case 'Board games':
      return 'Board games';
  }
}

export function interestForEvent(type: EventType): Interest | undefined {
  switch (type) {
    case 'warhammer':
      return 'Warhammer';
    case 'paint':
      return 'Paints';
    case 'cards':
      return 'Cards';
    case 'dnd':
      return 'D&D';
    case 'store':
      return undefined;
  }
}
