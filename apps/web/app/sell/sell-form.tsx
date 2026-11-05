'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@fluentui/react-button';
import { ImagePlus, Upload } from 'lucide-react';
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

const controlClass = 'h-11 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#e36b48] focus:ring-2 focus:ring-[#e36b48]/15 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500';
const labelClass = 'mb-0 grid min-w-0 gap-2 text-sm font-medium text-slate-700';

function parseImages(raw: string): string[] {
  return raw
    .split(/[\n,]+/)
    .map((image) => image.trim())
    .filter(Boolean);
}

export default function SellForm() {
  const router = useRouter();
  const previewUrls = useRef(new Set<string>());
  const [busy, setBusy] = useState(false);
  const [analysing, setAnalysing] = useState(false);
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
  const [imagePreviews, setImagePreviews] = useState<
    { name: string; url: string }[]
  >([]);
  const [suggestion, setSuggestion] = useState<ListingSuggestion | null>(null);
  const [feedback, setFeedback] = useState<{
    type: 'info' | 'error' | 'success';
    message: string;
  }>({ type: 'info', message: '' });

  useEffect(() => {
    const urls = previewUrls.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

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
        message: 'Details filled in from your photos. Check them before publishing.',
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
    const cleanTitle = title.trim();
    const selectedTradeMode = tradeMode;
    const numericPrice = selectedTradeMode === 'Swap' ? 0 : Number(price);
    const swapWanted = String(data.get('swapWanted') ?? '').trim();
    const imageUrls = parseImages(String(data.get('images') ?? ''));
    const location = place.location.trim();
    const needsPrice = selectedTradeMode !== 'Swap';
    const needsSwapDetails = selectedTradeMode !== 'Sell';

    if (
      !cleanTitle ||
      !location ||
      imageUrls.length + photos.length > 8 ||
      (needsPrice && (!Number.isFinite(numericPrice) || numericPrice <= 0)) ||
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
      const uploaded = await uploadListingImages(photos);
      uploadedPaths = uploaded.paths;
      const result = await api.createListing({
        title: cleanTitle,
        category,
        price: numericPrice,
        condition,
        tradeMode: selectedTradeMode,
        swapWanted,
        description: description.trim(),
        images: [...imageUrls, ...uploaded.urls],
        location,
        latitude: place.latitude,
        longitude: place.longitude,
      });

      setFeedback({
        type: 'success',
        message: 'Published — taking you to your listing in a moment.',
      });
      router.push(`/listings/${result.id}`);
    } catch (error) {
      if (uploadedPaths.length) {
        try {
          await removeListingImages(uploadedPaths);
        } catch {
          console.error('Listing photos could not be cleaned up after a failed publish.');
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
      className='sell-form grid gap-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7'
      onSubmit={submit}
    >
      <section className='grid gap-3 rounded-lg border border-[#f1c7b9] bg-[#fdf3ef] p-4'>
        <div>
          <h2 className='text-sm font-semibold text-slate-800'>Add photos</h2>
          <p className='mt-1 text-xs leading-5 text-slate-600'>Upload up to 8 JPEG, PNG, WebP, or GIF images, up to 5 MB each.</p>
        </div>
        <label className='grid min-h-24 cursor-pointer place-items-center rounded-lg border border-dashed border-[#e6b5a4] bg-white/70 px-4 py-4 text-center transition-colors hover:border-[#e36b48] hover:bg-white'>
          <input
            className='sr-only'
            name='imageFiles'
            type='file'
            accept='image/jpeg,image/png,image/webp,image/gif'
            multiple
            onChange={(event) => {
              const input = event.currentTarget;
              const selected = Array.from(input.files ?? []);
              input.value = '';

              if (photos.length + selected.length > 8) {
                setFeedback({ type: 'error', message: 'You can add up to 8 photos to a listing.' });
                return;
              }

              const previews = selected.map((file) => {
                const url = URL.createObjectURL(file);
                previewUrls.current.add(url);
                return { name: file.name, url };
              });
              setPhotos((current) => [...current, ...selected]);
              setImagePreviews((current) => [...current, ...previews]);
              setSuggestion(null);
              setFeedback({ type: 'info', message: '' });
            }}
          />
          <span className='grid justify-items-center gap-2'>
            <span className='flex size-10 items-center justify-center rounded-full bg-white text-[#e36b48] shadow-sm'>
              <Upload className='size-5' aria-hidden='true' />
            </span>
            <span className='text-sm font-semibold text-slate-800'>Choose photos</span>
            <span className='text-xs text-slate-500'>Select one or more files</span>
          </span>
        </label>

        {imagePreviews.length ? (
          <div className='grid grid-cols-3 gap-3 sm:grid-cols-4'>
            {imagePreviews.map((image, index) => (
              <figure key={image.url} className='min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white'>
                <img src={image.url} alt={`Selected photo ${index + 1}: ${image.name}`} className='aspect-[4/3] w-full object-cover' />
                <figcaption className='truncate px-2 py-1.5 text-xs text-slate-600' title={image.name}>{image.name}</figcaption>
              </figure>
            ))}
          </div>
        ) : null}

        <p className='text-xs text-slate-500' aria-live='polite'>{photos.length} of 8 photos selected.</p>
        <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
          <Button appearance='secondary' type='button' disabled={!photos.length || analysing || busy} onClick={analysePhotos}>
            {analysing ? 'Looking at your photos…' : 'Fill in details from photos'}
          </Button>
          <span className='text-xs text-slate-500'>AI suggestions are editable before publishing.</span>
        </div>
        {suggestion ? (
          <div className='rounded-md border border-[#f1c7b9] bg-white/70 p-3 text-sm text-slate-700'>
            <p><strong>Suggested category:</strong> {suggestion.category}{suggestion.subcategory ? ` · ${suggestion.subcategory}` : ''}</p>
            {suggestion.priceMax > 0 ? <p className='mt-1'><strong>Suggested price:</strong> £{suggestion.priceMin}–£{suggestion.priceMax}</p> : null}
            <div className='mt-2 flex flex-wrap gap-2 text-xs text-slate-600'>
              {suggestion.brand ? <span>Brand: {suggestion.brand}</span> : null}
              {suggestion.material ? <span>Material: {suggestion.material}</span> : null}
              {suggestion.colour ? <span>Colour: {suggestion.colour}</span> : null}
            </div>
          </div>
        ) : null}
      </section>

      <label className={labelClass}>
        <span>Title</span>
        <input className={controlClass} name='title' required maxLength={160} placeholder='Vintage illustrated novel' value={title} onChange={(event) => setTitle(event.target.value)} />
      </label>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
        <label className={labelClass}>
          <span>Category</span>
          <select className={controlClass} name='category' value={category} onChange={(event) => setCategory(event.target.value as ListingCategory)}>
            {LISTING_CATEGORIES.map((name) => <option key={name}>{name}</option>)}
          </select>
        </label>
        <label className={labelClass}>
          <span>Condition</span>
          <select className={controlClass} name='condition' value={condition} onChange={(event) => setCondition(event.target.value as ListingCondition)}>
            <option>Good</option>
            <option>Like New</option>
            <option>Acceptable</option>
            <option>Used</option>
          </select>
        </label>
      </div>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
        <label className={labelClass}>
          <span>Listing type</span>
          <select className={controlClass} name='tradeMode' value={tradeMode} onChange={(event) => setTradeMode(event.target.value as ListingTradeMode)}>
            <option value='Sell'>Sell</option>
            <option value='Swap'>Swap</option>
            <option value='Sell or swap'>Sell or swap</option>
          </select>
        </label>
        <label className={labelClass}>
          <span>{tradeMode === 'Swap' ? 'Price (not used for swaps)' : 'Price'}</span>
          <input className={controlClass} name='price' type='number' min='0.01' step='0.01' required={tradeMode !== 'Swap'} disabled={tradeMode === 'Swap'} placeholder='42.50' value={price} onChange={(event) => setPrice(event.target.value)} />
        </label>
      </div>

      {tradeMode !== 'Sell' ? (
        <label className={labelClass}>
          <span>What would you swap for?</span>
          <textarea className={`${controlClass} h-24 resize-y py-3`} name='swapWanted' required maxLength={500} placeholder='For example: another hardback novel or a small desk lamp' />
        </label>
      ) : null}

      <label className={labelClass}>
        <span>Description</span>
        <textarea className={`${controlClass} h-32 resize-y py-3`} name='description' maxLength={4000} placeholder='Tell neighbors what makes this item special.' value={description} onChange={(event) => setDescription(event.target.value)} />
      </label>

      <LocationInput value={place} onChange={setPlace} required />

      <label className={labelClass}>
        <span>Or add photo URLs</span>
        <textarea className={`${controlClass} h-24 resize-y py-3`} name='images' placeholder='https://images.example.com/photo.jpg' />
        <span className='text-xs font-normal text-slate-500'>Separate multiple URLs with commas or new lines.</span>
      </label>

      <div className='flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between'>
        <p className='text-xs text-slate-500'>Your listing will be visible to the community.</p>
        <button type='submit' className='inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#e36b48] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#cf5b3a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e36b48] disabled:cursor-wait disabled:opacity-60 sm:w-auto' disabled={busy}>
          <ImagePlus className='size-4' aria-hidden='true' />
          {busy ? 'Publishing…' : 'List item'}
        </button>
      </div>

      {feedback.message ? (
        <p role='status' aria-live='polite' className={feedback.type === 'error' ? 'status-banner error' : feedback.type === 'success' ? 'status-banner success' : 'status-banner'}>
          {feedback.message}
        </p>
      ) : null}
    </form>
  );
}