import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { Pool } from 'pg';
import type {
  Listing,
  ListingCategory,
  ListingCondition,
  ListingStatus,
  ListingTradeMode,
  ListingReport,
  ListingReportReason,
  ListingReportStatus,
  MessageConversation,
  ConversationMessage,
  MarketplaceOffer,
  MarketplaceTransaction,
  MessageThread,
  OfferType,
  OfferStatus,
  User,
} from '@zhelf/shared';

for (const envPath of [
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), '..', '.env'),
  resolve(process.cwd(), '..', '..', '.env'),
]) {
  try {
    process.loadEnvFile(envPath);
  } catch {
    // Ignore missing env files.
  }
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    'DATABASE_URL is not set. Configure a valid PostgreSQL connection string in the current environment.',
  );
}

const pool = new Pool({
  connectionString,
  max: 5,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
});

function toNumber(value: unknown): number {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function normalizeImages(images: unknown): string[] {
  if (Array.isArray(images)) {
    return images.map((image) => String(image));
  }

  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.map((image) => String(image));
      }
    } catch {
      return [];
    }
  }

  return [];
}

function sellerFromRow(
  row: Partial<User> & { listings?: number | string | null },
): User {
  return {
    id: String(row.id ?? ''),
    name: String(row.name ?? ''),
    avatar: String(row.avatar ?? ''),
    rating: toNumber(row.rating),
    listings: toNumber(row.listings),
    location: String(row.location ?? ''),
    bio: String(row.bio ?? ''),
  };
}

function mapListing(row: Record<string, unknown>): Listing {
  const sellerValue = row.seller as Record<string, unknown> | undefined;
  const seller = sellerFromRow(
    (sellerValue ?? {}) as Partial<User> & {
      listings?: number | string | null;
    },
  );

  return {
    id: String(row.id ?? ''),
    title: String(row.title ?? ''),
    price: toNumber(row.price),
    category: String(row.category ?? 'Books') as ListingCategory,
    condition: String(row.condition ?? 'Good') as ListingCondition,
    tradeMode: String(row.trade_mode ?? 'Sell') as ListingTradeMode,
    swapWanted: String(row.swap_wanted ?? ''),
    status: String(row.status ?? 'Available') as ListingStatus,
    description: String(row.description ?? ''),
    location: String(row.location ?? ''),
    latitude:
      row.latitude === null || row.latitude === undefined
        ? null
        : toNumber(row.latitude),
    longitude:
      row.longitude === null || row.longitude === undefined
        ? null
        : toNumber(row.longitude),
    images: normalizeImages(row.images),
    seller,
    createdAt: row.created_at
      ? new Date(String(row.created_at)).toISOString()
      : new Date().toISOString(),
  };
}

export async function checkDatabase(): Promise<void> {
  const result = await pool.query('SELECT 1 AS ok');
  if (!result.rowCount || !result.rows[0]?.ok) {
    throw new Error('Database unavailable.');
  }
}

async function ensureSeedData(): Promise<void> {
  const existingListings = await pool.query(
    'SELECT COUNT(*)::int AS count FROM listings',
  );
  if ((existingListings.rows[0]?.count ?? 0) > 0) {
    return;
  }

  const users = [
    {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Ava Stone',
      avatar: '',
      rating: 4.8,
      location: 'Manchester',
      bio: 'Local vintage collector and community book lover.',
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Noah Park',
      avatar: '',
      rating: 4.6,
      location: 'Leeds',
      bio: 'Collects minimalist furniture and practical everyday finds.',
    },
  ];

  await pool.query(
    `INSERT INTO users (id, name, avatar, rating, location, bio) VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (id) DO NOTHING`,
    [
      users[0].id,
      users[0].name,
      users[0].avatar,
      users[0].rating,
      users[0].location,
      users[0].bio,
    ],
  );
  await pool.query(
    `INSERT INTO users (id, name, avatar, rating, location, bio) VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (id) DO NOTHING`,
    [
      users[1].id,
      users[1].name,
      users[1].avatar,
      users[1].rating,
      users[1].location,
      users[1].bio,
    ],
  );

  const listings = [
    {
      id: 'listing-1',
      seller_id: users[0].id,
      title: 'Vintage Illustrated Novel',
      price: 18.5,
      category: 'Books',
      condition: 'Like New',
      status: 'Available',
      description:
        'A gently loved illustrated novel with a bright cover and crisp pages.',
      location: 'Manchester',
      images: [
        'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&q=80',
      ],
    },
    {
      id: 'listing-2',
      seller_id: users[1].id,
      title: 'Solid Oak Side Table',
      price: 120,
      category: 'Clothing',
      condition: 'Good',
      status: 'Available',
      description:
        'A solid oak side table with a clean finish and subtle natural grain.',
      location: 'Leeds',
      images: [
        'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80',
      ],
    },
    {
      id: 'listing-3',
      seller_id: users[0].id,
      title: 'Wireless Headphones',
      price: 79.99,
      category: 'Books',
      condition: 'Good',
      status: 'Reserved',
      description:
        'Noise-cancelling headphones with a clean battery cycle and few signs of use.',
      location: 'Bristol',
      images: [
        'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=900&q=80',
      ],
    },
    {
      id: 'listing-4',
      seller_id: users[1].id,
      title: 'Handmade Ceramic Vase',
      price: 35,
      category: 'Clothing',
      condition: 'Like New',
      status: 'Available',
      description:
        'A handmade ceramic vase with an organic matte glaze and warm neutral tones.',
      location: 'London',
      images: [
        'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=900&q=80',
      ],
    },
  ];

  for (const listing of listings) {
    await pool.query(
      `INSERT INTO listings (id, seller_id, title, price, category, condition, status, description, location, images)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO NOTHING`,
      [
        listing.id,
        listing.seller_id,
        listing.title,
        listing.price,
        listing.category,
        listing.condition,
        listing.status,
        listing.description,
        listing.location,
        JSON.stringify(listing.images),
      ],
    );
  }
}

