import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '../../../src/lib/supabase/server';
import { ensureUserProfile } from '../../../src/server/database';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const requestedNext = request.nextUrl.searchParams.get('next');
  const nextPath =
    requestedNext === '/auth/reset-password'
      ? requestedNext
      : '/auth/confirmed';
  const errorType =
    nextPath === '/auth/reset-password' ? 'recovery' : 'confirmation';

  if (!code) {
    return NextResponse.redirect(
      new URL(`/auth?auth_error=${errorType}`, request.url),
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(
      new URL(`/auth?auth_error=${errorType}`, request.url),
    );
  }

  try {
    await ensureUserProfile({
      id: data.user.id,
      email: data.user.email,
      name:
        typeof data.user.user_metadata.full_name === 'string'
          ? data.user.user_metadata.full_name
          : null,
    });
  } catch (profileError) {
    console.error(
      'Authenticated user profile synchronization failed.',
      profileError,
    );
  }

  return NextResponse.redirect(new URL(nextPath, request.url));
}
