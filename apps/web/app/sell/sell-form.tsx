'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button } from '@fluentui/react-button';
import type {
  ListingCategory,
  ListingCondition,
  ListingTradeMode,
} from '@zhelf/shared';
import api from '../../src/api';
import { LISTING_CATEGORIES } from '../../src/categories';
import type { ListingSuggestion } from '../../src/listing-suggestion';
import LocationInput, {
  type LocationValue,
} from '../../components/location-input';
import { requestListingSuggestion } from '../../src/lib/listing-ai';
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
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ListingCategory>('Books');
  const [condition, setCondition] = useState<ListingCondition>('Good');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [place, setPlace] = useState<LocationValue>({
    location: '',
    latitude: null,
    longitude: null,
  });
  const [photos, setPhotos] = useState<File[]>([]);
  const [analysing, setAnalysing] = useState(false);
  const [suggestion, setSuggestion] = useState<ListingSuggestion | null>(null);
  const [feedback, setFeedback] = useState<{
    type: 'info' | 'error' | 'success';
    message: string;
  }>({
    type: 'info',
    message: '',
  });

  async function analysePhotos() {
    setAnalysing(true);
    setSuggestion(null);
    setFeedback({ type: 'info', message: '' });

    try {
      const result = await requestListingSuggestion(photos);
      const details = [
        result.brand && `Brand: ${result.brand}`,
        result.material && `Material: ${result.material}`,
        result.colour && `Colour: ${result.colour}`,
      ]
        .filter(Boolean)
        .join(' · ');

      setSuggestion(result);
      setTitle(result.title);
      setCategory(result.category);
      setCondition(result.condition);
      setDescription(
        details ? `${result.description}\n\n${details}` : result.description,
      );
      if (!price && result.priceMax > 0) {
        setPrice(String(Math.round((result.priceMin + result.priceMax) / 2)));
      }
      setFeedback({
        type: 'success',
        message:
          'Details filled in from your photos. Check them, add your location, then publish.',
      });
    } catch (error) {
      setFeedback({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'We could not analyse those photos. Try again.',
      });
    } finally {
      setAnalysing(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setFeedback({ type: 'info', message: '' });

    const data = new FormData(event.currentTarget);
    const title = String(data.get('title') ?? '').trim();
    const priceValue = data.get('price');
    const category = String(data.get('category') ?? 'Books') as ListingCategory;
    const condition = String(
      data.get('condition') ?? 'Good',
    ) as ListingCondition;
    const selectedTradeMode = String(
      data.get('tradeMode') ?? 'Sell',
    ) as ListingTradeMode;
    const price = selectedTradeMode === 'Swap' ? 0 : Number(priceValue);
    const swapWanted = String(data.get('swapWanted') ?? '').trim();
    const description = String(data.get('description') ?? '').trim();
    const location = place.location.trim();
    const imageUrls = parseImages(String(data.get('images') ?? ''));
    const imageFiles = photos.filter((file) => file.size > 0);
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
        latitude: place.latitude,
        longitude: place.longitude,
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
      <div className='ai-panel'>
        <label>
          <span>Add photos (up to 8 total, 5 MB each)</span>
          <input
            name='imageFiles'
            type='file'
            accept='image/jpeg,image/png,image/webp,image/gif'
            multiple
            onChange={(event) => {
              const selected = Array.from(event.target.files ?? []);
              event.target.value = '';

              if (photos.length + selected.length > 8) {
                setFeedback({
                  type: 'error',
                  message: 'You can add up to 8 photos to a listing.',
                });
                return;
              }

              setPhotos((current) => [...current, ...selected]);
              setSuggestion(null);
              setFeedback({ type: 'info', message: '' });
            }}
          />
        </label>
        <p
          className='photo-count'
          aria-live='polite'
        >
          {photos.length} of 8 photos selected. Choose one photo at a time or
          select several together.
        </p>
        {photos.length ? (
          <ul
            className='photo-list'
            aria-label='Selected photos'
          >
            {photos.map((photo, index) => (
              <li key={`${photo.name}-${photo.lastModified}-${index}`}>
                <span
                  className='photo-name'
                  title={photo.name}
                >
                  {photo.name}
                </span>
                <span className='muted'>
                  {(photo.size / (1024 * 1024)).toFixed(1)} MB
                </span>
                <button
                  type='button'
                  className='photo-remove'
                  aria-label={`Remove ${photo.name}`}
                  disabled={busy || analysing}
                  onClick={() => {
                    setPhotos((current) =>
                      current.filter((_, photoIndex) => photoIndex !== index),
                    );
                    setSuggestion(null);
                  }}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <div className='ai-panel-actions'>
          <Button
            appearance='secondary'
            type='button'
            disabled={!photos.length || analysing || busy}
            onClick={analysePhotos}
          >
            {analysing
              ? 'Looking at your photos…'
              : 'Fill in details from photos'}
          </Button>
          <span className='muted'>
            AI reads up to 4 photos and suggests the details. You can edit
            everything.
          </span>
        </div>
        {suggestion ? (
          <div className='ai-suggestion'>
            <p>
              <strong>Suggested category:</strong> {suggestion.category}
              {suggestion.subcategory ? ` → ${suggestion.subcategory}` : ''}
            </p>
            {suggestion.priceMax > 0 ? (
              <p>
                <strong>Suggested price:</strong> £{suggestion.priceMin}–£
                {suggestion.priceMax}
              </p>
            ) : null}
            <ul className='chip-list'>
              {suggestion.brand ? <li>Brand: {suggestion.brand}</li> : null}
              {suggestion.material ? (
                <li>Material: {suggestion.material}</li>
              ) : null}
              {suggestion.colour ? <li>Colour: {suggestion.colour}</li> : null}
            </ul>
          </div>
        ) : null}
      </div>

      <div className='form-grid'>
        <label>
          <span>Title</span>
          <input
            name='title'
            required
            maxLength={160}
            placeholder='Vintage illustrated novel'
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <label>
          <span>Category</span>
          <select
            name='category'
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as ListingCategory)
            }
          >
            {LISTING_CATEGORIES.map((name) => (
              <option key={name}>{name}</option>
            ))}
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
            value={price}
            onChange={(event) => setPrice(event.target.value)}
          />
        </label>
        <label>
          <span>Condition</span>
          <select
            name='condition'
            value={condition}
            onChange={(event) =>
              setCondition(event.target.value as ListingCondition)
            }
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
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </label>

      <LocationInput
        value={place}
        onChange={setPlace}
        required
      />

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
