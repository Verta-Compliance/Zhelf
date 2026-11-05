import Link from 'next/link';
import { ArrowLeft, MapPin, MessageCircle, UserRound } from 'lucide-react';
import { createSupabaseServerClient } from '../../../src/lib/supabase/server';
import {
  getListing,
  getListings,
  getSavedListingIds,
  getUserListings,
} from '../../../src/server/database';
import OfferPanel from './offer-panel';
import SavedListingButton from '../../../components/saved-listing-button';
import ListingMap from '../../../components/listing-map';
import ReportListingButton from './report-listing-button';
import MessageSeller from './message-seller';

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
      <main className='mx-auto min-h-[60vh] max-w-7xl px-4 py-16 sm:px-6 lg:px-8'>
        <div className='mx-auto grid max-w-lg justify-items-center gap-4 py-16 text-center'>
          <h1 className='text-3xl font-semibold text-slate-900'>Listing not found</h1>
          <p className='text-slate-600'>This listing may have been removed or is no longer available.</p>
          <Link href='/' className='inline-flex h-10 items-center rounded-lg bg-[#e36b48] px-4 text-sm font-semibold text-white hover:bg-[#cf5b3a]'>
            Back to marketplace
          </Link>
        </div>
      </main>
    );
  }

  const savedListingIds = user ? await getSavedListingIds(user.id) : [];
  const relatedListings = (await getListings())
    .filter(
      (item) => item.category === listing.category && item.id !== listing.id,
    )
    .slice(0, 3);

  return (
    <main className='mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8'>
      <Link
        href='/#listings'
        className='mb-6 inline-flex min-h-10 items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-[#d45b39]'
      >
        <ArrowLeft className='size-4' aria-hidden='true' />
        Back to browse
      </Link>

      <div className='grid items-start gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)] lg:gap-12'>
        <section className='grid min-w-0 gap-3' aria-label='Listing photos'>
          {listing.images.length ? (
            <>
              <div className='aspect-[4/5] overflow-hidden rounded-xl border border-slate-200 bg-slate-100'>
                <img
                  src={listing.images[0]}
                  alt={listing.title}
                  className='h-full w-full object-cover'
                />
              </div>
              {listing.images.length > 1 ? (
                <div className='grid grid-cols-3 gap-3 sm:grid-cols-4'>
                  {listing.images.slice(1, 5).map((image, index) => (
                    <div key={image} className='aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-100'>
                      <img
                        src={image}
                        alt={`${listing.title}, photo ${index + 2}`}
                        className='h-full w-full object-cover'
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <div className='grid aspect-[4/5] place-items-center rounded-xl border border-slate-200 bg-slate-100 text-sm text-slate-500'>
              No photos available
            </div>
          )}
        </section>

        <section className='grid min-w-0 gap-5'>
          <div className='flex flex-wrap items-center gap-2'>
            <span className='rounded-md bg-[#f7e7e1] px-2.5 py-1 text-xs font-semibold text-[#b94e30]'>
              {listing.category}
            </span>
            <span className='rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600'>
              {listing.condition}
            </span>
            <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${listing.status === 'Available' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
              {listing.status}
            </span>
          </div>

          <div className='flex items-start justify-between gap-4'>
            <h1 className='min-w-0 text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl'>
              {listing.title}
            </h1>
            <div className='shrink-0 rounded-lg bg-slate-50 px-3 py-2 text-right'>
              {listing.tradeMode === 'Swap' ? (
                <span className='text-base font-semibold text-slate-900'>Swap</span>
              ) : (
                <span className='text-xl font-semibold text-slate-900'>${listing.price}</span>
              )}
              {listing.tradeMode === 'Sell or swap' ? (
                <span className='mt-0.5 block text-xs text-slate-500'>or swap</span>
              ) : null}
            </div>
          </div>

          <p className='whitespace-pre-line text-base leading-7 text-slate-600'>
            {listing.description || 'No description provided.'}
          </p>

          {listing.tradeMode !== 'Sell' && listing.swapWanted ? (
            <div className='rounded-lg border border-[#f1c7b9] bg-[#fdf3ef] p-4'>
              <p className='text-xs font-semibold uppercase text-[#b94e30]'>Looking to swap for</p>
              <p className='mt-1 text-sm text-slate-700'>{listing.swapWanted}</p>
            </div>
          ) : null}

          <div className='grid gap-3 rounded-xl border border-slate-200 bg-white p-4'>
            <p className='flex min-w-0 items-center gap-3 text-sm text-slate-700'>
              <UserRound className='size-4 shrink-0 text-[#e36b48]' aria-hidden='true' />
              <span className='min-w-0 truncate'>Listed by <strong className='font-semibold'>{listing.seller.name}</strong></span>
            </p>
            <p className='flex min-w-0 items-center gap-3 text-sm text-slate-700'>
              <MapPin className='size-4 shrink-0 text-[#e36b48]' aria-hidden='true' />
              <span className='truncate'>{listing.location}</span>
            </p>
          </div>

          <div className='flex flex-wrap items-center gap-3'>
            <SavedListingButton
              listingId={listing.id}
              initiallySaved={savedListingIds.includes(listing.id)}
              authenticated={Boolean(user)}
            />
            {user?.id !== listing.seller.id ? (
              user ? (
                <MessageSeller
                  sellerId={listing.seller.id}
                  sellerName={listing.seller.name}
                />
              ) : (
                <Link href='/auth' className='inline-flex h-10 items-center gap-2 rounded-lg bg-[#e36b48] px-4 text-sm font-semibold text-white hover:bg-[#cf5b3a]'>
                  <MessageCircle className='size-4' aria-hidden='true' />
                  Sign in to message seller
                </Link>
              )
            ) : null}
          </div>

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
        </section>
      </div>

      <ListingMap
        latitude={listing.latitude}
        longitude={listing.longitude}
        location={listing.location}
      />

      {relatedListings.length ? (
        <section className='mt-16 border-t border-slate-200 pt-8 sm:mt-20'>
          <div className='mb-5 flex items-end justify-between gap-4'>
            <div>
              <p className='text-sm font-medium text-[#d45b39]'>{listing.category}</p>
              <h2 className='mt-1 text-2xl font-semibold text-slate-900'>You might also like</h2>
            </div>
            <Link href={`/?category=${encodeURIComponent(listing.category)}#listings`} className='shrink-0 text-sm font-semibold text-[#d45b39] hover:text-[#b94e30]'>
              Browse all
            </Link>
          </div>
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {relatedListings.map((item) => (
              <Link
                key={item.id}
                href={`/listings/${item.id}`}
                className='group overflow-hidden rounded-lg border border-slate-200 bg-white transition-shadow hover:shadow-md'
              >
                <div className='aspect-[4/3] overflow-hidden bg-slate-100'>
                  {item.images[0] ? (
                    <img src={item.images[0]} alt={item.title} className='h-full w-full object-cover transition-transform group-hover:scale-[1.03]' />
                  ) : null}
                </div>
                <div className='flex items-start justify-between gap-3 p-4'>
                  <span className='line-clamp-2 min-w-0 text-sm font-semibold text-slate-900 group-hover:text-[#d45b39]'>{item.title}</span>
                  <span className='shrink-0 text-sm font-semibold text-slate-900'>
                    {item.tradeMode === 'Swap' ? 'Swap' : `$${item.price}`}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
