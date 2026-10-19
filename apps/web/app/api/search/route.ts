import { NextResponse } from 'next/server';
import { getListingsByIds } from '../../../src/server/database';
import {
  isSearchConfigured,
  searchListingIds,
} from '../../../src/server/search-index';

function number(value: string | null): number | undefined {
  if (value === null || value.trim() === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function GET(request: Request) {
  if (!isSearchConfigured()) {
    return NextResponse.json(
      {
        error: {
          code: 'SEARCH_UNAVAILABLE',
          message: 'Search is not configured.',
        },
      },
      { status: 503 },
    );
  }

  const params = new URL(request.url).searchParams;
  const latitude = number(params.get('lat'));
  const longitude = number(params.get('lng'));

  try {
    const ids = await searchListingIds({
      q: params.get('q') ?? '',
      category: params.get('category') ?? undefined,
      condition: params.get('condition') ?? undefined,
      near:
        latitude !== undefined && longitude !== undefined
          ? { latitude, longitude }
          : undefined,
      radiusKm: number(params.get('radiusKm')),
    });

    return NextResponse.json({ items: await getListingsByIds(ids) });
  } catch (error) {
    console.error('Search failed.', error);
    return NextResponse.json(
      {
        error: { code: 'SEARCH_FAILED', message: 'Search is unavailable.' },
      },
      { status: 502 },
    );
  }
}
