import { algoliasearch } from 'algoliasearch';
import type { Listing } from '@zhelf/shared';
import {
  INDEX_SETTINGS,
  buildSearchParams,
  toSearchRecord,
  type SearchQuery,
} from '../lib/search';

const indexName = () => process.env.ALGOLIA_INDEX_NAME || 'zhelf_listings';

export function isSearchConfigured(): boolean {
  return Boolean(
    process.env.ALGOLIA_APP_ID && process.env.ALGOLIA_ADMIN_API_KEY,
  );
}

let cached: { key: string; client: ReturnType<typeof algoliasearch> } | null =
  null;

function client() {
  const appId = process.env.ALGOLIA_APP_ID;
  const apiKey = process.env.ALGOLIA_ADMIN_API_KEY;
  if (!appId || !apiKey) {
    throw new Error('Algolia is not configured.');
  }

  const key = `${appId}:${apiKey}`;
  if (cached?.key !== key) {
    cached = { key, client: algoliasearch(appId, apiKey) };
  }
  return cached.client;
}

/** Ranked listing IDs for a query; the caller loads full listings from the database. */
export async function searchListingIds(query: SearchQuery): Promise<string[]> {
  const response = await client().searchSingleIndex<{ objectID: string }>({
    indexName: indexName(),
    searchParams: buildSearchParams(query),
  });
  return response.hits.map((hit) => hit.objectID);
}

export async function indexListings(listings: Listing[]): Promise<void> {
  if (!listings.length) return;
  await client().saveObjects({
    indexName: indexName(),
    objects: listings.map(toSearchRecord) as unknown as Record<
      string,
      unknown
    >[],
    waitForTasks: false,
  });
}

export async function removeListingsFromIndex(ids: string[]): Promise<void> {
  if (!ids.length) return;
  await client().deleteObjects({
    indexName: indexName(),
    objectIDs: ids,
    waitForTasks: false,
  });
}

/** Applies index settings and atomically replaces every record. */
export async function reindexAll(listings: Listing[]): Promise<number> {
  const algolia = client();
  await algolia.setSettings({
    indexName: indexName(),
    indexSettings: INDEX_SETTINGS,
  });
  await algolia.replaceAllObjects({
    indexName: indexName(),
    objects: listings.map(toSearchRecord) as unknown as Record<
      string,
      unknown
    >[],
  });
  return listings.length;
}