export async function getListings(): Promise<Listing[]> {
  await ensureSeedData();

  const { rows } = await pool.query(
    `
      SELECT
        l.id,
        l.title,
        l.price,
        l.category,
        l.condition,
        l.trade_mode,
        l.swap_wanted,
        l.status,
        l.description,
        l.location,
        l.latitude,
        l.longitude,
        l.images,
        l.created_at,
        json_build_object(
          'id', u.id,
          'name', u.name,
          'avatar', u.avatar,
          'rating', u.rating,
          'listings', COALESCE(seller_counts.total_listings, 0),
          'location', u.location,
          'bio', u.bio
        ) AS seller
      FROM listings l
      JOIN users u ON u.id = l.seller_id
      LEFT JOIN (
        SELECT seller_id, COUNT(*)::int AS total_listings
        FROM listings
        GROUP BY seller_id
      ) seller_counts ON seller_counts.seller_id = u.id
      ORDER BY l.created_at DESC
    `,
  );

  return rows.map((row) => mapListing(row));
}

export async function getListing(id: string): Promise<Listing | null> {
  const { rows } = await pool.query(
    `
      SELECT
        l.id,
        l.title,
        l.price,
        l.category,
        l.condition,
        l.trade_mode,
        l.swap_wanted,
        l.status,
        l.description,
        l.location,
        l.latitude,
        l.longitude,
        l.images,
        l.created_at,
        json_build_object(
          'id', u.id,
          'name', u.name,
          'avatar', u.avatar,
          'rating', u.rating,
          'listings', COALESCE(seller_counts.total_listings, 0),
          'location', u.location,
          'bio', u.bio
        ) AS seller
      FROM listings l
      JOIN users u ON u.id = l.seller_id
      LEFT JOIN (
        SELECT seller_id, COUNT(*)::int AS total_listings
        FROM listings
        GROUP BY seller_id
      ) seller_counts ON seller_counts.seller_id = u.id
      WHERE l.id = $1
    `,
    [id],
  );

  return rows[0] ? mapListing(rows[0]) : null;
}

export async function getListingsByIds(ids: string[]): Promise<Listing[]> {
  if (!ids.length) return [];

  const { rows } = await pool.query(
    `
      SELECT
        l.id,
        l.title,
        l.price,
        l.category,
        l.condition,
        l.trade_mode,
        l.swap_wanted,
        l.status,
        l.description,
        l.location,
        l.latitude,
        l.longitude,
        l.images,
        l.created_at,
        json_build_object(
          'id', u.id,
          'name', u.name,
          'avatar', u.avatar,
          'rating', u.rating,
          'listings', COALESCE(seller_counts.total_listings, 0),
          'location', u.location,
          'bio', u.bio
        ) AS seller
      FROM listings l
      JOIN users u ON u.id = l.seller_id
      LEFT JOIN (
        SELECT seller_id, COUNT(*)::int AS total_listings
        FROM listings
        GROUP BY seller_id
      ) seller_counts ON seller_counts.seller_id = u.id
      WHERE l.id = ANY($1::text[])
    `,
    [ids.slice(0, 1000)],
  );

  // Keep the caller's order (the search ranking).
  const byId = new Map(rows.map((row) => [String(row.id), mapListing(row)]));
  return ids.flatMap((id) => {
    const listing = byId.get(id);
    return listing ? [listing] : [];
  });
}

