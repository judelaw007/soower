import {
  collection,
  doc,
  getDocs,
  addDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  Unsubscribe
} from 'firebase/firestore';
import { db, APP_ID } from '../config/firebase';
import { Campaign, Donation } from '../types';

// ============================================================================
// FIRESTORE PATH STRUCTURE
// ============================================================================
//
// Public data (campaigns):
//   /artifacts/{APP_ID}/public/data/campaigns/{campaignId}
//
// User private data (donations):
//   /artifacts/{APP_ID}/users/{userId}/donations/{donationId}
//
// ============================================================================

/**
 * Subscribe to campaigns collection
 */
export function subscribeToCampaigns(
  onData: (campaigns: Campaign[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  const campaignsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'campaigns');

  return onSnapshot(
    campaignsRef,
    (snapshot) => {
      const campaigns = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Campaign[];
      onData(campaigns);
    },
    onError
  );
}

/**
 * Subscribe to user's donations
 */
export function subscribeToUserDonations(
  userId: string,
  onData: (donations: Donation[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  const donationsRef = collection(db, 'artifacts', APP_ID, 'users', userId, 'donations');

  return onSnapshot(
    donationsRef,
    (snapshot) => {
      const donations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Donation[];

      // Sort by timestamp descending
      donations.sort((a, b) =>
        (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)
      );

      onData(donations);
    },
    onError
  );
}

/**
 * Record a new donation
 */
export async function createDonation(
  userId: string,
  campaignId: string,
  campaignTitle: string,
  amount: number,
  paymentMethod: 'card' | 'transfer'
): Promise<string> {
  const donationsRef = collection(db, 'artifacts', APP_ID, 'users', userId, 'donations');

  const donationData = {
    amount,
    campaignId,
    campaignTitle,
    status: 'completed',
    paymentMethod,
    timestamp: serverTimestamp()
  };

  const docRef = await addDoc(donationsRef, donationData);
  return docRef.id;
}

/**
 * Get all campaigns (one-time fetch)
 */
export async function getCampaigns(): Promise<Campaign[]> {
  const campaignsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'campaigns');
  const snapshot = await getDocs(campaignsRef);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Campaign[];
}
