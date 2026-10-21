import type { ListingSuggestion } from '../listing-suggestion';

const MAX_PHOTOS = 4;
const MAX_EDGE = 1280;

async function downscale(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Your browser could not prepare the photos.');
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error('Could not prepare a photo.')),
      'image/jpeg',
      0.8,
    ),
  );
}

export async function requestListingSuggestion(
  files: File[],
): Promise<ListingSuggestion> {
  const form = new FormData();
  const blobs = await Promise.all(files.slice(0, MAX_PHOTOS).map(downscale));
  blobs.forEach((blob, index) =>
    form.append('images', blob, `photo-${index}.jpg`),
  );

  const response = await fetch('/api/listings/analyze', {
    method: 'POST',
    body: form,
  });
  const body = (await response.json().catch(() => null)) as {
    suggestion?: ListingSuggestion;
    error?: { message?: string };
  } | null;

  if (!response.ok || !body?.suggestion) {
    throw new Error(
      body?.error?.message ?? 'We could not analyse those photos. Try again.',
    );
  }
  return body.suggestion;
}
