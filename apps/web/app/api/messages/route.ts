import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../src/lib/supabase/server';
import {
  createMessage,
  ensureUserProfile,
  getMessages,
} from '../../../src/server/database';

async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  return error ? null : user;
}

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json(
      {
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Sign in to view your messages.',
        },
      },
      { status: 401 },
    );
  }

  const threads = await getMessages(user.id);
  return NextResponse.json({ threads });
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json(
      {
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Sign in to message a seller.',
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
          message: 'A valid JSON request body is required.',
        },
      },
      { status: 400 },
    );
  }

  const receiverId =
    typeof body.receiverId === 'string' ? body.receiverId.trim() : '';
  const text = typeof body.text === 'string' ? body.text.trim() : '';

  if (!receiverId || receiverId === user.id || !text || text.length > 2000) {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_INPUT',
          message:
            'Choose another user and enter a message of 1 to 2000 characters.',
        },
      },
      { status: 400 },
    );
  }

  await ensureUserProfile({
    id: user.id,
    email: user.email,
    name:
      typeof user.user_metadata.full_name === 'string'
        ? user.user_metadata.full_name
        : null,
  });

  const result = await createMessage({
    senderId: user.id,
    receiverId,
    text,
  });

  if (!result) {
    return NextResponse.json(
      {
        error: {
          code: 'NOT_FOUND',
          message: 'Both message participants must exist.',
        },
      },
      { status: 404 },
    );
  }

  return NextResponse.json(result, { status: 201 });
}
