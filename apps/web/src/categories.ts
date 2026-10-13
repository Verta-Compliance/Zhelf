import type { ListingCategory } from '@zhelf/shared';

export const LISTING_CATEGORIES = [
  'Books',
  'Clothing',
  'Shoes & Accessories',
  'Electronics',
  'Home & Garden',
  'Toys & Games',
  'Kids & Baby',
  'Sports & Outdoors',
  'Music & Instruments',
  'Beauty & Personal Care',
  'Art & Crafts',
  'Movies & Media',
  'Pet Supplies',
  'Stationery & Office',
] as const satisfies readonly ListingCategory[];

export function isListingCategory(value: unknown): value is ListingCategory {
  return (LISTING_CATEGORIES as readonly unknown[]).includes(value);
}
