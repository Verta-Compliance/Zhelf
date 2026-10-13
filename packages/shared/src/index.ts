export type ListingCategory = 'Books' | 'Clothing';
export type ListingCondition = 'Like New' | 'Good' | 'Acceptable' | 'Used';
export type ListingStatus = 'Available' | 'Reserved' | 'Sold';
export type ListingTradeMode = 'Sell' | 'Swap' | 'Sell or swap';

export interface User {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  listings: number;
  location: string;
  bio: string;
}

export interface Listing {
  id: string;
  title: string;
  price: number;
  category: ListingCategory;
  condition: ListingCondition;
  tradeMode: ListingTradeMode;
  swapWanted: string;
  status: ListingStatus;
  description: string;
  location: string;
  images: string[];
  seller: User;
  createdAt: string;
}

export interface MessageThread {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  lastMessage: string;
  updatedAt: string;
  status: 'Active' | 'Archived';
  unread: number;
}

export interface ConversationMessage {
  id: string;
  senderId: string;
  text: string;
  createdAt: string;
}

export interface MessageConversation {
  id: string;
  otherUser: Pick<User, 'id' | 'name' | 'avatar'>;
  messages: ConversationMessage[];
}

export type OfferType = 'Purchase' | 'Swap';
export type OfferStatus =
  | 'Pending'
  | 'Accepted'
  | 'Declined'
  | 'Withdrawn'
  | 'Expired';
export type TransactionStatus = 'Pending' | 'Completed' | 'Cancelled';
export type ListingReportReason =
  | 'Spam'
  | 'Prohibited item'
  | 'Fraud or scam'
  | 'Harassment'
  | 'Other';
export type ListingReportStatus = 'Open' | 'Resolved' | 'Dismissed';

export interface ListingReport {
  id: string;
  listingId: string;
  listingTitle: string;
  reporterId: string;
  reporterName: string;
  reason: ListingReportReason;
  details: string;
  status: ListingReportStatus;
  createdAt: string;
}

export interface MarketplaceOffer {
  id: string;
  listingId: string;
  listingTitle: string;
  sellerId: string;
  sellerName: string;
  buyerId: string;
  buyerName: string;
  offerType: OfferType;
  amount: number | null;
  swapListingId: string | null;
  swapListingTitle: string | null;
  message: string;
  status: OfferStatus;
  transactionId: string | null;
  createdAt: string;
}

export interface MarketplaceTransaction {
  id: string;
  offerId: string;
  listingId: string;
  listingTitle: string;
  transactionType: OfferType;
  amount: number | null;
  swapListingId: string | null;
  swapListingTitle: string | null;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  status: TransactionStatus;
  completedAt: string | null;
  reviewedByMe: boolean;
}

export interface ListingCreateInput {
  title: string;
  category: ListingCategory;
  price: number;
  condition: ListingCondition;
  tradeMode: ListingTradeMode;
  swapWanted: string;
  description: string;
  images: string[];
  location: string;
}
