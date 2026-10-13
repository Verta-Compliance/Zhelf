'use client';

import Link from 'next/link';
import { useDeferredValue, useState } from 'react';
import { Button } from '@fluentui/react-button';
import { Card } from '@fluentui/react-card';
import { Text, Title3 } from '@fluentui/react-text';
import type { Listing, ListingCategory, ListingCondition } from '@zhelf/shared';

type CategoryFilter = 'All categories' | ListingCategory;
type ConditionFilter = 'Any condition' | ListingCondition;

export default function ListingBrowser({ listings }: { listings: Listing[] }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('All categories');
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
              <option>Books</option>
              <option>Clothing</option>
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
        <div className='card-list'>
          {filteredListings.map((listing) => (
            <Card
              key={listing.id}
              className='item-card'
            >
              <img
                src={listing.images[0]}
                alt={listing.title}
                className='card-image'
              />
              <div className='card-body'>
                <div className='card-top-row'>
                  <Text
                    size={300}
                    className='muted'
                  >
                    {listing.category}
                  </Text>
                  <Text weight='semibold'>
                    {listing.tradeMode === 'Swap'
                      ? 'Swap'
                      : `$${listing.price}`}
                  </Text>
                </div>
                <Title3 as='h3'>{listing.title}</Title3>
                <Text className='muted'>
                  {listing.condition} · {listing.location}
                </Text>
                {listing.tradeMode !== 'Sell' ? (
                  <Text className='muted listing-swap-summary'>
                    Wants: {listing.swapWanted}
                  </Text>
                ) : null}
                <div className='card-footer'>
                  <div className='listing-badges'>
                    <span className='status-badge'>{listing.status}</span>
                    <span className='trade-mode-badge'>
                      {listing.tradeMode}
                    </span>
                  </div>
                  <Link
                    href={`/listings/${listing.id}`}
                    className='view-link'
                  >
                    View details
                  </Link>
                </div>
              </div>
            </Card>
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
