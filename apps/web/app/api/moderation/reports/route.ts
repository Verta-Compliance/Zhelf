import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../../src/lib/supabase/server';
import { isModerator } from '../../../../src/lib/supabase/moderation';
import { getListingReports } from '../../../../src/server/database';

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      { error: { code: 'AUTH_REQUIRED', message: 'Sign in to view reports.' } },
      { status: 401 },
    );
  }
  if (!isModerator(user)) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Moderator access required.' } },
      { status: 403 },
    );
  }

  return NextResponse.json({ reports: await getListingReports() });
}
