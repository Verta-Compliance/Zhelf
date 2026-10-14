'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button } from '@fluentui/react-button';
import type { MarketplaceTransaction } from '@zhelf/shared';
import api from '../../src/api';

export default function TransactionActions({
  transaction,
  currentUserId,
}: {
  transaction: MarketplaceTransaction;
  currentUserId: string;
}) {
  const router = useRouter();
  const [rating, setRating] = useState('5');
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const revieweeName =
    transaction.buyerId === currentUserId
      ? transaction.sellerName
      : transaction.buyerName;

  async function complete() {
    setBusy(true);
    setError(null);
    try {
      await api.completeMarketplaceTransaction(transaction.id);
      router.refresh();
    } catch (completeError) {
      setError(
        completeError instanceof Error
          ? completeError.message
          : 'Unable to complete transaction.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.createMarketplaceReview({
        transactionId: transaction.id,
        rating: Number(rating),
        comment,
      });
      router.refresh();
    } catch (reviewError) {
      setError(
        reviewError instanceof Error
          ? reviewError.message
          : 'Unable to submit review.',
      );
    } finally {
      setBusy(false);
    }
  }

  if (transaction.status === 'Pending') {
    return (
      <div>
        <Button
          appearance='primary'
          onClick={complete}
          disabled={busy}
        >
          {busy ? 'Updating...' : 'Mark transaction complete'}
        </Button>
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

  if (transaction.status !== 'Completed') return null;
  if (transaction.reviewedByMe)
    return <p className='muted'>You reviewed this transaction.</p>;

  return (
    <form
      className='review-form'
      onSubmit={submitReview}
    >
      <label>
        <span>Rate {revieweeName}</span>
        <select
          value={rating}
          onChange={(event) => setRating(event.target.value)}
        >
          <option value='5'>5 · Excellent</option>
          <option value='4'>4 · Good</option>
          <option value='3'>3 · Okay</option>
          <option value='2'>2 · Poor</option>
          <option value='1'>1 · Bad</option>
        </select>
      </label>
      <label>
        <span>Review</span>
        <textarea
          maxLength={2000}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
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
      <Button
        appearance='secondary'
        type='submit'
        disabled={busy}
      >
        {busy ? 'Submitting...' : 'Submit review'}
      </Button>
    </form>
  );
}
