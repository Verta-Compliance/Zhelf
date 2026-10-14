import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../../src/lib/supabase/server';
import {
  getConversation,
  replyToConversation,
} from '../../../../src/server/database';

export async function GET(
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
          message: 'Sign in to view this conversation.',
        },
      },
      { status: 401 },
    );
  }

  const { id } = await params;
  const conversation = await getConversation(id, user.id);

  if (!conversation) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Conversation not found.' } },
      { status: 404 },
    );
  }

  return NextResponse.json({ conversation });
}

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
      { error: { code: 'AUTH_REQUIRED', message: 'Sign in to reply.' } },
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

  const text = typeof body.text === 'string' ? body.text.trim() : '';
  if (!text || text.length > 2000) {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_INPUT',
          message: 'Enter a message of 1 to 2000 characters.',
        },
      },
      { status: 400 },
    );
  }

  const { id } = await params;
  const message = await replyToConversation({
    conversationId: id,
    senderId: user.id,
    text,
  });

  if (!message) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Conversation not found.' } },
      { status: 404 },
    );
  }

  return NextResponse.json(message, { status: 201 });
}
