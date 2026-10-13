import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Pool } from 'pg';
import { createListing, getListings, getUser } from './database';

const connectionString =
  process.env.DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5432/zhelf';
const pool = new Pool({ connectionString });

describe('database listing flow', () => {
  beforeAll(async () => {
    await pool.query('DELETE FROM messages');
    await pool.query('DELETE FROM conversations');
    await pool.query('DELETE FROM listings');
    await pool.query('DELETE FROM users');
  });

  afterAll(async () => {
    await pool.end();
  });

  it('creates a listing and exposes it in the marketplace feed', async () => {
    const demoUserId = '00000000-0000-0000-0000-000000000001';

    await pool.query(
      `INSERT INTO users (id, name, avatar, rating, location, bio)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO NOTHING`,
      [
        demoUserId,
        'Ava Stone',
        '',
        4.8,
        'Manchester',
        'Local vintage collector',
      ],
    );

    const result = await createListing({
      title: 'Desk lamp',
      price: 79.99,
      category: 'Books',
      condition: 'Good',
      description: 'A compact desk lamp with warm light.',
      images: ['https://example.com/lamp.jpg'],
      location: 'Manchester',
      sellerId: demoUserId,
    });

    expect(result.status).toBe('Available');
    expect(result.id).toBeTruthy();

    const listings = await getListings();
    expect(listings.some((listing) => listing.title === 'Desk lamp')).toBe(
      true,
    );

    const user = await getUser(demoUserId);
    expect(user?.name).toBe('Ava Stone');
  });
});
