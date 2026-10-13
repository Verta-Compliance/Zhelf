import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Text, Title2, Title3 } from '@fluentui/react-text';
import { createSupabaseServerClient } from '../../src/lib/supabase/server';
import { getMarketplaceOffers } from '../../src/server/database';
import OfferActions from './offer-actions';

export const dynamic = 'force-dynamic';

export default async function OffersPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth');

  const offers = await getMarketplaceOffers(user.id);
  const incoming = offers.filter((offer) => offer.sellerId === user.id);
  const outgoing = offers.filter((offer) => offer.buyerId === user.id);

  return (
    <main className='container'>
      <div className='section-heading'>
        <Title2 as='h1'>Offers</Title2>
        <Text className='muted'>
          Purchase and swap offers for your listings.
        </Text>
      </div>

      <section className='offers-section'>
        <Title3 as='h2'>Incoming</Title3>
        {incoming.length ? (
          incoming.map((offer) => (
            <article
              className='offer-card'
              key={offer.id}
            >
              <div>
                <Text weight='semibold'>
                  {offer.buyerName} · {offer.offerType}
                </Text>
                <p>
                  <Link
                    href={`/listings/${offer.listingId}`}
                    className='view-link'
                  >
                    {offer.listingTitle}
                  </Link>
                </p>
                <Text className='muted'>
                  {offer.offerType === 'Purchase'
                    ? `Offer: $${offer.amount}`
                    : `Swap for: ${offer.swapListingTitle ?? 'item unavailable'}`}
                </Text>
                {offer.message ? <p>{offer.message}</p> : null}
                <span className='status-badge'>{offer.status}</span>
              </div>
              <OfferActions
                offer={offer}
                currentUserId={user.id}
              />
            </article>
          ))
        ) : (
          <p className='muted'>No incoming offers yet.</p>
        )}
      </section>

      <section className='offers-section'>
        <Title3 as='h2'>Sent</Title3>
        {outgoing.length ? (
          outgoing.map((offer) => (
            <article
              className='offer-card'
              key={offer.id}
            >
              <div>
                <Text weight='semibold'>
                  {offer.offerType} offer to {offer.sellerName}
                </Text>
                <p>
                  <Link
                    href={`/listings/${offer.listingId}`}
                    className='view-link'
                  >
                    {offer.listingTitle}
                  </Link>
                </p>
                <Text className='muted'>
                  {offer.offerType === 'Purchase'
                    ? `Offer: $${offer.amount}`
                    : `Swap: ${offer.swapListingTitle ?? 'item unavailable'}`}
                </Text>
                {offer.message ? <p>{offer.message}</p> : null}
                <span className='status-badge'>{offer.status}</span>
              </div>
              <OfferActions
                offer={offer}
                currentUserId={user.id}
              />
            </article>
          ))
        ) : (
          <p className='muted'>You have not sent any offers.</p>
        )}
      </section>
    </main>
  );
}
