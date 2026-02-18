import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ============================================================================
// FIREBASE CONFIGURATION
// ============================================================================
//
// TODO: Replace these placeholder values with your actual Firebase config
//
// To get your config:
// 1. Go to https://console.firebase.google.com/
// 2. Create a new project named "Soweer" (or use existing)
// 3. Click the gear icon > Project settings
// 4. Scroll down to "Your apps" section
// 5. Click "Add app" > Web (</>) icon
// 6. Register app with nickname "soweer-mobile"
// 7. Copy the firebaseConfig values below
//
// ============================================================================

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence for React Native
let auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
}

// Initialize Firestore
const db = getFirestore(app);

// App ID for Firestore paths (used in data structure)
export const APP_ID = 'soweer-app';

export { app, auth, db };
