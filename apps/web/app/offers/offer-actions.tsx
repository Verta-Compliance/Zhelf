'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@fluentui/react-button';
import type { MarketplaceOffer } from '@zhelf/shared';
import api from '../../src/api';

export default function OfferActions({
  offer,
  currentUserId,
}: {
  offer: MarketplaceOffer;
  currentUserId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSeller = offer.sellerId === currentUserId;

  async function act(action: 'Accept' | 'Decline' | 'Withdraw') {
    setBusy(true);
    setError(null);
    try {
      const result = await api.updateMarketplaceOffer(offer.id, action);
      if (result.transactionId) {
        router.push('/transactions');
      } else {
        router.refresh();
      }
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : 'Unable to update offer.',
      );
      setBusy(false);
    }
  }

  if (offer.status !== 'Pending') {
    return offer.transactionId ? (
      <Link
        href='/transactions'
        className='view-link'
      >
        View transaction
      </Link>
    ) : null;
  }

  return (
    <div>
      <div className='listing-actions'>
        {isSeller ? (
          <>
            <Button
              appearance='primary'
              onClick={() => act('Accept')}
              disabled={busy}
            >
              {busy ? 'Updating...' : 'Accept'}
            </Button>
            <Button
              appearance='secondary'
              onClick={() => act('Decline')}
              disabled={busy}
            >
              Decline
            </Button>
          </>
        ) : (
          <Button
            appearance='secondary'
            onClick={() => act('Withdraw')}
            disabled={busy}
          >
            Withdraw offer
          </Button>
        )}
      </div>
      {error ? (
        <p
          role='alert'
          className='status-banner error'
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
