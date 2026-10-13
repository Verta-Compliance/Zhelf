import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../../src/lib/supabase/server';
import { ensureUserProfile } from '../../../../src/server/database';

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      { error: 'Authentication required.' },
      { status: 401 },
    );
  }

  try {
    await ensureUserProfile({
      id: user.id,
      email: user.email,
      name:
        typeof user.user_metadata.full_name === 'string'
          ? user.user_metadata.full_name
          : null,
    });
  } catch {
    return NextResponse.json(
      { error: 'Unable to synchronize the user profile.' },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
