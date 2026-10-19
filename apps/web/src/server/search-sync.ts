import { getListingsByIds } from './database';
import {
  indexListings,
  isSearchConfigured,
  removeListingsFromIndex,
} from './search-index';

/**
 * Keeps the search index in step with the database. Never throws: a search
 * outage must not fail a listing, offer or transaction that already succeeded.
 */
export async function syncListingsToSearch(ids: string[]): Promise<void> {
  if (!isSearchConfigured() || !ids.length) return;

  try {
    const unique = [...new Set(ids)];
    const found = await getListingsByIds(unique);
    const foundIds = new Set(found.map((listing) => listing.id));
    await indexListings(found);
    await removeListingsFromIndex(unique.filter((id) => !foundIds.has(id)));
  } catch (error) {
    console.error('Search index sync failed.', error);
  }
}
