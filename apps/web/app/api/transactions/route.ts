import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../src/lib/supabase/server';
import { getMarketplaceTransactions } from '../../../src/server/database';

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
          message: 'Sign in to view transactions.',
        },
      },
      { status: 401 },
    );
  }

  return NextResponse.json({
    transactions: await getMarketplaceTransactions(user.id),
  });
}
