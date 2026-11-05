import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  ArrowUpRight,
  Bookmark,
  ListPlus,
  LogOut,
  MapPin,
  MessageCircle,
  Package,
  Star,
  UserRound,
} from 'lucide-react';
import SavedListingButton from '../../components/saved-listing-button';
import { signOutAction } from '../../src/lib/supabase/actions';
import { createSupabaseServerClient } from '../../src/lib/supabase/server';
import {
  ensureUserProfile,
  getSavedListings,
  getUser,
  getUserListings,
} from '../../src/server/database';

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth');
  }

  await ensureUserProfile({
    id: session.user.id,
    email: session.user.email,
    name:
      typeof session.user.user_metadata.full_name === 'string'
        ? session.user.user_metadata.full_name
        : null,
  });

  const [user, listings, savedListings] = await Promise.all([
    getUser(session.user.id),
    getUserListings(session.user.id),
    getSavedListings(session.user.id),
  ]);

  if (!user) {
    redirect('/auth');
  }

  const memberSince = new Date(session.user.created_at).toLocaleDateString(
    'en-GB',
    { month: 'long', year: 'numeric' },
  );

  return (
    <main className='mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-12 lg:px-8 lg:py-12'>
      <aside className='min-w-0 border-b border-slate-200 pb-6 lg:sticky lg:top-36 lg:self-start lg:border-b-0 lg:border-r lg:pb-0 lg:pr-8'>
        <div className='flex items-center gap-3'>
          {user.avatar ? (
            <img src={user.avatar} alt='' className='size-14 rounded-full object-cover' />
          ) : (
            <span className='grid size-14 shrink-0 place-items-center rounded-full bg-[#f7e7e1] text-xl font-semibold text-[#c95535]' aria-hidden='true'>
              {user.name.slice(0, 1).toUpperCase()}
            </span>
          )}
          <div className='min-w-0'>
            <h2 className='truncate text-base font-semibold text-slate-900'>{user.name}</h2>
            <p className='truncate text-sm text-slate-500'>{session.user.email}</p>
          </div>
        </div>

        <div className='mt-5 grid grid-cols-3 divide-x divide-slate-200 border-y border-slate-200 py-4 text-center'>
          <div className='px-1'>
            <strong className='block text-lg font-semibold text-slate-900'>{listings.length}</strong>
            <span className='text-xs text-slate-500'>Listings</span>
          </div>
          <div className='px-1'>
            <strong className='block text-lg font-semibold text-slate-900'>{savedListings.length}</strong>
            <span className='text-xs text-slate-500'>Saved</span>
          </div>
          <div className='px-1'>
            <strong className='inline-flex items-center gap-1 text-lg font-semibold text-slate-900'>
              {user.rating.toFixed(1)}
              <Star className='size-3.5 fill-[#e36b48] text-[#e36b48]' aria-hidden='true' />
            </strong>
            <span className='block text-xs text-slate-500'>Rating</span>
          </div>
        </div>

        <nav className='mt-5 grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-1' aria-label='Account navigation'>
          <a href='#account' className='flex min-h-10 items-center gap-2 rounded-lg bg-[#f7e7e1] px-3 text-sm font-semibold text-[#b94e30]'>
            <UserRound className='size-4' aria-hidden='true' /> Account overview
          </a>
          <a href='#my-listings' className='flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900'>
            <ListPlus className='size-4' aria-hidden='true' /> My listings
          </a>
          <a href='#saved-listings' className='flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900'>
            <Bookmark className='size-4' aria-hidden='true' /> Saved listings
          </a>
          <Link href='/offers' className='flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900'>
            <Package className='size-4' aria-hidden='true' /> Offers
          </Link>
          <Link href='/messages' className='flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900'>
            <MessageCircle className='size-4' aria-hidden='true' /> Messages
          </Link>
          <Link href='/transactions' className='flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900'>
            <ArrowUpRight className='size-4' aria-hidden='true' /> Transactions
          </Link>
        </nav>

        <p className='mt-5 flex items-center gap-2 text-xs text-slate-500'>
          <MapPin className='size-3.5' aria-hidden='true' />
          {user.location || 'Location not set'}
          <span className='mx-1' aria-hidden='true'>·</span>
          Member since {memberSince}
        </p>

        <form action={signOutAction} className='mt-5 border-t border-slate-200 pt-4'>
          <button type='submit' className='inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900'>
            <LogOut className='size-4' aria-hidden='true' /> Sign out
          </button>
        </form>
      </aside>

      <div id='account' className='min-w-0'>
        <header className='mb-8 flex flex-col gap-5 border-b border-slate-200 pb-7 sm:flex-row sm:items-end sm:justify-between'>
          <div className='min-w-0'>
            <p className='mb-3 text-sm font-semibold uppercase text-[#c95535]'>Your community account</p>
            <h1 className='max-w-3xl text-4xl font-semibold uppercase leading-[0.95] text-slate-900 sm:text-5xl lg:text-6xl'>
              Account &<br className='hidden sm:block' /> marketplace
            </h1>
            <p className='mt-4 max-w-xl text-sm leading-6 text-slate-600 sm:text-base'>
              Manage the items you share, the listings you save, and your marketplace activity.
            </p>
          </div>
          <Link href='/sell' className='inline-flex min-h-11 shrink-0 items-center justify-center gap-2 self-start rounded-lg bg-[#e36b48] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#cf5b3a] sm:self-auto'>
            <ListPlus className='size-4' aria-hidden='true' /> List an item
          </Link>
        </header>

        <section id='my-listings' className='scroll-mt-32 border-b border-slate-200 pb-8'>
          <div className='mb-5 flex flex-wrap items-end justify-between gap-3'>
            <div>
              <p className='text-sm font-medium text-slate-500'>Your activity</p>
              <h2 className='mt-1 text-2xl font-semibold text-slate-900'>My listings</h2>
            </div>
            <Link href='/sell' className='inline-flex items-center gap-1 text-sm font-semibold text-[#c95535] hover:text-[#a94024]'>
              Add a listing <ArrowUpRight className='size-4' aria-hidden='true' />
            </Link>
          </div>

          {listings.length === 0 ? (
            <div className='border-t border-slate-200 py-6'>
              <p className='text-sm text-slate-600'>You haven’t published an item yet.</p>
              <Link href='/sell' className='mt-3 inline-flex text-sm font-semibold text-[#c95535] hover:text-[#a94024]'>Create your first listing</Link>
            </div>
          ) : (
            <div className='divide-y divide-slate-200'>
              {listings.map((listing) => (
                <Link key={listing.id} href={`/listings/${listing.id}`} className='flex min-w-0 items-center gap-3 py-4 sm:gap-4'>
                  {listing.images[0] ? (
                    <img src={listing.images[0]} alt='' className='size-16 shrink-0 rounded-md object-cover sm:size-20' />
                  ) : (
                    <span className='grid size-16 shrink-0 place-items-center rounded-md bg-slate-100 text-slate-400 sm:size-20'><Package className='size-5' aria-hidden='true' /></span>
                  )}
                  <span className='min-w-0 flex-1'>
                    <span className='block truncate text-sm font-semibold text-slate-900'>{listing.title}</span>
                    <span className='mt-1 block truncate text-sm text-slate-500'>
                      {listing.condition} · {listing.category} · {listing.location}
                    </span>
                  </span>
                  <span className='shrink-0 text-right'>
                    <span className='block text-sm font-semibold text-slate-900'>
                      {listing.tradeMode === 'Swap' ? 'Swap' : `$${listing.price}`}
                    </span>
                    <span className='mt-1 block text-xs text-slate-500'>{listing.status}</span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section id='saved-listings' className='scroll-mt-32 pt-8'>
          <div className='mb-5'>
            <p className='text-sm font-medium text-slate-500'>Kept for later</p>
            <h2 className='mt-1 text-2xl font-semibold text-slate-900'>Saved listings</h2>
          </div>
          {savedListings.length === 0 ? (
            <p className='border-t border-slate-200 py-6 text-sm text-slate-600'>You haven’t saved any listings yet.</p>
          ) : (
            <div className='divide-y divide-slate-200'>
              {savedListings.map((listing) => (
                <article key={listing.id} className='flex min-w-0 items-center gap-3 py-4 sm:gap-4'>
                  <Link href={`/listings/${listing.id}`} className='flex min-w-0 flex-1 items-center gap-3 sm:gap-4'>
                    {listing.images[0] ? (
                      <img src={listing.images[0]} alt='' className='size-16 shrink-0 rounded-md object-cover sm:size-20' />
                    ) : (
                      <span className='grid size-16 shrink-0 place-items-center rounded-md bg-slate-100 text-slate-400 sm:size-20'><Package className='size-5' aria-hidden='true' /></span>
                    )}
                    <span className='min-w-0'>
                      <span className='block truncate text-sm font-semibold text-slate-900'>{listing.title}</span>
                      <span className='mt-1 block truncate text-sm text-slate-500'>
                        {listing.tradeMode === 'Swap' ? 'Swap' : `$${listing.price}`} · {listing.condition} · {listing.location}
                      </span>
                    </span>
                  </Link>
                  <SavedListingButton listingId={listing.id} initiallySaved authenticated />
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
