"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import ThemeToggle from "@/components/ThemeToggle";

type Stat = {
  label: string;
  value: React.ReactNode;
};

type AppHeaderProps = {
  title: string;
  subtitle: string;
  stats?: Stat[];
};

export default function AppHeader({ title, subtitle, stats }: AppHeaderProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-20 border-b border-white/40 bg-[var(--card)]/80 backdrop-blur dark:border-slate-800 dark:bg-[var(--card)]/80">
      <div className="mx-auto max-w-6xl px-6 py-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
              {title}
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Link
              href="/"
              className={`rounded-full px-4 py-2 font-semibold ${
                pathname === "/"
                  ? "bg-indigo-600 text-white shadow"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/insights"
              className={`rounded-full px-4 py-2 font-semibold ${
                pathname === "/insights"
                  ? "bg-indigo-600 text-white shadow"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              Insights
            </Link>
            <ThemeToggle />

            {session?.user && (
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 pl-1 pr-3 py-1 shadow-sm dark:border-slate-600 dark:bg-slate-800/70">
                {session.user.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name ?? "User"}
                    width={28}
                    height={28}
                    className="rounded-full"
                  />
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                    {(session.user.name ?? "U")[0].toUpperCase()}
                  </span>
                )}
                <span className="max-w-[120px] truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                  {session.user.name}
                </span>
              </div>
            )}

            {session && (
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-red-50 hover:text-red-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-red-900/30 dark:hover:text-red-400"
              >
                Sign out
              </button>
            )}
          </div>
        </div>

      </div>
    </header>
  );
}
