# Project Plan

**Status**: Integrated
**Created**: 2026-10-08
**Mode**: NEW

---

## 1. Project Overview

**Goal**: ZHELPH is a mobile-first community marketplace for buying, selling, swapping, and gifting books and clothing, with web browsing, listing management, messaging, and moderation. The project is designed so that every module is independently testable.

**App Type**: SPA + API

**API Login**: Yes

**Mode**: NEW

**Deployment Plan**: No deployment plan found

---

## 2. ZHELPH Mobile App — frontend

| Component           | Technology     |
| ------------------- | -------------- |
| **Language**        | TypeScript     |
| **Runtime**         | Node           |
| **Package Manager** | npm            |
| **Test Runner**     | vitest         |
| **Mocking Library** | vi.mock        |
| **Test Command**    | npm test       |
| **Orchestration**   | docker-compose |

---

## 3. ZHELPH Web App — frontend

| Component           | Technology     |
| ------------------- | -------------- |
| **Language**        | TypeScript     |
| **Framework**       | Next.js        |
| **Package Manager** | npm            |
| **Test Runner**     | vitest         |
| **Mocking Library** | vi.mock        |
| **Test Command**    | npm test       |
| **Orchestration**   | docker-compose |

---

## 4. ZHELPH Supabase Backend — backend

| Component           | Technology     |
| ------------------- | -------------- |
| **Language**        | TypeScript     |
| **Runtime**         | Node           |
| **Package Manager** | npm            |
| **Test Runner**     | vitest         |
| **Mocking Library** | vi.mock        |
| **Test Command**    | npm test       |
| **Orchestration**   | docker-compose |

---

## 5. Services Required

| Azure Service | Role in App                                                              | Environment Variable      | Default Value (Local)                                | Classification |
| ------------- | ------------------------------------------------------------------------ | ------------------------- | ---------------------------------------------------- | -------------- |
| Blob Storage  | Store listing photos and downloadable media                              | STORAGE_CONNECTION_STRING | UseDevelopmentStorage=true                           | Essential      |
| PostgreSQL    | Primary relational data store for users, listings, messages, and reviews | DATABASE_URL              | postgresql://postgres:postgres@localhost:5432/zhelph | Essential      |

---

## 6. Prerequisites

### Run

| Tool           | Service(s)                                | Installed | Version          |
| -------------- | ----------------------------------------- | --------- | ---------------- |
| Node.js        | zhelph-mobile, zhelph-web, zhelph-backend | ✅        | v22.17.0         |
| npm            | zhelph-mobile, zhelph-web, zhelph-backend | ✅        | 12.0.1           |
| Docker         | zhelph-backend                            | ✅        | 29.8.2           |
| Docker Compose | zhelph-backend                            | ✅        | v5.5.1           |
| Git            | \*                                        | ✅        | 2.49.0.windows.1 |

### Debug

| Tool                       | Service(s)                                | Installed | Version |
| -------------------------- | ----------------------------------------- | --------- | ------- |
| VS Code Docker extension   | zhelph-backend                            | ❓        | n/a     |
| VS Code TypeScript support | zhelph-mobile, zhelph-web, zhelph-backend | ✅        | 1.138.0 |

---

## 7. Design System & UI

**Component Library**: Fluent UI v9
**Style Direction**: A warm, community-first marketplace with friendly cards, soft shadows, and highly scannable listing and profile views.
**Typography**: Inter, system-ui

### Color Palette

| Token     | Hex       | Usage                                                                                     |
| --------- | --------- | ----------------------------------------------------------------------------------------- |
| `primary` | `#1E6BFF` | Primary actions, key CTAs, selected nav items, and important marketplace calls to action. |
| `accent`  | `#10B981` | Secondary highlights, positive states, saved items, and trust signals.                    |
| `surface` | `#F7F9FC` | Page backgrounds and large content surfaces for browsing, feeds, and cards.               |
| `text`    | `#10233A` | Primary headings and body text for listings, profiles, and product metadata.              |
| `muted`   | `#64748B` | Secondary metadata, timestamps, captions, and less prominent descriptions.                |
| `border`  | `#DCE7F5` | Dividers, input borders, and subtle card framing.                                         |

