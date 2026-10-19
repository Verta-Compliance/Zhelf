import { normalizeCoordinates } from './geo';

export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';
const COUNTRY = process.env.NEXT_PUBLIC_MAPBOX_COUNTRY ?? 'gb';

export interface PlaceSuggestion {
  /** Short name stored as the listing location, e.g. "Manchester". */
  name: string;
  /** Longer text shown in the dropdown. */
  label: string;
  latitude: number;
  longitude: number;
}

export function parsePlaceSuggestions(data: unknown): PlaceSuggestion[] {
  const features = (data as { features?: unknown } | null)?.features;
  if (!Array.isArray(features)) return [];

  const places: PlaceSuggestion[] = [];
  for (const feature of features) {
    const properties = (feature as { properties?: Record<string, unknown> })
      ?.properties;
    const coordinates = properties?.coordinates as
      | { latitude?: unknown; longitude?: unknown }
      | undefined;
    const name = typeof properties?.name === 'string' ? properties.name : '';
    const context =
      typeof properties?.place_formatted === 'string'
        ? properties.place_formatted
        : '';
    const point = normalizeCoordinates(
      coordinates?.latitude,
      coordinates?.longitude,
    );

    if (!name || !point) continue;
    places.push({
      name,
      label: context ? `${name}, ${context}` : name,
      ...point,
    });
  }

  return places;
}

export async function searchPlaces(
  query: string,
  signal?: AbortSignal,
): Promise<PlaceSuggestion[]> {
  const text = query.trim();
  if (!MAPBOX_TOKEN || text.length < 2) return [];

  const url = new URL('https://api.mapbox.com/search/geocode/v6/forward');
  url.searchParams.set('q', text);
  url.searchParams.set('access_token', MAPBOX_TOKEN);
  url.searchParams.set('autocomplete', 'true');
  url.searchParams.set('types', 'place,locality,neighborhood,postcode');
  url.searchParams.set('limit', '5');
  url.searchParams.set('language', 'en');
  if (COUNTRY) url.searchParams.set('country', COUNTRY);

  const response = await fetch(url, { signal });
  if (!response.ok) return [];
  return parsePlaceSuggestions(await response.json());
}

export function staticMapUrl(
  latitude: number,
  longitude: number,
  options: { width?: number; height?: number; zoom?: number } = {},
): string | null {
  if (!MAPBOX_TOKEN) return null;
  const { width = 640, height = 280, zoom = 11 } = options;
  const center = `${longitude},${latitude}`;

  return (
    'https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/' +
    `pin-l+1e6bff(${center})/${center},${zoom},0/${width}x${height}@2x` +
    `?access_token=${encodeURIComponent(MAPBOX_TOKEN)}`
  );
}
