import Link from 'next/link';
import { Button } from '@fluentui/react-button';
import { Text, Title2, Title3 } from '@fluentui/react-text';
import { createSupabaseServerClient } from '../../../src/lib/supabase/server';
import {
  getListing,
  getSavedListingIds,
  getUserListings,
} from '../../../src/server/database';
import OfferPanel from './offer-panel';
import SavedListingButton from '../../../components/saved-listing-button';
import ListingMap from '../../../components/listing-map';
import ReportListingButton from './report-listing-button';

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await getListing(id);
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!listing) {
    return (
      <main className='container'>
        <Title2 as='h1'>Listing not found</Title2>
        <Link
          href='/'
          className='secondary-btn'
          style={{ display: 'inline-flex', marginTop: '1rem' }}
        >
          Back to marketplace
        </Link>
      </main>
    );
  }

  const savedListingIds = user ? await getSavedListingIds(user.id) : [];

  return (
    <main className='container listing-page'>
      <section className='gallery'>
        {listing.images.map((image) => (
          <img
            key={image}
            src={image}
            alt={listing.title}
          />
        ))}
      </section>

      <aside className='details-card'>
        <Text className='muted'>{listing.category}</Text>
        <Title2
          as='h1'
          style={{ margin: '0.5rem 0 0.75rem' }}
        >
          {listing.title}
        </Title2>
        {listing.tradeMode !== 'Swap' ? (
          <Title3 as='h2'>${listing.price}</Title3>
        ) : null}
        {listing.tradeMode !== 'Sell' ? (
          <p className='swap-wanted'>Wants: {listing.swapWanted}</p>
        ) : null}
        <Text style={{ display: 'block', margin: '0.5rem 0' }}>
          {listing.condition} · {listing.location}
        </Text>
        <Text>{listing.description}</Text>

        <ListingMap
          latitude={listing.latitude}
          longitude={listing.longitude}
          location={listing.location}
        />
        <SavedListingButton
          listingId={listing.id}
          initiallySaved={savedListingIds.includes(listing.id)}
          authenticated={Boolean(user)}
        />

        <OfferPanel
          listing={listing}
          currentUserId={user?.id ?? null}
          swapListings={
            user
              ? (await getUserListings(user.id)).filter(
                  (item) =>
                    item.id !== listing.id &&
                    item.status === 'Available' &&
                    item.tradeMode !== 'Sell',
                )
              : []
          }
        />
        {user?.id !== listing.seller.id ? (
          <ReportListingButton
            listingId={listing.id}
            authenticated={Boolean(user)}
          />
        ) : null}
        <div className='listing-actions'>
          <Link
            href='/'
            className='secondary-btn'
          >
            Back to feed
          </Link>
        </div>
      </aside>
    </main>
  );
}
