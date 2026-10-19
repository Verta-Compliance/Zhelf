import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../../src/lib/supabase/server';
import {
  completeMarketplaceTransaction,
  getTransactionListingIds,
} from '../../../../src/server/database';
import { syncListingsToSearch } from '../../../../src/server/search-sync';

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
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Sign in to complete a transaction.',
        },
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
  if (body.action !== 'Complete') {
    return NextResponse.json(
      { error: { code: 'INVALID_INPUT', message: 'Action must be Complete.' } },
      { status: 400 },
    );
  }

  const { id } = await params;
  const completed = await completeMarketplaceTransaction(id, user.id);
  if (completed) {
    await syncListingsToSearch(await getTransactionListingIds(id));
  }
  return completed
    ? NextResponse.json({ id })
    : NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'Pending transaction not found.',
          },
        },
        { status: 404 },
      );
}
