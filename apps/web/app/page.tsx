import Link from 'next/link';
import Image from 'next/image';
import { Search } from 'lucide-react';
import { Text, Title3 } from '@fluentui/react-text';
import type { ListingCategory } from '@zhelf/shared';
import { isListingCategory } from '../src/categories';
import { createSupabaseServerClient } from '../src/lib/supabase/server';
import { isModerator } from '../src/lib/supabase/moderation';
import { getListings, getSavedListingIds } from '../src/server/database';
import SavedListingButton from '../components/saved-listing-button';
import ListingBrowser from '../components/listing-browser';

export const dynamic = 'force-dynamic';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const filters = await searchParams;
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const listings = await getListings();
  const savedListingIds = session
    ? await getSavedListingIds(session.user.id)
    : [];
  const initialCategory: 'All categories' | ListingCategory =
    isListingCategory(filters.category)
      ? filters.category
      : 'All categories';

  return (
    <main>
      <section className='relative isolate flex min-h-[78svh] items-center justify-center overflow-hidden bg-slate-950 text-center'>
        <Image
          src='https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1920&q=85'
          alt='A collection of books ready to be discovered and shared'
          fill
          priority
          sizes='100vw'
          className='absolute inset-0 -z-10 object-cover object-center'
        />
        <div className='absolute inset-0 z-0 bg-slate-950/60' aria-hidden='true' />
        <div className='relative z-10 mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8'>
          <h1 className='animate-fade-up mx-auto mb-6 max-w-4xl text-4xl font-semibold text-white sm:text-5xl md:text-6xl lg:text-7xl'>
            Share More,<br />Own Less.
          </h1>
          <p
            className='animate-fade-up mx-auto mb-10 max-w-2xl text-lg text-white/85 sm:text-xl'
            style={{ animationDelay: '0.1s' }}
          >
            Discover books, clothes, and more from your community. Buy, swap,
            and pass along the things you no longer need.
          </p>
          <form
            action='/#listings'
            method='get'
            className='animate-fade-up mx-auto flex w-full max-w-2xl flex-col items-stretch gap-3 sm:flex-row'
            style={{ animationDelay: '0.2s' }}
          >
            <label className='relative min-w-0 flex-1'>
              <span className='sr-only'>Search listings</span>
              <Search className='absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-500' aria-hidden='true' />
              <input
                name='q'
                type='search'
                placeholder='Search for books or clothes...'
                className='h-12 w-full rounded-lg border border-white/30 bg-white/95 pl-12 pr-4 text-left text-slate-900 placeholder:text-slate-500 outline-none backdrop-blur-sm focus:ring-2 focus:ring-white/70'
              />
            </label>
            <button
              type='submit'
              className='h-12 w-full rounded-lg bg-[#e36b48] px-8 text-sm font-semibold text-white transition-colors hover:bg-[#cf5b3a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto'
            >
              Explore
            </button>
          </form>
        </div>
      </section>

      <section id='listings' className='mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8'>
        <div className='section-heading'>
          <Title3 as='h2'>Fresh arrivals</Title3>
          <Text className='muted'>Curated for your local community</Text>
        </div>

        <ListingBrowser
          listings={listings}
          savedListingIds={savedListingIds}
          authenticated={Boolean(session)}
          initialSearch={filters.q ?? ''}
          initialCategory={initialCategory}
        />
      </section>
    </main>
  );
}
