import type { ListingCategory, ListingCondition } from '@zhelf/shared';
import { LISTING_CATEGORIES } from './categories';

export const LISTING_CONDITIONS = [
  'Like New',
  'Good',
  'Acceptable',
  'Used',
] as const satisfies readonly ListingCondition[];

export interface ListingSuggestion {
  category: ListingCategory;
  subcategory: string;
  title: string;
  condition: ListingCondition;
  description: string;
  /** GBP. Both 0 when the model gave no usable estimate. */
  priceMin: number;
  priceMax: number;
  material: string;
  colour: string;
  brand: string;
}

function text(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function price(value: unknown): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0 || numeric > 100000) return 0;
  return Math.round(numeric * 100) / 100;
}

/** Model output is untrusted: accept only values the listing form can hold. */
export function parseSuggestion(raw: unknown): ListingSuggestion | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;

  const category = LISTING_CATEGORIES.find((item) => item === record.category);
  const condition = LISTING_CONDITIONS.find((item) => item === record.condition);
  const title = text(record.title, 160);
  if (!category || !condition || !title) return null;

  let priceMin = price(record.priceMin);
  let priceMax = price(record.priceMax);
  if (!priceMin || !priceMax) {
    priceMin = 0;
    priceMax = 0;
  } else if (priceMin > priceMax) {
    [priceMin, priceMax] = [priceMax, priceMin];
  }

  return {
    category,
    subcategory: text(record.subcategory, 80),
    title,
    condition,
    description: text(record.description, 1500),
    priceMin,
    priceMax,
    material: text(record.material, 80),
    colour: text(record.colour, 80),
    brand: text(record.brand, 80),
  };
}