export async function getTransactionListingIds(
  transactionId: string,
): Promise<string[]> {
  const { rows } = await pool.query(
    `SELECT listing_id AS id FROM transactions WHERE id = $1
     UNION
     SELECT offered_listing_id FROM swaps WHERE transaction_id = $1`,
    [transactionId],
  );

  return rows.map((row) => String(row.id));
}

export async function getUser(id: string): Promise<User | null> {
  const { rows } = await pool.query(
    `
      SELECT
        u.id,
        u.name,
        u.avatar,
        u.rating,
        u.location,
        u.bio,
        COUNT(l.id)::int AS listings
      FROM users u
      LEFT JOIN listings l ON l.seller_id = u.id
      WHERE u.id = $1
      GROUP BY u.id
    `,
    [id],
  );

  if (!rows[0]) {
    return null;
  }

  return sellerFromRow(rows[0]);
}

export async function ensureUserProfile(input: {
  id: string;
  email?: string | null;
  name?: string | null;
}): Promise<void> {
  const metadataName = input.name?.trim();
  const emailName = input.email?.split('@')[0]?.trim();
  const name = metadataName || emailName || 'Community member';

  await pool.query(
    `INSERT INTO users (id, name, avatar, rating, location, bio)
     VALUES ($1, $2, '', 0, '', '')
     ON CONFLICT (id) DO UPDATE
     SET name = CASE
       WHEN users.name IN ('Local seller', 'Community member') THEN EXCLUDED.name
       ELSE users.name
     END`,
    [input.id, name],
  );
}

export async function getUserListings(id: string): Promise<Listing[]> {
  const { rows } = await pool.query(
    `
      SELECT
        l.id,
        l.title,
        l.price,
        l.category,
        l.condition,
        l.trade_mode,
        l.swap_wanted,
        l.status,
        l.description,
        l.location,
        l.latitude,
        l.longitude,
        l.images,
        l.created_at,
        json_build_object(
          'id', u.id,
          'name', u.name,
          'avatar', u.avatar,
          'rating', u.rating,
          'listings', COALESCE(seller_counts.total_listings, 0),
          'location', u.location,
          'bio', u.bio
        ) AS seller
      FROM listings l
      JOIN users u ON u.id = l.seller_id
      LEFT JOIN (
        SELECT seller_id, COUNT(*)::int AS total_listings
        FROM listings
        GROUP BY seller_id
      ) seller_counts ON seller_counts.seller_id = u.id
      WHERE l.seller_id = $1
      ORDER BY l.created_at DESC
    `,
    [id],
  );

  return rows.map((row) => mapListing(row));
}

export async function getSavedListingIds(userId: string): Promise<string[]> {
  const { rows } = await pool.query(
    'SELECT listing_id FROM saved_listings WHERE user_id = $1 ORDER BY created_at DESC',
    [userId],
  );

  return rows.map((row) => String(row.listing_id));
}

export async function getSavedListings(userId: string): Promise<Listing[]> {
  const { rows } = await pool.query(
    `
      SELECT
        l.id,
        l.title,
        l.price,
        l.category,
        l.condition,
        l.trade_mode,
        l.swap_wanted,
        l.status,
        l.description,
        l.location,
        l.latitude,
        l.longitude,
        l.images,
        l.created_at,
        json_build_object(
          'id', u.id,
          'name', u.name,
          'avatar', u.avatar,
          'rating', u.rating,
          'listings', COALESCE(seller_counts.total_listings, 0),
          'location', u.location,
          'bio', u.bio
        ) AS seller
      FROM saved_listings saved
      JOIN listings l ON l.id = saved.listing_id
      JOIN users u ON u.id = l.seller_id
      LEFT JOIN (
        SELECT seller_id, COUNT(*)::int AS total_listings
        FROM listings
        GROUP BY seller_id
      ) seller_counts ON seller_counts.seller_id = u.id
      WHERE saved.user_id = $1
      ORDER BY saved.created_at DESC
    `,
    [userId],
  );

  return rows.map((row) => mapListing(row));
}

