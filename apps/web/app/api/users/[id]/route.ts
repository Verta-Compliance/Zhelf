import { NextResponse } from 'next/server';
import { getUser, getUserListings } from '../../../../src/server/database';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getUser(id);

  if (!user) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'User not found.' } }, { status: 404 });
  }

  return NextResponse.json({
    user,
    listings: await getUserListings(user.id),
  });
}
