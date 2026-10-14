import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../src/lib/supabase/server';
import { createMarketplaceReview } from '../../../src/server/database';

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json(
      {
        error: { code: 'AUTH_REQUIRED', message: 'Sign in to leave a review.' },
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

  const transactionId =
    typeof body.transactionId === 'string' ? body.transactionId : '';
  const rating = Number(body.rating);
  const comment = typeof body.comment === 'string' ? body.comment.trim() : '';
  if (
    !transactionId ||
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5 ||
    comment.length > 2000
  ) {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_INPUT',
          message: 'Choose a 1–5 rating and a comment under 2000 characters.',
        },
      },
      { status: 400 },
    );
  }

  const id = await createMarketplaceReview({
    transactionId,
    reviewerId: user.id,
    rating,
    comment,
  });
  if (!id) {
    return NextResponse.json(
      {
        error: {
          code: 'REVIEW_NOT_ALLOWED',
          message:
            'Reviews are available once a transaction is complete, once per participant.',
        },
      },
      { status: 409 },
    );
  }

  return NextResponse.json({ id }, { status: 201 });
}
