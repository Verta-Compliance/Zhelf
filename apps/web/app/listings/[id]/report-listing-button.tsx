'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@fluentui/react-button';
import { FlagRegular } from '@fluentui/react-icons';
import type { ListingReportReason } from '@zhelf/shared';

const reasons: ListingReportReason[] = [
  'Spam',
  'Prohibited item',
  'Fraud or scam',
  'Harassment',
  'Other',
];

export default function ReportListingButton({
  listingId,
  authenticated,
}: {
  listingId: string;
  authenticated: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ListingReportReason>('Spam');
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submitReport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!authenticated) {
      router.push('/auth');
      return;
    }

    setBusy(true);
    setError(null);
    setFeedback(null);
    try {
      const response = await fetch(
        `/api/listings/${encodeURIComponent(listingId)}/reports`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason, details }),
        },
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error?.message ?? 'Unable to submit report.');
      }
      setFeedback('Report sent to the moderation team.');
      setDetails('');
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to submit report.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className='report-listing'>
      <Button
        appearance='transparent'
        icon={<FlagRegular />}
        aria-label='Report listing'
        title='Report listing'
        onClick={() => setOpen((value) => !value)}
      >
        Report listing
      </Button>
      {open ? (
        <form
          className='report-form'
          onSubmit={submitReport}
        >
          <label>
            <span>Reason</span>
            <select
              value={reason}
              onChange={(event) =>
                setReason(event.target.value as ListingReportReason)
              }
            >
              {reasons.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Details (optional)</span>
            <textarea
              value={details}
              maxLength={2000}
              onChange={(event) => setDetails(event.target.value)}
              placeholder='Add context to help us review this listing.'
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
            <div className='listing-actions'>
              <Button
                appearance='primary'
                type='submit'
                disabled={busy}
              >
                {busy ? 'Sending...' : 'Submit report'}
              </Button>
              <Button
                appearance='secondary'
                type='button'
                onClick={() => setOpen(false)}
                disabled={busy}
              >
                Cancel
              </Button>
            </div>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}
