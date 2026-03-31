// Firebase Auth Context
// Ye context poore app me user ki login state manage karta hai
// Har component isse use karke user info le sakta hai

"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { saveUserProfile } from "@/lib/firebaseService";

// Context ka type - kya kya milega components ko
type AuthContextValue = {
  user: User | null;           // Current logged-in user (null = not logged in)
  loading: boolean;            // Auth check ho raha hai ya nahi
  error: string | null;        // Koi error aai to yahan dikhegi
  signInWithGoogle: () => Promise<void>;  // Google se login karo
  signOut: () => Promise<void>;           // Logout karo
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Jab app load ho, Firebase se check karo ki user logged in hai ya nahi
  useEffect(() => {
    // Agar auth available nahi hai (SSR ya config missing) to loading band karo
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setUser(firebaseUser);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Auth state error:", err);
        setError("Login check failed. Please refresh.");
        setLoading(false);
      }
    );

    // Cleanup: jab component unmount ho to listener band karo
    return () => unsubscribe();
  }, []);

  // Google se sign in karo
  const signInWithGoogle = async () => {
    if (!auth) {
      setError("Firebase not initialized. Check your config.");
      return;
    }
    try {
      setError(null);
      const result = await signInWithPopup(auth, googleProvider);
      const u = result.user;
      // Save full user profile to Firestore
      await saveUserProfile(u.uid, {
        displayName: u.displayName,
        email: u.email,
        photoURL: u.photoURL,
        phoneNumber: u.phoneNumber,
        emailVerified: u.emailVerified,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Google sign-in failed";
      // Agar user ne popup band kiya to error mat dikhao
      if (message.includes("popup-closed-by-user")) return;
      console.error("Sign-in error:", message);
      setError("Sign-in failed. Please try again.");
    }
  };

  // Logout karo
  const signOut = async () => {
    if (!auth) return;
    try {
      setError(null);
      await firebaseSignOut(auth);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Sign-out failed";
      console.error("Sign-out error:", message);
      setError("Sign-out failed. Please try again.");
    }
  };

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, error, signInWithGoogle, signOut }),
    [user, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook - koi bhi component isse call karke auth info le sakta hai
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
