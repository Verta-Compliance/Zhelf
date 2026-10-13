import type {
  Listing,
  ListingCategory,
  ListingCondition,
  ListingCreateInput,
  ListingStatus,
  MarketplaceOffer,
  MarketplaceTransaction,
  MessageConversation,
  MessageThread,
  User,
} from '@zhelf/shared';

export interface ApiClient {
  getHealth(): Promise<{ status: string; services: string[] }>;
  getListings(): Promise<Listing[]>;
  getListing(id: string): Promise<Listing | null>;
  getUser(id: string): Promise<{ user: User; listings: Listing[] }>;
  getSavedListings(): Promise<Listing[]>;
  saveListing(id: string): Promise<void>;
  unsaveListing(id: string): Promise<void>;
  createListing(
    input: ListingCreateInput,
  ): Promise<{ id: string; status: ListingStatus }>;
  updateListing(id: string, input: ListingCreateInput): Promise<{ id: string }>;
  deleteListing(id: string): Promise<{ id: string }>;
  getMessages(): Promise<MessageThread[]>;
  getConversation(id: string): Promise<MessageConversation>;
  createMessage(payload: {
    receiverId: string;
    text: string;
  }): Promise<{ conversationId: string; message: string }>;
  replyToConversation(
    id: string,
    text: string,
  ): Promise<{ id: string; senderId: string; text: string; createdAt: string }>;
  getMarketplaceOffers(): Promise<MarketplaceOffer[]>;
  createMarketplaceOffer(input: {
    listingId: string;
    offerType: 'Purchase' | 'Swap';
    amount: number | null;
    swapListingId: string | null;
    message: string;
  }): Promise<{ id: string }>;
  updateMarketplaceOffer(
    id: string,
    action: 'Accept' | 'Decline' | 'Withdraw',
  ): Promise<{ transactionId: string | null }>;
  getMarketplaceTransactions(): Promise<MarketplaceTransaction[]>;
  completeMarketplaceTransaction(id: string): Promise<{ id: string }>;
  createMarketplaceReview(input: {
    transactionId: string;
    rating: number;
    comment: string;
  }): Promise<{ id: string }>;
}

export type { ListingCategory, ListingCondition };
