CREATE TABLE IF NOT EXISTS public.users (
  id text PRIMARY KEY,
  name text NOT NULL,
  avatar text NOT NULL DEFAULT '',
  rating numeric(2, 1) NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  location text NOT NULL DEFAULT '',
  bio text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.listings (
  id text PRIMARY KEY,
  seller_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (length(trim(title)) > 0),
  price numeric(10, 2) NOT NULL CHECK (price >= 0),
  category text NOT NULL CHECK (category IN ('Books', 'Clothing')),
  condition text NOT NULL CHECK (condition IN ('Like New', 'Good', 'Acceptable', 'Used')),
  status text NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Reserved', 'Sold')),
  description text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  images jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(images) = 'array'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.conversations (
  id text PRIMARY KEY,
  participant_one_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  participant_two_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT conversations_distinct_participants CHECK (participant_one_id < participant_two_id),
  CONSTRAINT conversations_unique_participants UNIQUE (participant_one_id, participant_two_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id text PRIMARY KEY,
  conversation_id text NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  text text NOT NULL CHECK (length(trim(text)) > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS listings_feed_idx ON public.listings (status, created_at DESC);
CREATE INDEX IF NOT EXISTS listings_category_idx ON public.listings (category, created_at DESC);
CREATE INDEX IF NOT EXISTS listings_seller_idx ON public.listings (seller_id);
CREATE INDEX IF NOT EXISTS conversations_updated_idx ON public.conversations (updated_at DESC);
CREATE INDEX IF NOT EXISTS messages_conversation_created_idx ON public.messages (conversation_id, created_at DESC);
