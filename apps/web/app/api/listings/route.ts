import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../src/lib/supabase/server';
import { parseListingInput } from '../../../src/server/listing-input';
import { syncListingsToSearch } from '../../../src/server/search-sync';
import {
  createListing,
  ensureUserProfile,
  getListings,
} from '../../../src/server/database';

export async function GET() {
  const items = await getListings();
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_INPUT',
          message: 'A valid JSON request body is required.',
        },
      },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const input = parseListingInput(body);
  if (!input) {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_INPUT',
          message:
            'Check the title, category, price, images, and swap details.',
        },
      },
      { status: 400 },
    );
  }

  if (!user?.id) {
    return NextResponse.json(
      {
        error: {
          code: 'AUTH_REQUIRED',
          message: 'You must be signed in to publish a listing.',
        },
      },
      { status: 401 },
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

  const result = await createListing({ ...input, sellerId: user.id });
  await syncListingsToSearch([result.id]);

  return NextResponse.json(result, { status: 201 });
}
