import Link from 'next/link';
import { Badge } from '@fluentui/react-badge';
import { Button } from '@fluentui/react-button';
import { Card } from '@fluentui/react-card';
import { Text, Title2, Title3 } from '@fluentui/react-text';
import { signOutAction } from '../src/lib/supabase/actions';
import { createSupabaseServerClient } from '../src/lib/supabase/server';
import { isModerator } from '../src/lib/supabase/moderation';
import { getListings, getSavedListingIds } from '../src/server/database';
import SavedListingButton from '../components/saved-listing-button';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const listings = await getListings();
  const savedListingIds = session
    ? await getSavedListingIds(session.user.id)
    : [];

  return (
    <main className='container'>
      <header className='topbar'>
        <div>
          <Text
            weight='semibold'
            size={400}
          >
            Zhelf
          </Text>
        </div>
        <nav
          className='nav'
          aria-label='Main navigation'
        >
          <Link href='/'>Marketplace</Link>
          <Link href='/sell'>Sell</Link>
          <Link href='/messages'>Messages</Link>
          {session ? (
            <>
              <Link href='/offers'>Offers</Link>
              <Link href='/transactions'>Transactions</Link>
              {isModerator(session.user) ? (
                <Link href='/moderation/reports'>Moderation</Link>
              ) : null}
              <span className='muted'>{session.user.email}</span>
              <form action={signOutAction}>
                <Button
                  type='submit'
                  appearance='secondary'
                >
                  Sign out
                </Button>
              </form>
            </>
          ) : (
            <Link href='/auth'>Sign in</Link>
          )}
        </nav>
      </header>

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
          <Button appearance='primary'>Explore listings</Button>
          <Link
            href='/sell'
            className='secondary-btn'
          >
            List an item
          </Link>
        </div>
      </section>

      <section>
        <div className='section-heading'>
          <Title3 as='h2'>Fresh arrivals</Title3>
          <Text className='muted'>Curated for your local community</Text>
        </div>

        <div className='card-list'>
          {listings.map((listing) => (
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
                  <Text weight='semibold'>${listing.price}</Text>
                </div>
                <Title3 as='h3'>{listing.title}</Title3>
                <Text className='muted'>
                  {listing.condition} · {listing.location}
                </Text>
                <div className='card-footer'>
                  <span className='status-badge'>{listing.status}</span>
                  <div className='card-actions'>
                    <SavedListingButton
                      listingId={listing.id}
                      initiallySaved={savedListingIds.includes(listing.id)}
                      authenticated={Boolean(session)}
                    />
                    <Link
                      href={`/listings/${listing.id}`}
                      className='view-link'
                    >
                      View details
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
