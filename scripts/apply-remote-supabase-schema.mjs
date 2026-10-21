import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const envFiles = [
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), 'apps/web/.env'),
  resolve(process.cwd(), 'apps/web/.env.local'),
];

for (const envPath of envFiles) {
  try {
    const contents = readFileSync(envPath, 'utf8');
    for (const line of contents.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // Ignore missing env files.
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  throw new Error('Missing Supabase URL or key in environment.');
}

const sql = `
CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  name text NOT NULL,
  avatar text NOT NULL DEFAULT '',
  rating numeric(2, 1) NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  location text NOT NULL DEFAULT '',
  bio text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS listings (
  id text PRIMARY KEY,
  seller_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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

CREATE TABLE IF NOT EXISTS conversations (
  id text PRIMARY KEY,
  participant_one_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  participant_two_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT conversations_distinct_participants CHECK (participant_one_id < participant_two_id),
  CONSTRAINT conversations_unique_participants UNIQUE (participant_one_id, participant_two_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id text PRIMARY KEY,
  conversation_id text NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text text NOT NULL CHECK (length(trim(text)) > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS listings_feed_idx ON listings (status, created_at DESC);
CREATE INDEX IF NOT EXISTS listings_category_idx ON listings (category, created_at DESC);
CREATE INDEX IF NOT EXISTS listings_seller_idx ON listings (seller_id);
CREATE INDEX IF NOT EXISTS conversations_updated_idx ON conversations (updated_at DESC);
CREATE INDEX IF NOT EXISTS messages_conversation_created_idx ON messages (conversation_id, created_at DESC);
`;

const response = await fetch(`${url.replace(/\/$/, '')}/rest/v1/sql`, {
  method: 'POST',
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  body: JSON.stringify({ query: sql }),
});

const text = await response.text();
console.log(`STATUS:${response.status}`);
console.log(text.substring(0, 800));

if (!response.ok) {
  process.exitCode = 1;
}
