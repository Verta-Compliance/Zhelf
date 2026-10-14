import { NextResponse } from 'next/server';
import type { OfferType } from '@zhelf/shared';
import { createSupabaseServerClient } from '../../../src/lib/supabase/server';
import {
  createMarketplaceOffer,
  ensureUserProfile,
  getMarketplaceOffers,
} from '../../../src/server/database';

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json(
      { error: { code: 'AUTH_REQUIRED', message: 'Sign in to view offers.' } },
      { status: 401 },
    );
  }

  return NextResponse.json({ offers: await getMarketplaceOffers(user.id) });
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
        error: { code: 'AUTH_REQUIRED', message: 'Sign in to make an offer.' },
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

  const listingId = typeof body.listingId === 'string' ? body.listingId : '';
  const offerType = body.offerType;
  const amount = body.amount == null ? null : Number(body.amount);
  const swapListingId =
    typeof body.swapListingId === 'string' ? body.swapListingId : null;
  const message = typeof body.message === 'string' ? body.message.trim() : '';

  if (
    !listingId ||
    (offerType !== 'Purchase' && offerType !== 'Swap') ||
    message.length > 2000 ||
    (offerType === 'Purchase' &&
      (!Number.isFinite(amount) || !amount || amount <= 0)) ||
    (offerType === 'Swap' && !swapListingId)
  ) {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_INPUT',
          message: 'Check offer type, amount, swap item, and message.',
        },
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

  const offerId = await createMarketplaceOffer({
    listingId,
    buyerId: user.id,
    offerType: offerType as OfferType,
    amount: offerType === 'Purchase' ? amount : null,
    swapListingId: offerType === 'Swap' ? swapListingId : null,
    message,
  });

  if (!offerId) {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_OFFER',
          message: 'This listing cannot accept that offer.',
        },
      },
      { status: 400 },
    );
  }

  return NextResponse.json({ id: offerId }, { status: 201 });
}
