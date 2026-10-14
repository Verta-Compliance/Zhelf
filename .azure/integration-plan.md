# Integration Plan

## Backend
- Project folder: apps/web
- Runtime: Next.js app route API
- Start command: npm --prefix apps/web run dev
- Build command: npm --prefix apps/web run build
- Health endpoint: GET /api/health
- Port: 3000

## Frontend
- Project folder: apps/web
- Dev command: npm --prefix apps/web run dev
- Preview command: npm --prefix apps/web run dev
- API seam to replace: apps/web/src/api/index.ts
- Mock files to replace: apps/web/src/api/mockClient.ts
- Mock-state seam: apps/web/src/api/index.ts only; no direct imports from apps/web/src/mocks/

## API routes
- GET /api/health
- GET /api/listings
- POST /api/listings
- GET /api/listings/[id]
- POST /api/messages
- GET /api/users/[id]

## Database
- Type: PostgreSQL / Supabase
- Connection env: DATABASE_URL
- Migration tool: supabase db push or migrations under supabase/migrations
- Requirement: no seed data during scaffold or integrate; create schema migrations only

## Shared types
- Package: packages/shared
- Entry: packages/shared/src/index.ts
- Import alias: @zhelf/shared

## Services
- Essential: PostgreSQL, storage, auth, listing data
- Enhancement: messaging, moderation, notifications
- Keep local mock data only in the API seam until live integration
