"use client";
// AuthGuard ka kaam: protected page ko sirf logged-in user ko dikhana.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  // Router use hota hai redirect karne ke liye.
  const router = useRouter();
  // Session status se pata chalta hai user logged-in hai ya nahi.
  const { status } = useSession();

  useEffect(() => {
    // Agar user logged-in nahi hai to login page pe bhej do.
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  // Session check hote time loading state dikhao.
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-slate-600 dark:text-slate-300">
        Checking login...
      </div>
    );
  }

  // Redirect trigger ho chuka hota hai, tab tak kuch render na karo.
  if (status === "unauthenticated") {
    return null;
  }

  // User authenticated hai, to protected content render karo.
  return <>{children}</>;
}
