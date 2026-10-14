ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS swap_wanted text NOT NULL DEFAULT ''
  CHECK (length(swap_wanted) <= 500);