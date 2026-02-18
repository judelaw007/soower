import {
  signInAnonymously,
  signInWithCustomToken,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  Unsubscribe
} from 'firebase/auth';
import { auth } from '../config/firebase';

/**
 * Sign in anonymously (for guest users)
 */
export async function signInAsGuest(): Promise<User> {
  const result = await signInAnonymously(auth);
  return result.user;
}

/**
 * Sign in with custom token (from backend)
 */
export async function signInWithToken(token: string): Promise<User> {
  const result = await signInWithCustomToken(auth, token);
  return result.user;
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

/**
 * Subscribe to auth state changes
 */
export function subscribeToAuthState(
  onUser: (user: User | null) => void
): Unsubscribe {
  return onAuthStateChanged(auth, onUser);
}

/**
 * Get current user (synchronous)
 */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}
