CREATE TABLE IF NOT EXISTS public.listing_reports (
  id text PRIMARY KEY,
  listing_id text NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  reporter_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (reason IN ('Spam', 'Prohibited item', 'Fraud or scam', 'Harassment', 'Other')),
  details text NOT NULL DEFAULT '' CHECK (length(details) <= 2000),
  status text NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Resolved', 'Dismissed')),
  reviewed_by text REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS listing_reports_one_open_per_reporter_idx
  ON public.listing_reports (listing_id, reporter_id)
  WHERE status = 'Open';

CREATE INDEX IF NOT EXISTS listing_reports_queue_idx
  ON public.listing_reports (status, created_at DESC);