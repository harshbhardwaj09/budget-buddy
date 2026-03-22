"use client";
// AuthGuard ka kaam: protected page ko sirf logged-in user ko dikhana.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Agar user logged-in nahi hai to login page pe bhej do.
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  // Auth check hote time loading state dikhao.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-slate-600 dark:text-slate-300">
        Checking login...
      </div>
    );
  }

  // User logged in nahi hai - redirect ho raha hai.
  if (!user) {
    return null;
  }

  // User authenticated hai, to protected content render karo.
  return <>{children}</>;
}
