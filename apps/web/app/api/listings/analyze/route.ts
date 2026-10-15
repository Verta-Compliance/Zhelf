import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../../src/lib/supabase/server';
import {
  AiNotConfiguredError,
  analyzeListingPhotos,
} from '../../../../src/server/listing-analysis';

export const maxDuration = 60;

const MAX_PHOTOS = 4;
// Photos are downscaled in the browser; this also stays under Vercel's 4.5 MB body limit.
const MAX_PHOTO_BYTES = 1.5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function fail(message: string, status: number) {
  return NextResponse.json({ error: { message } }, { status });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return fail('Sign in to use AI listing.', 401);
  }

  let files: File[];
  try {
    const form = await request.formData();
    files = form
      .getAll('images')
      .filter((value): value is File => value instanceof File);
  } catch {
    return fail('Send the photos as form data.', 400);
  }

  if (files.length < 1 || files.length > MAX_PHOTOS) {
    return fail(`Add between 1 and ${MAX_PHOTOS} photos.`, 400);
  }
  if (files.some((file) => !ALLOWED_TYPES.has(file.type))) {
    return fail('Use JPEG, PNG or WebP photos.', 400);
  }
  if (files.some((file) => file.size > MAX_PHOTO_BYTES)) {
    return fail('A photo is too large to analyse.', 413);
  }

  const dataUrls = await Promise.all(
    files.map(
      async (file) =>
        `data:${file.type};base64,${Buffer.from(await file.arrayBuffer()).toString('base64')}`,
    ),
  );

  try {
    const suggestion = await analyzeListingPhotos(dataUrls);
    return NextResponse.json({ suggestion });
  } catch (error) {
    if (error instanceof AiNotConfiguredError) {
      return fail('AI listing is not available right now.', 503);
    }
    console.error('Listing photo analysis failed.', error);
    return fail('We could not analyse those photos. Try again.', 502);
  }
}
