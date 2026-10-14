import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../../src/lib/supabase/server';
import { unsaveListing } from '../../../../src/server/database';

export async function DELETE(
  _request: Request,
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
          message: 'Sign in to remove saved listings.',
        },
      },
      { status: 401 },
    );
  }

  const { id } = await params;
  await unsaveListing(user.id, id);
  return NextResponse.json({ listingId: id });
}