export async function saveListing(
  userId: string,
  listingId: string,
): Promise<boolean> {
  const inserted = await pool.query(
    `INSERT INTO saved_listings (user_id, listing_id)
     SELECT $1, id FROM listings WHERE id = $2
     ON CONFLICT (user_id, listing_id) DO NOTHING
     RETURNING listing_id`,
    [userId, listingId],
  );

  if (inserted.rowCount) {
    return true;
  }

  const existingListing = await pool.query(
    'SELECT 1 FROM listings WHERE id = $1',
    [listingId],
  );
  return Boolean(existingListing.rowCount);
}

export async function unsaveListing(
  userId: string,
  listingId: string,
): Promise<void> {
  await pool.query(
    'DELETE FROM saved_listings WHERE user_id = $1 AND listing_id = $2',
    [userId, listingId],
  );
}

export async function createListing(input: {
  title: string;
  price: number;
  category: ListingCategory;
  condition: ListingCondition;
  tradeMode?: ListingTradeMode;
  swapWanted?: string;
  description: string;
  images: string[];
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  sellerId?: string;
}): Promise<{ id: string; status: ListingStatus }> {
  const sellerId = input.sellerId ?? '00000000-0000-0000-0000-000000000001';
  const listingId = randomUUID();

  await pool.query(
    `INSERT INTO users (id, name, avatar, rating, location, bio)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (id) DO NOTHING`,
    [
      sellerId,
      'Local seller',
      '',
      4.7,
      input.location || 'Manchester',
      'Community seller',
    ],
  );

  const { rows } = await pool.query(
    `INSERT INTO listings (id, seller_id, title, price, category, condition, trade_mode, swap_wanted, status, description, location, images, latitude, longitude)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
     RETURNING id, status`,
    [
      listingId,
      sellerId,
      input.title.trim(),
      Number(input.price),
      input.category,
      input.condition,
      input.tradeMode ?? 'Sell',
      input.swapWanted?.trim() ?? '',
      'Available',
      input.description.trim(),
      input.location.trim(),
      JSON.stringify(input.images),
      input.latitude ?? null,
      input.longitude ?? null,
    ],
  );

  const created = rows[0];
  return {
    id: String(created.id),
    status: created.status as ListingStatus,
  };
}

export async function updateListing(
  id: string,
  sellerId: string,
  input: {
    title: string;
    price: number;
    category: ListingCategory;
    condition: ListingCondition;
    tradeMode: ListingTradeMode;
    swapWanted: string;
    description: string;
    images: string[];
    location: string;
    latitude?: number | null;
    longitude?: number | null;
  },
): Promise<boolean> {
  const result = await pool.query(
    `UPDATE listings
     SET title = $3, price = $4, category = $5, condition = $6,
         trade_mode = $7, swap_wanted = $8, description = $9,
         images = $10, location = $11, latitude = $12, longitude = $13
     WHERE id = $1 AND seller_id = $2
     RETURNING id`,
    [
      id,
      sellerId,
      input.title.trim(),
      input.price,
      input.category,
      input.condition,
      input.tradeMode,
      input.swapWanted.trim(),
      input.description.trim(),
      JSON.stringify(input.images),
      input.location.trim(),
      input.latitude ?? null,
      input.longitude ?? null,
    ],
  );

  return Boolean(result.rowCount);
}

export async function deleteListing(
  id: string,
  sellerId: string,
): Promise<boolean> {
  const result = await pool.query(
    'DELETE FROM listings WHERE id = $1 AND seller_id = $2 RETURNING id',
    [id, sellerId],
  );

  return Boolean(result.rowCount);
}

export async function getMessages(userId: string): Promise<MessageThread[]> {
  const { rows } = await pool.query(
    `
      SELECT
        c.id,
        c.updated_at,
        other_user.id AS user_id,
        other_user.name AS user_name,
        other_user.avatar AS user_avatar,
        COALESCE((
          SELECT m.text
          FROM messages m
          WHERE m.conversation_id = c.id
          ORDER BY m.created_at DESC
          LIMIT 1
        ), '') AS last_message
      FROM conversations c
      JOIN users other_user ON other_user.id = CASE
        WHEN c.participant_one_id = $1 THEN c.participant_two_id
        ELSE c.participant_one_id
      END
      WHERE c.participant_one_id = $1 OR c.participant_two_id = $1
      ORDER BY c.updated_at DESC
    `,
    [userId],
  );

  return rows.map((row) => ({
    id: String(row.id),
    userId: String(row.user_id),
    userName: String(row.user_name),
    userAvatar: String(row.user_avatar ?? ''),
    lastMessage: String(row.last_message ?? ''),
    updatedAt: row.updated_at
      ? new Date(row.updated_at).toISOString()
      : new Date().toISOString(),
    status: 'Active',
    unread: 0,
  }));
}

