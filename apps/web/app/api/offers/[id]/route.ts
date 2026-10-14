import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../../src/lib/supabase/server';
import {
  respondToMarketplaceOffer,
  withdrawMarketplaceOffer,
} from '../../../../src/server/database';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json(
      {
        error: { code: 'AUTH_REQUIRED', message: 'Sign in to update offers.' },
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

  const { id } = await params;
  if (body.action === 'Withdraw') {
    const withdrawn = await withdrawMarketplaceOffer(id, user.id);
    return withdrawn
      ? NextResponse.json({ transactionId: null })
      : NextResponse.json(
          { error: { code: 'NOT_FOUND', message: 'Pending offer not found.' } },
          { status: 404 },
        );
  }

  if (body.action !== 'Accept' && body.action !== 'Decline') {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_INPUT',
          message: 'Action must be Accept, Decline, or Withdraw.',
        },
      },
      { status: 400 },
    );
  }

  const transactionId = await respondToMarketplaceOffer({
    offerId: id,
    sellerId: user.id,
    action: body.action,
  });

  if (transactionId === false) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Pending offer not found.' } },
      { status: 404 },
    );
  }

  return NextResponse.json({ transactionId });
}
