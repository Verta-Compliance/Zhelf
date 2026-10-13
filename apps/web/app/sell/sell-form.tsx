'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button } from '@fluentui/react-button';
import type { ListingTradeMode } from '@zhelf/shared';
import api from '../../src/api';
import {
  removeListingImages,
  uploadListingImages,
} from '../../src/lib/supabase/storage';

function parseImages(raw: string): string[] {
  return raw
    .split(/[\n,]+/)
    .map((image) => image.trim())
    .filter(Boolean);
}

export default function SellForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [tradeMode, setTradeMode] = useState<ListingTradeMode>('Sell');
  const [feedback, setFeedback] = useState<{
    type: 'info' | 'error' | 'success';
    message: string;
  }>({
    type: 'info',
    message: '',
  });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setFeedback({ type: 'info', message: '' });

    const data = new FormData(event.currentTarget);
    const title = String(data.get('title') ?? '').trim();
    const priceValue = data.get('price');
    const category = String(data.get('category') ?? 'Books') as
      | 'Books'
      | 'Clothing';
    const condition = String(data.get('condition') ?? 'Good') as
      | 'Like New'
      | 'Good'
      | 'Acceptable'
      | 'Used';
    const selectedTradeMode = String(
      data.get('tradeMode') ?? 'Sell',
    ) as ListingTradeMode;
    const price = selectedTradeMode === 'Swap' ? 0 : Number(priceValue);
    const swapWanted = String(data.get('swapWanted') ?? '').trim();
    const description = String(data.get('description') ?? '').trim();
    const location = String(data.get('location') ?? '').trim();
    const imageUrls = parseImages(String(data.get('images') ?? ''));
    const imageFiles = data
      .getAll('imageFiles')
      .filter(
        (value): value is File => value instanceof File && value.size > 0,
      );
    const needsPrice = selectedTradeMode !== 'Swap';
    const needsSwapDetails = selectedTradeMode !== 'Sell';

    if (
      !title ||
      !location ||
      imageUrls.length + imageFiles.length > 8 ||
      (needsPrice && (!Number.isFinite(price) || price <= 0)) ||
      (needsSwapDetails && !swapWanted)
    ) {
      setFeedback({
        type: 'error',
        message:
          'Add a title and location, a price for sales, and what you want to swap for when offering a swap.',
      });
      setBusy(false);
      return;
    }

    let uploadedPaths: string[] = [];
    try {
      const uploaded = await uploadListingImages(imageFiles);
      uploadedPaths = uploaded.paths;
      const result = await api.createListing({
        title,
        category,
        price,
        condition,
        tradeMode: selectedTradeMode,
        swapWanted,
        description,
        images: [...imageUrls, ...uploaded.urls],
        location,
      });

      setFeedback({
        type: 'success',
        message: `Published — taking you to your listing in a moment.`,
      });

      router.push(`/listings/${result.id}`);
    } catch (error) {
      if (uploadedPaths.length) {
        try {
          await removeListingImages(uploadedPaths);
        } catch {
          console.error(
            'Listing photos could not be cleaned up after a failed publish.',
          );
        }
      }

      setFeedback({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'The listing could not be published.',
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      className='form-panel'
      onSubmit={submit}
    >
      <div className='form-grid'>
        <label>
          <span>Title</span>
          <input
            name='title'
            required
            maxLength={160}
            placeholder='Vintage illustrated novel'
          />
        </label>
        <label>
          <span>Category</span>
          <select
            name='category'
            defaultValue='Books'
          >
            <option>Books</option>
            <option>Clothing</option>
          </select>
        </label>
        <label>
          <span>Listing type</span>
          <select
            name='tradeMode'
            value={tradeMode}
            onChange={(event) =>
              setTradeMode(event.target.value as ListingTradeMode)
            }
          >
            <option value='Sell'>Sell</option>
            <option value='Swap'>Swap</option>
            <option value='Sell or swap'>Sell or swap</option>
          </select>
        </label>
        <label>
          <span>
            {tradeMode === 'Swap' ? 'Price (not used for swaps)' : 'Price'}
          </span>
          <input
            name='price'
            type='number'
            min='0.01'
            step='0.01'
            required={tradeMode !== 'Swap'}
            disabled={tradeMode === 'Swap'}
            placeholder='42.50'
          />
        </label>
        <label>
          <span>Condition</span>
          <select
            name='condition'
            defaultValue='Good'
          >
            <option>Good</option>
            <option>Like New</option>
            <option>Acceptable</option>
            <option>Used</option>
          </select>
        </label>
      </div>

      {tradeMode !== 'Sell' ? (
        <label>
          <span>What would you swap for?</span>
          <textarea
            name='swapWanted'
            required
            maxLength={500}
            placeholder='For example: another hardback novel or a small desk lamp'
          />
        </label>
      ) : null}

      <label>
        <span>Description</span>
        <textarea
          name='description'
          maxLength={4000}
          placeholder='Tell neighbors what makes this item special.'
        />
      </label>

      <label>
        <span>Location</span>
        <input
          name='location'
          required
          maxLength={160}
          placeholder='Manchester'
        />
      </label>

      <label>
        <span>Upload photos (up to 8, 5 MB each)</span>
        <input
          name='imageFiles'
          type='file'
          accept='image/jpeg,image/png,image/webp,image/gif'
          multiple
        />
      </label>

      <label>
        <span>Or add photo URLs, one per line</span>
        <textarea
          name='images'
          placeholder='https://images.example.com/1.jpg'
        />
      </label>

      <div className='form-actions'>
        <Button
          appearance='primary'
          type='submit'
          disabled={busy}
        >
          {busy ? 'Publishing…' : 'Publish listing'}
        </Button>
      </div>

      {feedback.message && (
        <p
          role='status'
          aria-live='polite'
          className={
            feedback.type === 'error'
              ? 'status-banner error'
              : feedback.type === 'success'
                ? 'status-banner success'
                : 'status-banner'
          }
        >
          {feedback.message}
        </p>
      )}
    </form>
  );
}
