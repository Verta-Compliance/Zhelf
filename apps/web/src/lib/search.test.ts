import { describe, expect, it } from 'vitest';
import type { Listing } from '@zhelf/shared';
import { buildSearchParams, toSearchRecord } from './search';

const listing: Listing = {
  id: 'abc',
  title: 'IKEA wooden dining chair',
  price: 18,
  category: 'Home & Garden',
  condition: 'Good',
  tradeMode: 'Sell',
  swapWanted: '',
  status: 'Available',
  description: 'Solid wood.',
  location: 'Manchester',
  latitude: 53.48,
  longitude: -2.24,
  images: ['https://example.com/a.jpg'],
  seller: {
    id: 's1',
    name: 'Sam',
    avatar: '',
    rating: 5,
    listings: 1,
    location: 'Manchester',
    bio: '',
  },
  createdAt: '2026-10-18T10:00:00.000Z',
};

describe('toSearchRecord', () => {
  it('maps a listing and includes _geoloc only when coordinates exist', () => {
    const record = toSearchRecord(listing);
    expect(record.objectID).toBe('abc');
    expect(record.sellerName).toBe('Sam');
    expect(record.createdAt).toBe(
      Math.floor(Date.parse(listing.createdAt) / 1000),
    );
    expect(record._geoloc).toEqual({ lat: 53.48, lng: -2.24 });

    const noPlace = toSearchRecord({
      ...listing,
      latitude: null,
      longitude: null,
    });
    expect(noPlace._geoloc).toBeUndefined();
  });
});

describe('buildSearchParams', () => {
  it('builds filters only from whitelisted facet values', () => {
    expect(
      buildSearchParams({
        q: ' chair ',
        category: 'Home & Garden',
        condition: 'Good',
      }),
    ).toMatchObject({
      query: 'chair',
      filters: 'category:"Home & Garden" AND condition:"Good"',
    });

    const hostile = buildSearchParams({
      q: 'x',
      category: 'Books" OR status:Sold',
      condition: 'anything',
    });
    expect(hostile.filters).toBeUndefined();
  });

  it('adds a geo search with a clamped radius, using grid-snapped coordinates', () => {
    const params = buildSearchParams({
      q: '',
      near: { latitude: 53.4839, longitude: -2.2446 },
      radiusKm: 9999,
    });
    expect(params.aroundRadius).toBe(200_000);
    expect(params.aroundLatLng).toMatch(/^53\.\d+,-2\.\d+$/);
  });

  it('ignores invalid coordinates and caps query length', () => {
    const params = buildSearchParams({
      q: 'a'.repeat(500),
      near: { latitude: 500, longitude: 0 },
    });
    expect(params.aroundLatLng).toBeUndefined();
    expect(params.query).toHaveLength(200);
  });
});
