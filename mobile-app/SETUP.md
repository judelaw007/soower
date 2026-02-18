# Soweer Mobile App Setup

## Prerequisites
- Node.js 18+ installed
- Expo Go app on your phone (for testing)
- Firebase account

---

## 1. Firebase Project Setup

### Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"**
3. Enter project name: `Soweer`
4. Disable Google Analytics (optional for now)
5. Click **Create project**

### Enable Authentication

1. In Firebase Console, go to **Build > Authentication**
2. Click **Get started**
3. Go to **Sign-in method** tab
4. Enable **Anonymous** sign-in (for guest users)
5. (Optional) Enable **Email/Password** for registered users

### Enable Firestore Database

1. Go to **Build > Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (we'll add rules later)
4. Select a location close to your users (e.g., `europe-west2` for UK/Nigeria)
5. Click **Enable**

### Get Firebase Config

1. Go to **Project settings** (gear icon)
2. Scroll to **Your apps** section
3. Click **Add app** > **Web** (`</>` icon)
4. Register app with nickname: `soweer-mobile`
5. Copy the `firebaseConfig` object

---

## 2. Configure the App

Open `src/config/firebase.ts` and replace the placeholder values:

```typescript
const firebaseConfig = {
  apiKey: "AIzaSy...",           // Your API key
  authDomain: "soweer-xxxxx.firebaseapp.com",
  projectId: "soweer-xxxxx",
  storageBucket: "soweer-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

---

## 3. Firestore Security Rules

In Firebase Console > Firestore > Rules, add:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Public campaigns - anyone can read
    match /artifacts/{appId}/public/data/campaigns/{campaignId} {
      allow read: if true;
      allow write: if false; // Admin only (via Admin Console)
    }

    // User private data - only owner can read/write
    match /artifacts/{appId}/users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Click **Publish**.

---

## 4. Run the App

```bash
# Navigate to mobile-app folder
cd mobile-app

# Start Expo development server
npm start
```

Options:
- Press `a` - Open on Android (Expo Go required)
- Press `i` - Open on iOS (Mac only)
- Press `w` - Open in web browser
- Scan QR code with Expo Go app

---

## 5. Seed Initial Campaigns (Optional)

In Firebase Console > Firestore, manually add campaigns:

**Collection path:** `artifacts/soweer-app/public/data/campaigns`

Add documents with fields:
```json
{
  "title": "Widow Care",
  "category": "Relief & Support",
  "description": "Sustaining widows through financial aid...",
  "image": "https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8",
  "color": "bg-rose-500",
  "icon": "heart"
}
```

---

## Project Structure

```
mobile-app/
├── App.tsx                 # Entry point
├── app.json               # Expo config
├── src/
│   ├── config/
│   │   ├── firebase.ts    # Firebase configuration
│   │   └── mockData.ts    # Fallback campaign data
│   ├── services/
│   │   ├── auth.ts        # Authentication functions
│   │   └── firestore.ts   # Database operations
│   ├── types/
│   │   └── index.ts       # TypeScript definitions
│   ├── components/        # Reusable UI components
│   ├── screens/           # Screen components
│   └── hooks/             # Custom React hooks
└── assets/                # Images, fonts, etc.
```

---

## Next Steps

1. Configure Firebase (above steps)
2. Test anonymous sign-in works
3. Add campaigns via Admin Console (or Firestore directly)
4. Build out screens based on prototype (`src/App.prototype.jsx`)

---

## Troubleshooting

**"Firebase: Error (auth/configuration-not-found)"**
- Check your Firebase config values are correct
- Ensure Anonymous auth is enabled in Firebase Console

**"Missing or insufficient permissions"**
- Update Firestore security rules (see step 3)
- Ensure user is authenticated before accessing data

**Metro bundler issues**
- Run `npx expo start --clear` to clear cache
