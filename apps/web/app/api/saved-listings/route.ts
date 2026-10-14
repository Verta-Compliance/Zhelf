import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../src/lib/supabase/server';
import {
  ensureUserProfile,
  getSavedListings,
  saveListing,
} from '../../../src/server/database';

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      {
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Sign in to view saved listings.',
        },
      },
      { status: 401 },
    );
  }

  return NextResponse.json({ items: await getSavedListings(user.id) });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      {
        error: { code: 'AUTH_REQUIRED', message: 'Sign in to save listings.' },
      },
      { status: 401 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_INPUT',
          message: 'A valid JSON body is required.',
        },
      },
      { status: 400 },
    );
  }

  const listingId =
    typeof body.listingId === 'string' ? body.listingId.trim() : '';
  if (!listingId) {
    return NextResponse.json(
      {
        error: { code: 'INVALID_INPUT', message: 'A listing ID is required.' },
      },
      { status: 400 },
    );
  }

  await ensureUserProfile({
    id: user.id,
    email: user.email,
    name:
      typeof user.user_metadata.full_name === 'string'
        ? user.user_metadata.full_name
        : null,
  });

  if (!(await saveListing(user.id, listingId))) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Listing not found.' } },
      { status: 404 },
    );
  }

  return NextResponse.json({ listingId }, { status: 201 });
}
