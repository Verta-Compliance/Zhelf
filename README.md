# Zhelf

Zhelf is a community marketplace for buying, selling, and swapping books and clothing. It uses Next.js for the web app and API, Supabase Auth and Storage, and PostgreSQL for marketplace data.

## Prerequisites

- Node.js `22.22.2` or newer
- npm
- Docker Desktop and Docker Compose for local PostgreSQL

## Local Development

1. Copy `.env.example` to `.env` and configure the Supabase URL and anon key. Set `DATABASE_URL` to the local PostgreSQL connection used by `docker-compose.yml`.
2. Start the database and apply migrations:

   ```sh
   npm run emulators:start
   npm run db:migrate
   ```

3. Start the web app:

   ```sh
   npm run dev
   ```

   The app runs at `http://localhost:3000`.

Useful commands:

- `npm run build` builds the shared package and web app.
- `npm run test` runs the web test suite. The database integration test clears its configured database tables; use a disposable test database.
- `npm run emulators:stop` stops the local PostgreSQL container without deleting its data.
- `npm run emulators:clean -- --yes` deletes emulator volumes and all local database data. Only run it when that deletion is intended.

Ensure both the migration command and app runtime use the intended `DATABASE_URL`. The root `.env` is read by the migration script; Next.js also loads environment files from `apps/web`.

## Supabase Setup

The app uses Supabase Auth for credentials and sessions. `public.users` stores marketplace profile data keyed by the Auth user ID. PostgreSQL stores listings, saved listings, conversations, messages, offers, swaps, transactions, reviews, and listing reports.

Apply the migrations in `supabase/migrations` to the target database. The Supabase domain-alignment migration also creates the `listing-images` Storage bucket and authenticated owner-folder policies when Supabase Storage is available. Local PostgreSQL does not provide Supabase Auth or Storage; those services remain hosted.

Add the callback URLs to Supabase Auth URL Configuration:

- Local: `http://localhost:3000/auth/callback`
- Production: `https://zhelf.vercel.app/auth/callback`

Set the Supabase Site URL to the app origin for each environment. Listing images accept JPEG, PNG, WebP, or GIF files up to 5 MB each.

Never commit service-role keys. The app's normal web flows use the public anon key and authenticated user session; keep any required administrative key only in a secure server-side environment variable.

## Vercel Deployment

The Vercel project is `zhelf` in team Verta and is connected to `https://github.com/Verta-Compliance/Zhelf`. Its project root is `apps/web`, framework is Next.js, and Node.js is set to 22.x. The configured install and build commands run from the monorepo root:

- Install: `npm --prefix ../.. install`
- Build: `npm --prefix ../.. run build`

Configure these variables in Vercel Project Settings for Production:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DATABASE_URL` using the Supabase PostgreSQL connection string (including the SSL settings supplied by Supabase)

Configure the production branch under **Project Settings → Git → Production Branch**. Pushes to other branches create Preview deployments; the production branch updates `https://zhelf.vercel.app`. Use a separate database for Preview deployments if they should not modify production data.

## Moderation

The report queue is at `/moderation/reports`. Access is granted only to users whose Supabase Auth `app_metadata.role` is `moderator` (or `app_metadata.moderator` is `true`). An authorized Supabase administrator must set this trusted metadata; user-editable `user_metadata` does not grant access.
