'use client';

import { useState } from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
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
    <span className='relative inline-flex'>
      <button
        type='button'
        className='flex size-10 items-center justify-center rounded-full border border-white/80 bg-white/95 text-slate-700 shadow-sm transition-colors hover:bg-white hover:text-[#d45b39] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e36b48] disabled:cursor-wait disabled:opacity-60'
        aria-label={label}
        aria-pressed={saved}
        title={label}
        disabled={busy}
        onClick={toggleSaved}
      >
        {saved ? (
          <BookmarkCheck className='size-5 text-[#d45b39]' aria-hidden='true' />
        ) : (
          <Bookmark className='size-5' aria-hidden='true' />
        )}
      </button>
      {error ? (
        <span
          role='alert'
          className='absolute right-0 top-full z-30 mt-2 w-max max-w-60 rounded-md border border-red-200 bg-white p-2 text-xs text-red-700 shadow-lg'
        >
          {error}
        </span>
      ) : null}
    </span>
  );
}
