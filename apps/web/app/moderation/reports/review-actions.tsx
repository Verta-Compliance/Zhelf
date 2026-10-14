'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@fluentui/react-button';

export default function ReportReviewActions({
  reportId,
}: {
  reportId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function review(status: 'Resolved' | 'Dismissed') {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/moderation/reports/${encodeURIComponent(reportId)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        },
      );
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error?.message ?? 'Unable to update report.');
      router.refresh();
    } catch (reviewError) {
      setError(
        reviewError instanceof Error
          ? reviewError.message
          : 'Unable to update report.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className='listing-actions'>
        <Button
          appearance='primary'
          onClick={() => review('Resolved')}
          disabled={busy}
        >
          Resolve
        </Button>
        <Button
          appearance='secondary'
          onClick={() => review('Dismissed')}
          disabled={busy}
        >
          Dismiss
        </Button>
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