### Pages

| Page           | Route            | Purpose                                                                     | Layout                              |
| -------------- | ---------------- | --------------------------------------------------------------------------- | ----------------------------------- |
| Marketplace    | `/`              | Discover nearby books and clothing listings from the local community.       | hero + card-list                    |
| Listing Detail | `/listings/[id]` | Review the item, seller profile, condition, and pricing details.            | two-column(media+meta) + action-bar |
| Create Listing | `/sell`          | Add a new book or clothing listing with category, price, and photo details. | form                                |
| Messages       | `/messages`      | Manage conversation threads between buyers and sellers.                     | table + actions                     |

### Sample Content

```
Marketplace — listings:
| Title | Price | Condition | Status |
| The Hobbit | $8 | Good | Available |
| Vintage Denim Jacket | $24 | Like New | Available |
| Chemistry IB Workbook | $12 | Acceptable | Reserved |

Listing Detail — item: "The Hobbit" · seller: "Maya R." · condition: "Good" · price: "$8"
Create Listing — category: "Books" · condition: "Good" · price: "$18" · photo count: 2
Messages — conversation: "Liam" · last reply: "Still available?" · status: "Active"
```

---

## 8. Project Structure

```
zhelf/
├─ .azure/
│  ├─ requirements.json
│  ├─ project-plan.md
│  └─ .preview-temp/
│     ├─ manifest.json
│     └─ theme.css
├─ apps/
│  ├─ mobile/
│  │  ├─ app/
│  │  ├─ components/
│  │  ├─ lib/
│  │  └─ package.json
│  └─ web/
│     ├─ app/
│     ├─ components/
│     ├─ lib/
│     └─ package.json
├─ packages/
│  ├─ shared/
│  │  ├─ types/
│  │  ├─ utils/
│  │  └─ validation/
│  └─ ui/
│     └─ components/
├─ supabase/
│  ├─ migrations/
│  ├─ functions/
│  └─ config/
├─ README.md
├─ package.json
├─ tsconfig.base.json
└─ .gitignore
```

---

## 9. Route Definitions

| #   | Method | Path                | Description                                 | Request Body                                                           | Response Body                 | Status Codes  |
| --- | ------ | ------------------- | ------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------- | ------------- |
| 1   | GET    | `/api/health`       | Health check                                | —                                                                      | `{ status, services }`        | 200, 503      |
| 2   | GET    | `/api/listings`     | Fetch searchable marketplace listings       | —                                                                      | `{ items: [...] }`            | 200           |
| 3   | POST   | `/api/listings`     | Create a listing with photos and metadata   | `{ title, category, price, condition, description, images, location }` | `{ id, status }`              | 201, 400, 401 |
| 4   | GET    | `/api/listings/:id` | Fetch a single listing detail               | —                                                                      | `{ listing, seller }`         | 200, 404      |
| 5   | POST   | `/api/messages`     | Create a new conversation or message thread | `{ senderId, receiverId, text }`                                       | `{ conversationId, message }` | 201, 400      |
| 6   | GET    | `/api/users/:id`    | Fetch a seller or user profile              | —                                                                      | `{ user, listings }`          | 200, 404      |

---

## 10. Next Steps

1. Run **azure-project-scaffold** to execute this plan
2. Run **azure-project-integrate** to wire the frontend to live data, smoke-test the backend, and create the migrations
3. Run **azure-debug-plan** → **azure-debug-generate** for Docker emulators and VS Code debugging
4. Run the **azure-deploy** agent when ready; it uses **azure-app-onboard** for architecture, cost estimation, IaC generation, provisioning, and health verification
