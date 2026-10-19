CREATE TABLE IF NOT EXISTS saved_listings (
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id text NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, listing_id)
);

CREATE INDEX IF NOT EXISTS saved_listings_user_created_idx
  ON saved_listings (user_id, created_at DESC);