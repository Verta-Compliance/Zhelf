'use client';

import { Button } from '@fluentui/react-button';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import type {
  Listing,
  ListingCategory,
  ListingCondition,
  ListingCreateInput,
  ListingTradeMode,
} from '@zhelf/shared';
import api from '../../../src/api';

export default function ListingOwnerActions({ listing }: { listing: Listing }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ListingCreateInput>({
    title: listing.title,
    price: listing.price,
    category: listing.category,
    condition: listing.condition,
    tradeMode: listing.tradeMode,
    swapWanted: listing.swapWanted,
    description: listing.description,
    images: listing.images,
    location: listing.location,
  });

  function updateField<Key extends keyof ListingCreateInput>(
    key: Key,
    value: ListingCreateInput[Key],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateTradeMode(tradeMode: ListingTradeMode) {
    setForm((current) => ({
      ...current,
      tradeMode,
      price: tradeMode === 'Swap' ? 0 : current.price,
    }));
  }

  async function saveListing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      await api.updateListing(listing.id, form);
      setEditing(false);
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Unable to save listing changes.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function removeListing() {
    if (!window.confirm('Delete this listing? This cannot be undone.')) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      await api.deleteListing(listing.id);
      router.replace('/profile');
      router.refresh();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Unable to delete listing.',
      );
      setBusy(false);
    }
  }

  if (!editing) {
    return (
      <div className='listing-actions listing-owner-actions'>
        <Button
          appearance='secondary'
          onClick={() => setEditing(true)}
          disabled={busy}
        >
          Edit listing
        </Button>
        <Button
          appearance='secondary'
          onClick={removeListing}
          disabled={busy}
        >
          {busy ? 'Deleting...' : 'Delete listing'}
        </Button>
        <Button
          appearance='transparent'
          onClick={() => router.push('/profile')}
          disabled={busy}
        >
          My listings
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

  return (
    <form
      className='owner-edit-form'
      onSubmit={saveListing}
    >
      <div className='form-grid'>
        <label>
          <span>Title</span>
          <input
            value={form.title}
            maxLength={160}
            required
            onChange={(event) => updateField('title', event.target.value)}
          />
        </label>
        <label>
          <span>
            {form.tradeMode === 'Swap' ? 'Price (not used for swaps)' : 'Price'}
          </span>
          <input
            type='number'
            value={form.price}
            min='0.01'
            step='0.01'
            required={form.tradeMode !== 'Swap'}
            disabled={form.tradeMode === 'Swap'}
            onChange={(event) =>
              updateField('price', Number(event.target.value))
            }
          />
        </label>
        <label>
          <span>Category</span>
          <select
            value={form.category}
            onChange={(event) =>
              updateField('category', event.target.value as ListingCategory)
            }
          >
            <option value='Books'>Books</option>
            <option value='Clothing'>Clothing</option>
          </select>
        </label>
        <label>
          <span>Condition</span>
          <select
            value={form.condition}
            onChange={(event) =>
              updateField('condition', event.target.value as ListingCondition)
            }
          >
            <option value='Like New'>Like New</option>
            <option value='Good'>Good</option>
            <option value='Acceptable'>Acceptable</option>
            <option value='Used'>Used</option>
          </select>
        </label>
        <label>
          <span>Listing type</span>
          <select
            value={form.tradeMode}
            onChange={(event) =>
              updateTradeMode(event.target.value as ListingTradeMode)
            }
          >
            <option value='Sell'>Sell</option>
            <option value='Swap'>Swap</option>
            <option value='Sell or swap'>Sell or swap</option>
          </select>
        </label>
      </div>

      {form.tradeMode !== 'Sell' ? (
        <label>
          <span>What would you swap for?</span>
          <textarea
            value={form.swapWanted}
            maxLength={500}
            required
            onChange={(event) => updateField('swapWanted', event.target.value)}
            placeholder='For example: another hardback novel or a small desk lamp'
          />
        </label>
      ) : null}

      <label>
        <span>Description</span>
        <textarea
          value={form.description}
          maxLength={4000}
          onChange={(event) => updateField('description', event.target.value)}
        />
      </label>
      <label>
        <span>Location</span>
        <input
          value={form.location}
          maxLength={160}
          required
          onChange={(event) => updateField('location', event.target.value)}
        />
      </label>
      <label>
        <span>Photo URLs, one per line</span>
        <textarea
          value={form.images.join('\n')}
          onChange={(event) =>
            updateField(
              'images',
              event.target.value
                .split(/[\n,]+/)
                .map((image) => image.trim())
                .filter(Boolean),
            )
          }
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
      <div className='listing-actions'>
        <Button
          appearance='primary'
          type='submit'
          disabled={busy}
        >
          {busy ? 'Saving...' : 'Save changes'}
        </Button>
        <Button
          appearance='secondary'
          type='button'
          onClick={() => setEditing(false)}
          disabled={busy}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
