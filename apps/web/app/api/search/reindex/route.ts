import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../../src/lib/supabase/server';
import { isModerator } from '../../../../src/lib/supabase/moderation';
import { getListings } from '../../../../src/server/database';
import {
  isSearchConfigured,
  reindexAll,
} from '../../../../src/server/search-index';

export const maxDuration = 60;

/** Moderator-only: applies index settings and rebuilds the index from the database. */
export async function POST() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isModerator(user)) {
    return NextResponse.json(
      {
        error: {
          code: 'FORBIDDEN',
          message: 'Only moderators can rebuild the search index.',
        },
      },
      { status: 403 },
    );
  }

  if (!isSearchConfigured()) {
    return NextResponse.json(
      {
        error: {
          code: 'SEARCH_UNAVAILABLE',
          message: 'Search is not configured.',
        },
      },
      { status: 503 },
    );
  }

  try {
    const indexed = await reindexAll(await getListings());
    return NextResponse.json({ indexed });
  } catch (error) {
    console.error('Search reindex failed.', error);
    return NextResponse.json(
      { error: { code: 'REINDEX_FAILED', message: 'Reindex failed.' } },
      { status: 502 },
    );
  }
}
