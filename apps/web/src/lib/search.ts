import type { Listing } from '@zhelf/shared';
import { LISTING_CATEGORIES } from '../categories';
import { LISTING_CONDITIONS } from '../listing-suggestion';
import { normalizeCoordinates } from './geo';

export const SEARCH_PAGE_SIZE = 48;
export const SEARCH_RADIUS_OPTIONS_KM = [10, 25, 50, 100] as const;

export interface ListingSearchRecord {
  objectID: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  tradeMode: string;
  swapWanted: string;
  status: string;
  price: number;
  location: string;
  sellerName: string;
  /** Unix seconds, used for newest-first ranking. */
  createdAt: number;
  _geoloc?: { lat: number; lng: number };
}

export const INDEX_SETTINGS = {
  searchableAttributes: [
    'title',
    'description',
    'category',
    'location',
    'sellerName',
    'swapWanted',
  ],
  attributesForFaceting: ['category', 'condition', 'status', 'tradeMode'],
  customRanking: ['desc(createdAt)'],
};

export function toSearchRecord(listing: Listing): ListingSearchRecord {
  const record: ListingSearchRecord = {
    objectID: listing.id,
    title: listing.title,
    description: listing.description,
    category: listing.category,
    condition: listing.condition,
    tradeMode: listing.tradeMode,
    swapWanted: listing.swapWanted,
    status: listing.status,
    price: listing.price,
    location: listing.location,
    sellerName: listing.seller.name,
    createdAt: Math.floor(Date.parse(listing.createdAt) / 1000) || 0,
  };

  if (listing.latitude !== null && listing.longitude !== null) {
    record._geoloc = { lat: listing.latitude, lng: listing.longitude };
  }

  return record;
}

export interface SearchQuery {
  q: string;
  category?: string;
  condition?: string;
  near?: { latitude: number; longitude: number };
  radiusKm?: number;
}

export interface SearchParams {
  query: string;
  hitsPerPage: number;
  attributesToRetrieve: string[];
  attributesToHighlight: string[];
  filters?: string;
  aroundLatLng?: string;
  aroundRadius?: number;
}

/** Only whitelisted facet values reach the filter string, so user input cannot alter it. */
export function buildSearchParams(input: SearchQuery): SearchParams {
  const params: SearchParams = {
    query: input.q.trim().slice(0, 200),
    hitsPerPage: SEARCH_PAGE_SIZE,
    attributesToRetrieve: ['objectID'],
    attributesToHighlight: [],
  };

  const filters: string[] = [];
  const category = LISTING_CATEGORIES.find((item) => item === input.category);
  if (category) filters.push(`category:"${category}"`);
  const condition = LISTING_CONDITIONS.find((item) => item === input.condition);
  if (condition) filters.push(`condition:"${condition}"`);
  if (filters.length) params.filters = filters.join(' AND ');

  const near = input.near
    ? normalizeCoordinates(input.near.latitude, input.near.longitude)
    : null;
  if (near) {
    const radiusKm = Math.min(Math.max(input.radiusKm ?? 25, 5), 200);
    params.aroundLatLng = `${near.latitude},${near.longitude}`;
    params.aroundRadius = Math.round(radiusKm * 1000);
  }

  return params;
}
