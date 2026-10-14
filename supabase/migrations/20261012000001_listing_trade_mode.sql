ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS trade_mode text NOT NULL DEFAULT 'Sell'
  CHECK (trade_mode IN ('Sell', 'Swap', 'Sell or swap'));