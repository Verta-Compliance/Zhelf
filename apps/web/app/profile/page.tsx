import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Badge } from '@fluentui/react-badge';
import { Text, Title2, Title3 } from '@fluentui/react-text';
import SavedListingButton from '../../components/saved-listing-button';
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

  return (
    <main className='container'>
      <div className='profile-header'>
        <div>
          <Badge appearance='tint'>Profile</Badge>
          <Title2
            as='h1'
            style={{ marginTop: '0.75rem' }}
          >
            {user.name}
          </Title2>
          <Text className='muted'>{session.user.email}</Text>
        </div>
        <Link
          href='/sell'
          className='secondary-btn'
        >
          Sell an item
        </Link>
      </div>

      <section className='profile-grid'>
        <div className='profile-card'>
          <img
            src={
              user.avatar ||
              'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80'
            }
            alt={user.name}
            className='profile-avatar'
          />

          <div className='profile-meta'>
            <Text weight='semibold'>{user.location || 'Location not set'}</Text>
            <Text className='muted'>{user.rating.toFixed(1)} rating</Text>
          </div>

          <Text style={{ marginTop: '1rem' }}>
            {user.bio || 'This seller hasn’t added a bio yet.'}
          </Text>

          <div className='profile-stats'>
            <div className='profile-stat'>
              <strong>{listings.length}</strong>
              <span>Listings</span>
            </div>
            <div className='profile-stat'>
              <strong>{user.rating.toFixed(1)}</strong>
              <span>Rating</span>
            </div>
          </div>
        </div>

        <div className='profile-card'>
          <Title3 as='h2'>My listings</Title3>

          {listings.length === 0 ? (
            <Text
              className='muted'
              style={{ display: 'block', marginTop: '0.75rem' }}
            >
              You have not published any items yet.
            </Text>
          ) : (
            <div className='profile-list'>
              {listings.map((listing) => (
                <Link
                  href={`/listings/${listing.id}`}
                  key={listing.id}
                  className='profile-list-item'
                >
                  <img
                    src={
                      listing.images[0] ||
                      'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=400&q=80'
                    }
                    alt={listing.title}
                  />
                  <div>
                    <Text weight='semibold'>{listing.title}</Text>
                    <Text
                      className='muted'
                      style={{ display: 'block' }}
                    >
                      {listing.condition} · ${listing.price}
                    </Text>
                    <span className='status-badge'>{listing.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className='profile-saved-listings'>
        <Title3 as='h2'>Saved listings</Title3>
        {savedListings.length === 0 ? (
          <Text className='muted'>You have not saved any listings yet.</Text>
        ) : (
          <div className='saved-list'>
            {savedListings.map((listing) => (
              <article
                className='saved-list-item'
                key={listing.id}
              >
                <Link
                  href={`/listings/${listing.id}`}
                  className='saved-list-link'
                >
                  <img
                    src={
                      listing.images[0] ||
                      'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=400&q=80'
                    }
                    alt={listing.title}
                  />
                  <span>
                    <Text weight='semibold'>{listing.title}</Text>
                    <Text className='muted'>
                      {listing.tradeMode === 'Swap'
                        ? 'Swap'
                        : `$${listing.price}`}
                      {' · '}
                      {listing.condition} · {listing.location}
                    </Text>
                  </span>
                </Link>
                <SavedListingButton
                  listingId={listing.id}
                  initiallySaved
                  authenticated
                />
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
