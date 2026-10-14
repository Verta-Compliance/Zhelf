import { NextResponse } from 'next/server';
import type { ListingReportReason } from '@zhelf/shared';
import { createSupabaseServerClient } from '../../../../../src/lib/supabase/server';
import {
  createListingReport,
  ensureUserProfile,
} from '../../../../../src/server/database';

const reasons: ListingReportReason[] = [
  'Spam',
  'Prohibited item',
  'Fraud or scam',
  'Harassment',
  'Other',
];

export async function POST(
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
          message: 'Sign in to report a listing.',
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

  const reason = body.reason;
  const details = typeof body.details === 'string' ? body.details.trim() : '';
  if (
    typeof reason !== 'string' ||
    !reasons.includes(reason as ListingReportReason) ||
    details.length > 2000
  ) {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_INPUT',
          message: 'Choose a reason and keep details under 2000 characters.',
        },
      },
      { status: 400 },
    );
  }

  const { id: listingId } = await params;
  await ensureUserProfile({
    id: user.id,
    email: user.email,
    name:
      typeof user.user_metadata.full_name === 'string'
        ? user.user_metadata.full_name
        : null,
  });

  const reportId = await createListingReport({
    listingId,
    reporterId: user.id,
    reason: reason as ListingReportReason,
    details,
  });

  if (!reportId) {
    return NextResponse.json(
      {
        error: {
          code: 'REPORT_NOT_CREATED',
          message: 'Listing not found, owned by you, or already reported.',
        },
      },
      { status: 409 },
    );
  }

  return NextResponse.json({ id: reportId }, { status: 201 });
}
