// Firebase App + Auth + Firestore initialization
// Ye file sirf ek baar Firebase ko initialize karti hai aur export karti hai
// Client-side pe hi kaam karti hai (SSR/build me skip hoti hai)

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// Firebase config - .env.local me values rakhna
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Safe initialization - build time pe crash nahi karega
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

// Sirf browser me aur jab API key available ho tabhi initialize karo
if (typeof window !== "undefined" && firebaseConfig.apiKey) {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

// Google provider - Google sign-in ke liye
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider };
