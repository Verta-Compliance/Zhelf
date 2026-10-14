import { NextResponse } from 'next/server';
import { getListing } from '../../../../src/server/database';
import { createSupabaseServerClient } from '../../../../src/lib/supabase/server';
import { deleteListing } from '../../../../src/server/database';

function getOwnedStoragePath(imageUrl: string, userId: string): string | null {
  try {
    const pathPrefix = '/storage/v1/object/public/listing-images/';
    const pathname = new URL(imageUrl).pathname;

    if (!pathname.startsWith(pathPrefix)) {
      return null;
    }

    const path = decodeURIComponent(pathname.slice(pathPrefix.length));
    return path.startsWith(`${userId}/`) ? path : null;
  } catch {
    return null;
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const listing = await getListing(id);

  if (!listing) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Listing not found.' } },
      { status: 404 },
    );
  }

  return NextResponse.json({ listing, seller: listing.seller });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      {
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Sign in to delete this listing.',
        },
      },
      { status: 401 },
    );
  }

  const { id } = await params;
  const listing = await getListing(id);

  if (!listing || listing.seller.id !== user.id) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Listing not found.' } },
      { status: 404 },
    );
  }

  const imagePaths = listing.images
    .map((imageUrl) => getOwnedStoragePath(imageUrl, user.id))
    .filter((path): path is string => path !== null);

  if (imagePaths.length) {
    const { error: storageError } = await supabase.storage
      .from('listing-images')
      .remove(imagePaths);

    if (storageError) {
      return NextResponse.json(
        {
          error: {
            code: 'STORAGE_CLEANUP_FAILED',
            message:
              'Listing photos could not be removed. The listing was kept.',
          },
        },
        { status: 502 },
      );
    }
  }

  const deleted = await deleteListing(id, user.id);

  if (!deleted) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Listing not found.' } },
      { status: 404 },
    );
  }

  return NextResponse.json({ id });
}
