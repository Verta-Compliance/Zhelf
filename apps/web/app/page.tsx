import Link from 'next/link';
import { Badge } from '@fluentui/react-badge';
import { Button } from '@fluentui/react-button';
import { Text, Title2, Title3 } from '@fluentui/react-text';
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
    <main className='container'>
      <section className='hero'>
        <div>
          <Badge appearance='tint'>Community finds</Badge>
          <Title2
            as='h1'
            style={{ marginTop: '0.75rem' }}
          >
            Discover books and favorites from your neighbors.
          </Title2>
          <Text
            size={400}
            className='muted'
            style={{ display: 'block', marginTop: '0.5rem' }}
          >
            Browse local listings, message sellers, and save the pieces you want
            to keep.
          </Text>
        </div>
        <div className='hero-actions'>
          <Link href='#listings' className='primary-link'>Explore listings</Link>
          <Link
            href='/sell'
            className='secondary-btn'
          >
            List an item
          </Link>
        </div>
      </section>

      <section id='listings'>
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
