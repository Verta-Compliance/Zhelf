'use client';

import { useState } from 'react';
import { BookmarkFilled, BookmarkRegular } from '@fluentui/react-icons';
import { Button } from '@fluentui/react-button';
import { useRouter } from 'next/navigation';
import api from '../src/api';

export default function SavedListingButton({
  listingId,
  initiallySaved,
  authenticated,
}: {
  listingId: string;
  initiallySaved: boolean;
  authenticated: boolean;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initiallySaved);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const label = saved ? 'Remove from saved listings' : 'Save listing';

  async function toggleSaved() {
    if (!authenticated) {
      router.push('/auth');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      if (saved) {
        await api.unsaveListing(listingId);
      } else {
        await api.saveListing(listingId);
      }
      setSaved(!saved);
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Unable to update saved listings.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className='save-listing-control'>
      <Button
        appearance='subtle'
        icon={saved ? <BookmarkFilled /> : <BookmarkRegular />}
        aria-label={label}
        aria-pressed={saved}
        title={label}
        disabled={busy}
        onClick={toggleSaved}
      />
      {error ? (
        <span
          role='alert'
          className='save-listing-error'
        >
          {error}
        </span>
      ) : null}
    </span>
  );
}
