import { Timestamp } from 'firebase/firestore';

export interface Campaign {
  id: string;
  title: string;
  category: string;
  description: string;
  image: string;
  color: string;
  icon?: string;
  isActive?: boolean;
  createdAt?: Timestamp;
}

export interface Donation {
  id: string;
  amount: number;
  campaignId: string;
  campaignTitle: string;
  status: 'pending' | 'completed' | 'failed';
  paymentMethod: 'card' | 'transfer';
  timestamp: Timestamp;
}

export interface UserProfile {
  uid: string;
  email?: string;
  displayName?: string;
  isAnonymous: boolean;
  level: number;
  createdAt?: Timestamp;
}

export type PaymentMethod = 'card' | 'transfer';

export type TabName = 'home' | 'history' | 'profile';
