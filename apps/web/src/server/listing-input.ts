import type {
  ListingCategory,
  ListingCondition,
  ListingTradeMode,
} from '@zhelf/shared';
import { isListingCategory } from '../categories';
import { normalizeCoordinates } from '../lib/geo';

export interface ParsedListingInput {
  title: string;
  category: ListingCategory;
  condition: ListingCondition;
  tradeMode: ListingTradeMode;
  price: number;
  swapWanted: string;
  description: string;
  images: string[];
  location: string;
  latitude: number | null;
  longitude: number | null;
}

function normalizeCategory(value: unknown): ListingCategory | null {
  if (isListingCategory(value)) return value;
  if (value === 'books') return 'Books';
  if (value === 'clothing' || value === 'fashion') return 'Clothing';
  if (value === 'home') return 'Home & Garden';
  return null;
}

function normalizeCondition(value: unknown): ListingCondition {
  if (
    value === 'Like New' ||
    value === 'Good' ||
    value === 'Acceptable' ||
    value === 'Used'
  ) {
    return value;
  }

  return 'Good';
}

function normalizeTradeMode(value: unknown): ListingTradeMode | null {
  if (value === 'Sell' || value === 'Swap' || value === 'Sell or swap') {
    return value;
  }

  return value === undefined ? 'Sell' : null;
}

/** Returns null when the body is not a valid listing. */
export function parseListingInput(
  body: Record<string, unknown>,
): ParsedListingInput | null {
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const category = normalizeCategory(body.category);
  const tradeMode = normalizeTradeMode(body.tradeMode);
  const price = tradeMode === 'Swap' ? 0 : Number(body.price);
  const swapWanted =
    typeof body.swapWanted === 'string' ? body.swapWanted.trim() : '';
  const description =
    typeof body.description === 'string' ? body.description.trim() : '';
  const location =
    typeof body.location === 'string' ? body.location.trim() : 'Manchester';
  const images =
    body.images === undefined
      ? []
      : Array.isArray(body.images) &&
          body.images.length <= 8 &&
          body.images.every(
            (image) => typeof image === 'string' && image.length <= 2048,
          )
        ? body.images.map((image) => image.trim()).filter(Boolean)
        : null;

  const needsPrice = tradeMode !== 'Swap';
  const needsSwapDetails = tradeMode !== 'Sell';

  if (
    !title ||
    !category ||
    !tradeMode ||
    !images ||
    (needsPrice && (!Number.isFinite(price) || price <= 0)) ||
    (needsSwapDetails && (!swapWanted || swapWanted.length > 500))
  ) {
    return null;
  }

  const point = normalizeCoordinates(body.latitude, body.longitude);

  return {
    title,
    category,
    condition: normalizeCondition(body.condition),
    tradeMode,
    price,
    swapWanted,
    description,
    images,
    location,
    latitude: point?.latitude ?? null,
    longitude: point?.longitude ?? null,
  };
}
