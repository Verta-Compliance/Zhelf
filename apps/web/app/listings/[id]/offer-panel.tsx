'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { Button } from '@fluentui/react-button';
import type { Listing, OfferType } from '@zhelf/shared';
import api from '../../../src/api';

export default function OfferPanel({
  listing,
  currentUserId,
  swapListings,
}: {
  listing: Listing;
  currentUserId: string | null;
  swapListings: Listing[];
}) {
  const canPurchase = listing.tradeMode !== 'Swap';
  const canSwap = listing.tradeMode !== 'Sell';
  const [offerType, setOfferType] = useState<OfferType>(
    canPurchase ? 'Purchase' : 'Swap',
  );
  const [amount, setAmount] = useState(String(listing.price || ''));
  const [swapListingId, setSwapListingId] = useState(swapListings[0]?.id ?? '');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (currentUserId === listing.seller.id) {
    return (
      <div className='offer-panel'>
        <p>This is your listing.</p>
        <Link
          href='/offers'
          className='view-link'
        >
          Review incoming offers
        </Link>
      </div>
    );
  }

  if (!currentUserId) {
    return (
      <div className='offer-panel'>
        <Link
          href='/auth'
          className='secondary-btn'
        >
          Sign in to make an offer
        </Link>
      </div>
    );
  }

  if (listing.status !== 'Available') {
    return (
      <p className='muted'>This listing is no longer available for offers.</p>
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setFeedback(null);
    setError(null);

    try {
      await api.createMarketplaceOffer({
        listingId: listing.id,
        offerType,
        amount: offerType === 'Purchase' ? Number(amount) : null,
        swapListingId: offerType === 'Swap' ? swapListingId : null,
        message: message.trim(),
      });
      setFeedback('Offer sent. You can follow its status from Offers.');
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to send offer.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      className='form-panel offer-panel'
      onSubmit={submit}
    >
      <h2>Make an offer</h2>
      <div
        className='listing-actions'
        role='group'
        aria-label='Offer type'
      >
        {canPurchase ? (
          <Button
            type='button'
            appearance={offerType === 'Purchase' ? 'primary' : 'secondary'}
            onClick={() => setOfferType('Purchase')}
          >
            Purchase
          </Button>
        ) : null}
        {canSwap ? (
          <Button
            type='button'
            appearance={offerType === 'Swap' ? 'primary' : 'secondary'}
            onClick={() => setOfferType('Swap')}
            disabled={swapListings.length === 0}
          >
            Swap
          </Button>
        ) : null}
      </div>

      {offerType === 'Purchase' ? (
        <label>
          <span>Your offer</span>
          <input
            type='number'
            min='0.01'
            step='0.01'
            value={amount}
            required
            onChange={(event) => setAmount(event.target.value)}
          />
        </label>
      ) : swapListings.length ? (
        <label>
          <span>Your item to swap</span>
          <select
            value={swapListingId}
            onChange={(event) => setSwapListingId(event.target.value)}
            required
          >
            {swapListings.map((item) => (
              <option
                key={item.id}
                value={item.id}
              >
                {item.title}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <p className='muted'>
          You need an available listing marked Swap or Sell or swap to make a
          swap offer.
        </p>
      )}

      <label>
        <span>Message (optional)</span>
        <textarea
          value={message}
          maxLength={2000}
          onChange={(event) => setMessage(event.target.value)}
        />
      </label>

      {error ? (
        <p
          role='alert'
          className='status-banner error'
        >
          {error}
        </p>
      ) : null}
      {feedback ? (
        <p
          role='status'
          className='status-banner success'
        >
          {feedback}
        </p>
      ) : null}
      {!feedback ? (
        <Button
          appearance='primary'
          type='submit'
          disabled={busy || (offerType === 'Swap' && !swapListingId)}
        >
          {busy ? 'Sending...' : 'Send offer'}
        </Button>
      ) : null}
    </form>
  );
}
