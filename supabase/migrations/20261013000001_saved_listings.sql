CREATE TABLE IF NOT EXISTS public.saved_listings (
  user_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  listing_id text NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, listing_id)
);

CREATE INDEX IF NOT EXISTS saved_listings_user_created_idx
  ON public.saved_listings (user_id, created_at DESC);