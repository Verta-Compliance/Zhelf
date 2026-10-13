import { NextResponse } from 'next/server';
import type {
  ListingCategory,
  ListingCondition,
  ListingTradeMode,
} from '@zhelf/shared';
import { createSupabaseServerClient } from '../../../src/lib/supabase/server';
import {
  createListing,
  ensureUserProfile,
  getListings,
} from '../../../src/server/database';

function normalizeCategory(value: unknown): ListingCategory | null {
  if (value === 'Books' || value === 'Clothing') return value;
  if (value === 'books' || value === 'home') return 'Books';
  if (value === 'clothing' || value === 'fashion') return 'Clothing';
  return null;
}

function normalizeCondition(value: unknown): ListingCondition {
  if (
    value === 'Like New' ||
    value === 'Good' ||
    value === 'Acceptable' ||
    value === 'Used'
  ) {
    return value;
  }

  return 'Good';
}

function normalizeTradeMode(value: unknown): ListingTradeMode | null {
  if (value === 'Sell' || value === 'Swap' || value === 'Sell or swap') {
    return value;
  }

  return value === undefined ? 'Sell' : null;
}

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

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const category = normalizeCategory(body.category);
  const tradeMode = normalizeTradeMode(body.tradeMode);
  const price = tradeMode === 'Swap' ? 0 : Number(body.price);
  const swapWanted =
    typeof body.swapWanted === 'string' ? body.swapWanted.trim() : '';
  const description =
    typeof body.description === 'string' ? body.description.trim() : '';
  const location =
    typeof body.location === 'string' ? body.location.trim() : 'Manchester';
  const images =
    body.images === undefined
      ? []
      : Array.isArray(body.images) &&
          body.images.length <= 8 &&
          body.images.every(
            (image) => typeof image === 'string' && image.length <= 2048,
          )
        ? body.images.map((image) => image.trim()).filter(Boolean)
        : null;

  const needsPrice = tradeMode !== 'Swap';
  const needsSwapDetails = tradeMode !== 'Sell';

  if (
    !title ||
    !category ||
    !tradeMode ||
    !images ||
    (needsPrice && (!Number.isFinite(price) || price <= 0)) ||
    (needsSwapDetails && (!swapWanted || swapWanted.length > 500))
  ) {
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

  const result = await createListing({
    title,
    category,
    price,
    condition: normalizeCondition(body.condition),
    tradeMode,
    swapWanted,
    description,
    images,
    location,
    sellerId: user.id,
  });

  return NextResponse.json(result, { status: 201 });
}
