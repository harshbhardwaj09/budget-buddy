"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
              className={`rounded-full px-4 py-2 font-semibold transition ${
                pathname === "/"
                  ? "bg-indigo-600 text-white shadow"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/insights"
              className={`rounded-full px-4 py-2 font-semibold transition ${
                pathname === "/insights"
                  ? "bg-indigo-600 text-white shadow"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              Insights
            </Link>
            <ThemeToggle />
          </div>
        </div>

        {stats && stats.length > 0 ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            {stats.map((stat) => (
              <span
                key={stat.label}
                className="rounded-full bg-slate-900/5 px-3 py-1 font-medium text-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
              >
                <span className="font-semibold text-slate-900 dark:text-slate-50">
                  {stat.value}
                </span>
                <span className="ml-1">{stat.label}</span>
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </header>
  );
}
