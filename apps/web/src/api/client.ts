import type {
  Listing,
  ListingCreateInput,
  MessageConversation,
  ListingStatus,
  MarketplaceOffer,
  MarketplaceTransaction,
  MessageThread,
  User,
} from '@zhelf/shared';
import type { ApiClient } from './types';

type ApiErrorBody = { error?: { message?: string } };

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function baseUrl(): string {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api';
  }
  return (
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    'http://127.0.0.1:3000/api'
  );
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl()}${path}`, {
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    ...init,
  });

  if (!response.ok) {
    const body = (await response
      .json()
      .catch(() => null)) as ApiErrorBody | null;
    throw new ApiError(
      response.status,
      body?.error?.message ?? response.statusText,
    );
  }

  return response.json() as Promise<T>;
}

export const liveClient: ApiClient = {
  async getHealth() {
    return request('/health');
  },
  async getListings() {
    const result = await request<{ items: Listing[] }>('/listings');
    return result.items;
  },
  async getListing(id) {
    try {
      const result = await request<{ listing: Listing }>(
        `/listings/${encodeURIComponent(id)}`,
      );
      return result.listing;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },
  async getUser(id) {
    return request<{ user: User; listings: Listing[] }>(
      `/users/${encodeURIComponent(id)}`,
    );
  },
  async getSavedListings() {
    const result = await request<{ items: Listing[] }>('/saved-listings');
    return result.items;
  },
  async saveListing(id) {
    await request('/saved-listings', {
      method: 'POST',
      body: JSON.stringify({ listingId: id }),
    });
  },
  async unsaveListing(id) {
    await request(`/saved-listings/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },
  async createListing(input: ListingCreateInput) {
    return request<{ id: string; status: ListingStatus }>('/listings', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  async updateListing(id, input) {
    return request<{ id: string }>(`/listings/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },
  async deleteListing(id) {
    return request<{ id: string }>(`/listings/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },
  async getMessages() {
    const result = await request<{ threads: MessageThread[] }>('/messages');
    return result.threads;
  },
  async getConversation(id) {
    const result = await request<{ conversation: MessageConversation }>(
      `/messages/${encodeURIComponent(id)}`,
    );
    return result.conversation;
  },
  async createMessage(payload) {
    return request('/messages', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  async replyToConversation(id, text) {
    return request(`/messages/${encodeURIComponent(id)}`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },
  async getMarketplaceOffers() {
    const result = await request<{ offers: MarketplaceOffer[] }>('/offers');
    return result.offers;
  },
  async createMarketplaceOffer(input) {
    return request<{ id: string }>('/offers', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  async updateMarketplaceOffer(id, action) {
    return request<{ transactionId: string | null }>(
      `/offers/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ action }),
      },
    );
  },
  async getMarketplaceTransactions() {
    const result = await request<{ transactions: MarketplaceTransaction[] }>(
      '/transactions',
    );
    return result.transactions;
  },
  async completeMarketplaceTransaction(id) {
    return request<{ id: string }>(`/transactions/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'Complete' }),
    });
  },
  async createMarketplaceReview(input) {
    return request<{ id: string }>('/reviews', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
};
