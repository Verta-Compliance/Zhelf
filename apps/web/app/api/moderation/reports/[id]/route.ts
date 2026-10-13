import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../../../src/lib/supabase/server';
import { isModerator } from '../../../../../src/lib/supabase/moderation';
import { updateListingReportStatus } from '../../../../../src/server/database';

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
        error: { code: 'AUTH_REQUIRED', message: 'Sign in to review reports.' },
      },
      { status: 401 },
    );
  }
  if (!isModerator(user)) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Moderator access required.' } },
      { status: 403 },
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

  if (body.status !== 'Resolved' && body.status !== 'Dismissed') {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_INPUT',
          message: 'Status must be Resolved or Dismissed.',
        },
      },
      { status: 400 },
    );
  }

  const { id } = await params;
  const updated = await updateListingReportStatus({
    reportId: id,
    moderatorId: user.id,
    status: body.status,
  });

  if (!updated) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Open report not found.' } },
      { status: 404 },
    );
  }

  return NextResponse.json({ id, status: body.status });
}