export async function createMessage(payload: {
  senderId: string;
  receiverId: string;
  text: string;
}): Promise<{ conversationId: string; message: string } | null> {
  if (payload.senderId === payload.receiverId) {
    return null;
  }

  const participantOne = [payload.senderId, payload.receiverId].sort()[0];
  const participantTwo = [payload.senderId, payload.receiverId].sort()[1];
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const existingUsers = await client.query(
      'SELECT COUNT(*)::int AS count FROM users WHERE id IN ($1, $2)',
      [payload.senderId, payload.receiverId],
    );

    if ((existingUsers.rows[0]?.count ?? 0) < 2) {
      await client.query('ROLLBACK');
      return null;
    }

    const conversation = await client.query(
      `INSERT INTO conversations (id, participant_one_id, participant_two_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (participant_one_id, participant_two_id)
       DO UPDATE SET updated_at = now()
       RETURNING id`,
      [randomUUID(), participantOne, participantTwo],
    );
    const conversationId = String(conversation.rows[0].id);

    await client.query(
      'INSERT INTO messages (id, conversation_id, sender_id, receiver_id, text) VALUES ($1, $2, $3, $4, $5)',
      [
        randomUUID(),
        conversationId,
        payload.senderId,
        payload.receiverId,
        payload.text,
      ],
    );
    await client.query('COMMIT');

    return { conversationId, message: payload.text };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getConversation(
  conversationId: string,
  userId: string,
): Promise<MessageConversation | null> {
  const { rows } = await pool.query(
    `SELECT
       c.id AS conversation_id,
       other_user.id AS other_user_id,
       other_user.name AS other_user_name,
       other_user.avatar AS other_user_avatar,
       m.id AS message_id,
       m.sender_id,
       m.text,
       m.created_at
     FROM conversations c
     JOIN users other_user ON other_user.id = CASE
       WHEN c.participant_one_id = $2 THEN c.participant_two_id
       ELSE c.participant_one_id
     END
     LEFT JOIN messages m ON m.conversation_id = c.id
     WHERE c.id = $1 AND ($2 = c.participant_one_id OR $2 = c.participant_two_id)
     ORDER BY m.created_at ASC`,
    [conversationId, userId],
  );

  if (!rows.length) {
    return null;
  }

  const messages: ConversationMessage[] = rows
    .filter((row) => row.message_id)
    .map((row) => ({
      id: String(row.message_id),
      senderId: String(row.sender_id),
      text: String(row.text),
      createdAt: new Date(row.created_at).toISOString(),
    }));

  return {
    id: String(rows[0].conversation_id),
    otherUser: {
      id: String(rows[0].other_user_id),
      name: String(rows[0].other_user_name),
      avatar: String(rows[0].other_user_avatar ?? ''),
    },
    messages,
  };
}

export async function replyToConversation(input: {
  conversationId: string;
  senderId: string;
  text: string;
}): Promise<ConversationMessage | null> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const conversation = await client.query(
      `SELECT CASE
         WHEN participant_one_id = $2 THEN participant_two_id
         WHEN participant_two_id = $2 THEN participant_one_id
         ELSE NULL
       END AS receiver_id
       FROM conversations
       WHERE id = $1
       FOR UPDATE`,
      [input.conversationId, input.senderId],
    );
    const receiverId = conversation.rows[0]?.receiver_id;

    if (!receiverId) {
      await client.query('ROLLBACK');
      return null;
    }

    const inserted = await client.query(
      `INSERT INTO messages (id, conversation_id, sender_id, receiver_id, text)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, sender_id, text, created_at`,
      [
        randomUUID(),
        input.conversationId,
        input.senderId,
        receiverId,
        input.text,
      ],
    );
    await client.query(
      'UPDATE conversations SET updated_at = now() WHERE id = $1',
      [input.conversationId],
    );
    await client.query('COMMIT');

    const message = inserted.rows[0];
    return {
      id: String(message.id),
      senderId: String(message.sender_id),
      text: String(message.text),
      createdAt: new Date(message.created_at).toISOString(),
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getMarketplaceOffers(
  userId: string,
): Promise<MarketplaceOffer[]> {
  const { rows } = await pool.query(
    `SELECT
       o.id,
       o.listing_id,
       requested.title AS listing_title,
       requested.seller_id,
       seller.name AS seller_name,
       o.buyer_id,
       buyer.name AS buyer_name,
       o.offer_type,
       o.amount,
       o.swap_listing_id,
       offered.title AS swap_listing_title,
       o.message,
       o.status,
       t.id AS transaction_id,
       o.created_at
     FROM offers o
     JOIN listings requested ON requested.id = o.listing_id
     JOIN users seller ON seller.id = requested.seller_id
     JOIN users buyer ON buyer.id = o.buyer_id
     LEFT JOIN listings offered ON offered.id = o.swap_listing_id
     LEFT JOIN transactions t ON t.offer_id = o.id
     WHERE requested.seller_id = $1 OR o.buyer_id = $1
     ORDER BY o.created_at DESC`,
    [userId],
  );

  return rows.map((row) => ({
    id: String(row.id),
    listingId: String(row.listing_id),
    listingTitle: String(row.listing_title),
    sellerId: String(row.seller_id),
    sellerName: String(row.seller_name),
    buyerId: String(row.buyer_id),
    buyerName: String(row.buyer_name),
    offerType: row.offer_type as OfferType,
    amount: row.amount == null ? null : toNumber(row.amount),
    swapListingId:
      row.swap_listing_id == null ? null : String(row.swap_listing_id),
    swapListingTitle:
      row.swap_listing_title == null ? null : String(row.swap_listing_title),
    message: String(row.message ?? ''),
    status: row.status as OfferStatus,
    transactionId:
      row.transaction_id == null ? null : String(row.transaction_id),
    createdAt: new Date(row.created_at).toISOString(),
  }));
}

export async function createMarketplaceOffer(input: {
  listingId: string;
  buyerId: string;
  offerType: OfferType;
  amount: number | null;
  swapListingId: string | null;
  message: string;
}): Promise<string | null> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const requestedResult = await client.query(
      `SELECT seller_id, trade_mode, status
       FROM listings
       WHERE id = $1
       FOR UPDATE`,
      [input.listingId],
    );
    const requested = requestedResult.rows[0];

    if (
      !requested ||
      requested.seller_id === input.buyerId ||
      requested.status !== 'Available' ||
      (input.offerType === 'Purchase' &&
        !['Sell', 'Sell or swap'].includes(requested.trade_mode)) ||
      (input.offerType === 'Swap' &&
        !['Swap', 'Sell or swap'].includes(requested.trade_mode))
    ) {
      await client.query('ROLLBACK');
      return null;
    }

    if (
      input.offerType === 'Purchase' &&
      (!input.amount || input.amount <= 0)
    ) {
      await client.query('ROLLBACK');
      return null;
    }

    if (input.offerType === 'Swap') {
      if (!input.swapListingId || input.swapListingId === input.listingId) {
        await client.query('ROLLBACK');
        return null;
      }

      const offered = await client.query(
        `SELECT id, trade_mode
         FROM listings
         WHERE id = $1 AND seller_id = $2 AND status = 'Available'
         FOR UPDATE`,
        [input.swapListingId, input.buyerId],
      );

      if (
        !offered.rowCount ||
        !['Swap', 'Sell or swap'].includes(offered.rows[0].trade_mode)
      ) {
        await client.query('ROLLBACK');
        return null;
      }
    }

    const offerId = randomUUID();
    await client.query(
      `INSERT INTO offers (id, listing_id, buyer_id, offer_type, amount, swap_listing_id, message)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        offerId,
        input.listingId,
        input.buyerId,
        input.offerType,
        input.offerType === 'Purchase' ? input.amount : null,
        input.offerType === 'Swap' ? input.swapListingId : null,
        input.message.trim(),
      ],
    );
    await client.query('COMMIT');
    return offerId;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function respondToMarketplaceOffer(input: {
  offerId: string;
  sellerId: string;
  action: 'Accept' | 'Decline';
}): Promise<string | null | false> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await client.query(
      `SELECT o.*, l.seller_id, l.status AS listing_status
       FROM offers o
       JOIN listings l ON l.id = o.listing_id
       WHERE o.id = $1
       FOR UPDATE OF o, l`,
      [input.offerId],
    );
    const offer = result.rows[0];

    if (
      !offer ||
      offer.seller_id !== input.sellerId ||
      offer.status !== 'Pending'
    ) {
      await client.query('ROLLBACK');
      return false;
    }

    if (input.action === 'Decline') {
      await client.query(
        `UPDATE offers SET status = 'Declined', updated_at = now() WHERE id = $1`,
        [input.offerId],
      );
      await client.query('COMMIT');
      return null;
    }

    if (offer.listing_status !== 'Available') {
      await client.query('ROLLBACK');
      return false;
    }

    if (offer.offer_type === 'Swap') {
      const offered = await client.query(
        `SELECT id
         FROM listings
         WHERE id = $1 AND seller_id = $2 AND status = 'Available'
         FOR UPDATE`,
        [offer.swap_listing_id, offer.buyer_id],
      );
      if (!offered.rowCount) {
        await client.query('ROLLBACK');
        return false;
      }
    }

    const transactionId = randomUUID();
    await client.query(
      `INSERT INTO transactions
        (id, offer_id, listing_id, buyer_id, seller_id, transaction_type, amount)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        transactionId,
        input.offerId,
        offer.listing_id,
        offer.buyer_id,
        input.sellerId,
        offer.offer_type,
        offer.amount,
      ],
    );

    if (offer.offer_type === 'Swap') {
      await client.query(
        `INSERT INTO swaps (id, transaction_id, offer_id, requested_listing_id, offered_listing_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          randomUUID(),
          transactionId,
          input.offerId,
          offer.listing_id,
          offer.swap_listing_id,
        ],
      );
      await client.query(
        `UPDATE listings SET status = 'Reserved' WHERE id = $1 AND status = 'Available'`,
        [offer.swap_listing_id],
      );
    }

    await client.query(
      `UPDATE listings SET status = 'Reserved' WHERE id = $1 AND status = 'Available'`,
      [offer.listing_id],
    );
    await client.query(
      `UPDATE offers SET status = 'Accepted', updated_at = now() WHERE id = $1`,
      [input.offerId],
    );
    await client.query(
      `UPDATE offers SET status = 'Declined', updated_at = now()
       WHERE listing_id = $1 AND id <> $2 AND status = 'Pending'`,
      [offer.listing_id, input.offerId],
    );
    await client.query('COMMIT');
    return transactionId;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function withdrawMarketplaceOffer(
  offerId: string,
  buyerId: string,
): Promise<boolean> {
  const result = await pool.query(
    `UPDATE offers SET status = 'Withdrawn', updated_at = now()
     WHERE id = $1 AND buyer_id = $2 AND status = 'Pending'
     RETURNING id`,
    [offerId, buyerId],
  );
  return Boolean(result.rowCount);
}

export async function getMarketplaceTransactions(
  userId: string,
): Promise<MarketplaceTransaction[]> {
  const { rows } = await pool.query(
    `SELECT
       t.id,
       t.offer_id,
       t.listing_id,
       requested.title AS listing_title,
       t.transaction_type,
       t.amount,
       swap.offered_listing_id AS swap_listing_id,
       offered.title AS swap_listing_title,
       t.buyer_id,
       buyer.name AS buyer_name,
       t.seller_id,
       seller.name AS seller_name,
       t.status,
       t.completed_at,
       EXISTS (SELECT 1 FROM reviews r WHERE r.transaction_id = t.id AND r.reviewer_id = $1) AS reviewed_by_me
     FROM transactions t
     JOIN listings requested ON requested.id = t.listing_id
     JOIN users buyer ON buyer.id = t.buyer_id
     JOIN users seller ON seller.id = t.seller_id
     LEFT JOIN swaps swap ON swap.transaction_id = t.id
     LEFT JOIN listings offered ON offered.id = swap.offered_listing_id
     WHERE t.buyer_id = $1 OR t.seller_id = $1
     ORDER BY t.created_at DESC`,
    [userId],
  );

  return rows.map((row) => ({
    id: String(row.id),
    offerId: String(row.offer_id),
    listingId: String(row.listing_id),
    listingTitle: String(row.listing_title),
    transactionType: row.transaction_type as OfferType,
    amount: row.amount == null ? null : toNumber(row.amount),
    swapListingId:
      row.swap_listing_id == null ? null : String(row.swap_listing_id),
    swapListingTitle:
      row.swap_listing_title == null ? null : String(row.swap_listing_title),
    buyerId: String(row.buyer_id),
    buyerName: String(row.buyer_name),
    sellerId: String(row.seller_id),
    sellerName: String(row.seller_name),
    status: row.status as 'Pending' | 'Completed' | 'Cancelled',
    completedAt: row.completed_at
      ? new Date(row.completed_at).toISOString()
      : null,
    reviewedByMe: Boolean(row.reviewed_by_me),
  }));
}

export async function completeMarketplaceTransaction(
  transactionId: string,
  userId: string,
): Promise<boolean> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await client.query(
      `SELECT id, listing_id, transaction_type, status
       FROM transactions
       WHERE id = $1 AND (buyer_id = $2 OR seller_id = $2)
       FOR UPDATE`,
      [transactionId, userId],
    );
    const transaction = result.rows[0];
    if (!transaction || transaction.status !== 'Pending') {
      await client.query('ROLLBACK');
      return false;
    }

    await client.query(
      `UPDATE transactions SET status = 'Completed', completed_at = now() WHERE id = $1`,
      [transactionId],
    );
    await client.query(
      `UPDATE listings SET status = 'Sold'
       WHERE id IN (
         SELECT listing_id FROM transactions WHERE id = $1
         UNION
         SELECT offered_listing_id FROM swaps WHERE transaction_id = $1
       )`,
      [transactionId],
    );
    if (transaction.transaction_type === 'Swap') {
      await client.query(
        `UPDATE swaps SET status = 'Completed', completed_at = now() WHERE transaction_id = $1`,
        [transactionId],
      );
    }
    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function createMarketplaceReview(input: {
  transactionId: string;
  reviewerId: string;
  rating: number;
  comment: string;
}): Promise<string | null> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const transactionResult = await client.query(
      `SELECT buyer_id, seller_id, status
       FROM transactions
       WHERE id = $1 AND (buyer_id = $2 OR seller_id = $2)
       FOR UPDATE`,
      [input.transactionId, input.reviewerId],
    );
    const transaction = transactionResult.rows[0];
    if (!transaction || transaction.status !== 'Completed') {
      await client.query('ROLLBACK');
      return null;
    }

    const revieweeId =
      transaction.buyer_id === input.reviewerId
        ? transaction.seller_id
        : transaction.buyer_id;
    const reviewId = randomUUID();
    const inserted = await client.query(
      `INSERT INTO reviews (id, transaction_id, reviewer_id, reviewee_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (transaction_id, reviewer_id) DO NOTHING
       RETURNING id`,
      [
        reviewId,
        input.transactionId,
        input.reviewerId,
        revieweeId,
        input.rating,
        input.comment.trim(),
      ],
    );
    if (!inserted.rowCount) {
      await client.query('ROLLBACK');
      return null;
    }

    await client.query(
      `UPDATE users SET rating = (
         SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews WHERE reviewee_id = $1
       ) WHERE id = $1`,
      [revieweeId],
    );
    await client.query('COMMIT');
    return reviewId;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function createListingReport(input: {
  listingId: string;
  reporterId: string;
  reason: ListingReportReason;
  details: string;
}): Promise<string | null> {
  const result = await pool.query(
    `INSERT INTO listing_reports (id, listing_id, reporter_id, reason, details)
     SELECT $1, l.id, $2, $3, $4
     FROM listings l
     WHERE l.id = $5 AND l.seller_id <> $2
     ON CONFLICT (listing_id, reporter_id) WHERE status = 'Open' DO NOTHING
     RETURNING id`,
    [
      randomUUID(),
      input.reporterId,
      input.reason,
      input.details.trim(),
      input.listingId,
    ],
  );

  return result.rows[0] ? String(result.rows[0].id) : null;
}

export async function getListingReports(): Promise<ListingReport[]> {
  const { rows } = await pool.query(
    `SELECT
       r.id,
       r.listing_id,
       l.title AS listing_title,
       r.reporter_id,
       u.name AS reporter_name,
       r.reason,
       r.details,
       r.status,
       r.created_at
     FROM listing_reports r
     JOIN listings l ON l.id = r.listing_id
     JOIN users u ON u.id = r.reporter_id
     ORDER BY CASE WHEN r.status = 'Open' THEN 0 ELSE 1 END, r.created_at DESC`,
  );

  return rows.map((row) => ({
    id: String(row.id),
    listingId: String(row.listing_id),
    listingTitle: String(row.listing_title),
    reporterId: String(row.reporter_id),
    reporterName: String(row.reporter_name),
    reason: row.reason as ListingReportReason,
    details: String(row.details ?? ''),
    status: row.status as ListingReportStatus,
    createdAt: new Date(row.created_at).toISOString(),
  }));
}

export async function updateListingReportStatus(input: {
  reportId: string;
  moderatorId: string;
  status: Exclude<ListingReportStatus, 'Open'>;
}): Promise<boolean> {
  const result = await pool.query(
    `UPDATE listing_reports
     SET status = $3, reviewed_by = $2, reviewed_at = now()
     WHERE id = $1 AND status = 'Open'
     RETURNING id`,
    [input.reportId, input.moderatorId, input.status],
  );

  return Boolean(result.rowCount);
}
