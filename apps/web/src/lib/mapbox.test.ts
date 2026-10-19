import { describe, expect, it } from 'vitest';
import { normalizeCoordinates, snapToGrid } from './geo';
import { parsePlaceSuggestions } from './mapbox';

function distanceKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const rad = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLng = rad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitude)) *
      Math.cos(rad(b.latitude)) *
      Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

const ukPoints = [
  { latitude: 53.4839, longitude: -2.2446 },
  { latitude: 51.5072, longitude: -0.1276 },
  { latitude: 55.9533, longitude: -3.1883 },
  { latitude: 52.3047, longitude: -0.6942 },
  { latitude: 57.1497, longitude: -2.0943 },
];

describe('geo helpers', () => {
  it('snaps to a ~5 km grid: never further than half a cell diagonal away', () => {
    for (const point of ukPoints) {
      const snapped = snapToGrid(point.latitude, point.longitude);
      expect(distanceKm(point, snapped)).toBeLessThan(3.7);
    }
  });

  it('is idempotent, so edits do not drift', () => {
    for (const point of ukPoints) {
      const once = snapToGrid(point.latitude, point.longitude);
      expect(snapToGrid(once.latitude, once.longitude)).toEqual(once);
    }
  });

  it('hides the exact point: nearby addresses share a cell', () => {
    expect(snapToGrid(53.4839, -2.2446)).toEqual(snapToGrid(53.4851, -2.2431));
  });

  it('requires both values and rejects out-of-range input', () => {
    expect(normalizeCoordinates(53.4839, -2.2446)).toEqual(
      snapToGrid(53.4839, -2.2446),
    );
    expect(normalizeCoordinates(53.4839, undefined)).toBeNull();
    expect(normalizeCoordinates(null, null)).toBeNull();
    expect(normalizeCoordinates(91, 0)).toBeNull();
    expect(normalizeCoordinates(0, 181)).toBeNull();
    expect(normalizeCoordinates('x', 1)).toBeNull();
  });

  it('stays within valid ranges at the poles and date line', () => {
    const pole = snapToGrid(90, 180);
    expect(pole.latitude).toBeLessThanOrEqual(90);
    expect(Math.abs(pole.longitude)).toBeLessThanOrEqual(180);
  });
});

describe('parsePlaceSuggestions', () => {
  it('maps Mapbox v6 features and skips unusable ones', () => {
    const places = parsePlaceSuggestions({
      features: [
        {
          properties: {
            name: 'Manchester',
            place_formatted: 'Greater Manchester, England, United Kingdom',
            coordinates: { latitude: 53.4839, longitude: -2.2446 },
          },
        },
        { properties: { name: 'No coordinates' } },
        { properties: { coordinates: { latitude: 1, longitude: 1 } } },
      ],
    });

    expect(places).toEqual([
      {
        name: 'Manchester',
        label: 'Manchester, Greater Manchester, England, United Kingdom',
        ...snapToGrid(53.4839, -2.2446),
      },
    ]);
  });

  it('returns nothing for malformed responses', () => {
    expect(parsePlaceSuggestions(null)).toEqual([]);
    expect(parsePlaceSuggestions({ features: 'nope' })).toEqual([]);
  });
});
