CREATE TABLE IF NOT EXISTS offers (
  id text PRIMARY KEY,
  listing_id text NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  buyer_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  offer_type text NOT NULL CHECK (offer_type IN ('Purchase', 'Swap')),
  amount numeric(10, 2),
  swap_listing_id text REFERENCES listings(id) ON DELETE SET NULL,
  message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Accepted', 'Declined', 'Withdrawn', 'Expired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT offers_kind_details CHECK (
    (offer_type = 'Purchase' AND amount IS NOT NULL AND amount > 0 AND swap_listing_id IS NULL) OR
    (offer_type = 'Swap' AND swap_listing_id IS NOT NULL AND swap_listing_id <> listing_id AND amount IS NULL)
  )
);

CREATE TABLE IF NOT EXISTS transactions (
  id text PRIMARY KEY,
  offer_id text NOT NULL UNIQUE REFERENCES offers(id) ON DELETE RESTRICT,
  listing_id text NOT NULL REFERENCES listings(id) ON DELETE RESTRICT,
  buyer_id text NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  seller_id text NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  transaction_type text NOT NULL CHECK (transaction_type IN ('Purchase', 'Swap')),
  amount numeric(10, 2),
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed', 'Cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT transactions_distinct_participants CHECK (buyer_id <> seller_id),
  CONSTRAINT transactions_amount_valid CHECK (amount IS NULL OR amount >= 0)
);

CREATE TABLE IF NOT EXISTS swaps (
  id text PRIMARY KEY,
  transaction_id text NOT NULL UNIQUE REFERENCES transactions(id) ON DELETE CASCADE,
  offer_id text NOT NULL UNIQUE REFERENCES offers(id) ON DELETE CASCADE,
  requested_listing_id text NOT NULL REFERENCES listings(id) ON DELETE RESTRICT,
  offered_listing_id text NOT NULL REFERENCES listings(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'Agreed' CHECK (status IN ('Agreed', 'Completed', 'Cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT swaps_distinct_listings CHECK (requested_listing_id <> offered_listing_id)
);

CREATE TABLE IF NOT EXISTS reviews (
  id text PRIMARY KEY,
  transaction_id text NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  reviewer_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewee_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text NOT NULL DEFAULT '' CHECK (length(comment) <= 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reviews_distinct_users CHECK (reviewer_id <> reviewee_id),
  CONSTRAINT reviews_once_per_transaction UNIQUE (transaction_id, reviewer_id)
);

CREATE INDEX IF NOT EXISTS offers_listing_status_idx ON offers (listing_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS offers_buyer_status_idx ON offers (buyer_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS transactions_participants_idx ON transactions (buyer_id, seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS swaps_status_idx ON swaps (status, created_at DESC);
CREATE INDEX IF NOT EXISTS reviews_reviewee_idx ON reviews (reviewee_id, created_at DESC);

DO $migration$
BEGIN
  IF to_regclass('storage.buckets') IS NOT NULL THEN
    EXECUTE $statement$
      INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      VALUES ('listing-images', 'listing-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
      ON CONFLICT (id) DO UPDATE
      SET public = EXCLUDED.public,
          file_size_limit = EXCLUDED.file_size_limit,
          allowed_mime_types = EXCLUDED.allowed_mime_types
    $statement$;
  END IF;

  IF to_regclass('storage.objects') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS listing_images_insert_own_folder ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS listing_images_update_own_folder ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS listing_images_delete_own_folder ON storage.objects';
    EXECUTE $statement$
      CREATE POLICY listing_images_insert_own_folder ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'listing-images' AND (storage.foldername(name))[1] = auth.uid()::text)
    $statement$;
    EXECUTE $statement$
      CREATE POLICY listing_images_update_own_folder ON storage.objects
      FOR UPDATE TO authenticated
      USING (bucket_id = 'listing-images' AND (storage.foldername(name))[1] = auth.uid()::text)
      WITH CHECK (bucket_id = 'listing-images' AND (storage.foldername(name))[1] = auth.uid()::text)
    $statement$;
    EXECUTE $statement$
      CREATE POLICY listing_images_delete_own_folder ON storage.objects
      FOR DELETE TO authenticated
      USING (bucket_id = 'listing-images' AND (storage.foldername(name))[1] = auth.uid()::text)
    $statement$;
  END IF;
END;
$migration$;