'use client';

import Link from 'next/link';
import { ArrowRight, MapPin } from 'lucide-react';
import { useDeferredValue, useState } from 'react';
import { Button } from '@fluentui/react-button';
import { Text } from '@fluentui/react-text';
import type { Listing, ListingCategory, ListingCondition } from '@zhelf/shared';
import { LISTING_CATEGORIES } from '../src/categories';
import SavedListingButton from './saved-listing-button';

type CategoryFilter = 'All categories' | ListingCategory;
type ConditionFilter = 'Any condition' | ListingCondition;

export default function ListingBrowser({
  listings,
  savedListingIds,
  authenticated,
  initialSearch,
  initialCategory,
}: {
  listings: Listing[];
  savedListingIds: string[];
  authenticated: boolean;
  initialSearch: string;
  initialCategory: CategoryFilter;
}) {
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState<CategoryFilter>(initialCategory);
  const [condition, setCondition] = useState<ConditionFilter>('Any condition');
  const deferredSearch = useDeferredValue(search.trim().toLocaleLowerCase());

  const filteredListings = listings.filter((listing) => {
    const matchesSearch =
      !deferredSearch ||
      [
        listing.title,
        listing.description,
        listing.location,
        listing.seller.name,
        listing.tradeMode,
        listing.swapWanted,
      ]
        .join(' ')
        .toLocaleLowerCase()
        .includes(deferredSearch);
    const matchesCategory =
      category === 'All categories' || listing.category === category;
    const matchesCondition =
      condition === 'Any condition' || listing.condition === condition;

    return matchesSearch && matchesCategory && matchesCondition;
  });
  const hasFilters = Boolean(
    search || category !== 'All categories' || condition !== 'Any condition',
  );

  function clearFilters() {
    setSearch('');
    setCategory('All categories');
    setCondition('Any condition');
  }

  return (
    <>
      <div className='browse-controls'>
        <label className='browse-search'>
          <span>Search listings</span>
          <input
            type='search'
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder='Title, details, seller, or location'
          />
        </label>
        <div className='browse-filters'>
          <label>
            <span>Category</span>
            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as CategoryFilter)
              }
            >
              <option>All categories</option>
              {LISTING_CATEGORIES.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Condition</span>
            <select
              value={condition}
              onChange={(event) =>
                setCondition(event.target.value as ConditionFilter)
              }
            >
              <option>Any condition</option>
              <option>Like New</option>
              <option>Good</option>
              <option>Acceptable</option>
              <option>Used</option>
            </select>
          </label>
        </div>
      </div>

      <div
        className='browse-results'
        aria-live='polite'
      >
        <Text className='muted'>
          {filteredListings.length}{' '}
          {filteredListings.length === 1 ? 'listing' : 'listings'}
        </Text>
        {hasFilters ? (
          <Button
            appearance='transparent'
            onClick={clearFilters}
          >
            Clear filters
          </Button>
        ) : null}
      </div>

      {filteredListings.length ? (
        <div className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
          {filteredListings.map((listing) => (
            <article
              key={listing.id}
              className='group flex min-w-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white transition-shadow duration-200 hover:shadow-md'
            >
              <div className='relative aspect-[4/3] overflow-hidden bg-slate-100'>
                <img
                  src={listing.images[0]}
                  alt={listing.title}
                  className='h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]'
                />
                <span className='absolute left-3 top-3 max-w-[calc(100%-4.5rem)] truncate rounded-md bg-white/95 px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm'>
                  {listing.category}
                </span>
                <div className='absolute right-3 top-3'>
                  <SavedListingButton
                    listingId={listing.id}
                    initiallySaved={savedListingIds.includes(listing.id)}
                    authenticated={authenticated}
                  />
                </div>
                <span
                  className={`absolute bottom-3 left-3 rounded-md px-2.5 py-1 text-xs font-semibold ${
                    listing.status === 'Available'
                      ? 'bg-emerald-100 text-emerald-800'
                      : listing.status === 'Sold'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-white/95 text-slate-700'
                  }`}
                >
                  {listing.status}
                </span>
              </div>

              <div className='flex flex-1 flex-col p-4'>
                <div className='flex items-start justify-between gap-3'>
                  <h3 className='line-clamp-2 min-h-12 min-w-0 flex-1 text-base font-semibold leading-6 text-slate-900'>
                    <Link
                      href={`/listings/${listing.id}`}
                      className='rounded-sm transition-colors hover:text-[#d45b39] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e36b48]'
                    >
                      {listing.title}
                    </Link>
                  </h3>
                  <span className='shrink-0 text-base font-semibold text-slate-900'>
                    {listing.tradeMode === 'Swap' ? 'Swap' : `$${listing.price}`}
                  </span>
                </div>
                <p className='mt-2 flex min-w-0 items-center gap-1.5 truncate text-sm text-slate-500'>
                  <span>{listing.condition}</span>
                  <span aria-hidden='true'>·</span>
                  <MapPin className='size-3.5 shrink-0' aria-hidden='true' />
                  <span className='truncate'>{listing.location}</span>
                </p>
                <div className='mt-2 min-h-10'>
                  {listing.tradeMode !== 'Sell' && listing.swapWanted ? (
                    <p className='line-clamp-2 text-sm text-slate-600'>
                      Wants: {listing.swapWanted}
                    </p>
                  ) : null}
                </div>
                <div className='mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4'>
                  <span className='rounded-md bg-[#f7e7e1] px-2.5 py-1 text-xs font-semibold text-[#b94e30]'>
                    {listing.tradeMode}
                  </span>
                  <Link
                    href={`/listings/${listing.id}`}
                    className='inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-[#d45b39] transition-colors hover:text-[#b94e30]'
                  >
                    View details
                    <ArrowRight className='size-4' aria-hidden='true' />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className='browse-empty'>
          <Text weight='semibold'>No listings match those filters.</Text>
          <Text className='muted'>
            Try another search or broaden your filters.
          </Text>
          {hasFilters ? (
            <Button
              appearance='secondary'
              onClick={clearFilters}
            >
              Clear filters
            </Button>
          ) : null}
        </div>
      )}
    </>
  );
}
