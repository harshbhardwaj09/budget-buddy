"use client";

import { useMemo } from "react";
import { useBudget } from "@/context/BudgetContext";
import { formatCurrency, formatDate } from "@/lib/formatters";
import AppHeader from "@/components/AppHeader";

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as start of week
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function weekLabel(weekStart: Date) {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  return `${formatDate(weekStart.toISOString().slice(0, 10))} – ${formatDate(
    weekEnd.toISOString().slice(0, 10)
  )}`;
}

function monthLabel(date: Date) {
  return date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

export default function ExpenseInsights() {
  const { expenses } = useBudget();

  const now = new Date();

  const weeklyTotals = useMemo(() => {
    const weeks: Record<string, number> = {};
    const maxWeeks = 5;

    const thisWeekStart = startOfWeek(now);
    for (let i = 0; i < maxWeeks; i += 1) {
      const weekStart = new Date(thisWeekStart);
      weekStart.setDate(thisWeekStart.getDate() - 7 * i);
      weeks[weekStart.toISOString()] = 0;
    }

    expenses.forEach((expense) => {
      const date = new Date(expense.date);
      const weekStart = startOfWeek(date);
      const key = weekStart.toISOString();

      if (key in weeks) {
        weeks[key] += expense.amount;
      }
    });

    const entries = Object.entries(weeks).map(([key, value]) => ({
      weekStart: new Date(key),
      total: value,
    }));

    entries.sort((a, b) => b.weekStart.getTime() - a.weekStart.getTime());
    return entries;
  }, [expenses, now]);

  const monthlyTotals = useMemo(() => {
    const map: Record<string, number> = {};
    const monthsToShow = 6;

    for (let i = 0; i < monthsToShow; i += 1) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      map[month.toISOString()] = 0;
    }

    expenses.forEach((expense) => {
      const date = new Date(expense.date);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const key = monthStart.toISOString();
      if (key in map) {
        map[key] += expense.amount;
      }
    });

    const entries = Object.entries(map).map(([key, value]) => ({
      monthStart: new Date(key),
      total: value,
    }));

    entries.sort((a, b) => b.monthStart.getTime() - a.monthStart.getTime());
    return entries;
  }, [expenses, now]);

  const maxWeekly = Math.max(...weeklyTotals.map((entry) => entry.total), 0);
  const maxMonthly = Math.max(...monthlyTotals.map((entry) => entry.total), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-sky-50 to-indigo-50 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950">
      <AppHeader
        title="Spending Insights"
        subtitle="See how your spending trends over recent weeks and months."
        stats={[
          { label: "transactions", value: expenses.length },
          { label: "spent", value: formatCurrency(expenses.reduce((sum, e) => sum + e.amount, 0)) },
        ]}
      />

      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200/70 bg-[var(--card)] p-6 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-[var(--card)]/60">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              Weekly spending
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
              Last {weeklyTotals.length} weeks (Monday to Sunday).
            </p>

            <div className="mt-6 space-y-4">
              {weeklyTotals.map(({ weekStart, total }) => {
                const widthPercent = maxWeekly === 0 ? 0 : (total / maxWeekly) * 100;
                return (
                  <div key={weekStart.toISOString()} className="flex items-center gap-4">
                    <div className="min-w-[160px] text-sm text-slate-600 dark:text-slate-300">
                      {weekLabel(weekStart)}
                    </div>
                    <div className="relative flex-1">
                      <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-3 rounded-full bg-indigo-500"
                          style={{ width: `${widthPercent}%` }}
                        />
                      </div>
                      <div className="absolute right-0 top-0 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        {formatCurrency(total)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/70 bg-[var(--card)] p-6 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-[var(--card)]/60">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              Monthly spending
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
              Last {monthlyTotals.length} months.
            </p>

            <div className="mt-6 space-y-4">
              {monthlyTotals.map(({ monthStart, total }) => {
                const widthPercent = maxMonthly === 0 ? 0 : (total / maxMonthly) * 100;
                return (
                  <div key={monthStart.toISOString()} className="flex items-center gap-4">
                    <div className="min-w-[140px] text-sm text-slate-600 dark:text-slate-300">
                      {monthLabel(monthStart)}
                    </div>
                    <div className="relative flex-1">
                      <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-3 rounded-full bg-emerald-500"
                          style={{ width: `${widthPercent}%` }}
                        />
                      </div>
                      <div className="absolute right-0 top-0 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        {formatCurrency(total)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-slate-200/70 bg-[var(--card)] p-6 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-[var(--card)]/60">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            Expense log
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
            See all transactions recorded so far.
          </p>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
            <table className="w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-950">
                <tr>
                  <th className="px-4 py-4 font-medium text-slate-600 dark:text-slate-300 sm:px-6">Date</th>
                  <th className="px-4 py-4 font-medium text-slate-600 dark:text-slate-300 sm:px-6">Description</th>
                  <th className="px-4 py-4 font-medium text-slate-600 dark:text-slate-300 sm:px-6">Category</th>
                  <th className="px-4 py-4 font-medium text-slate-600 dark:text-slate-300 sm:px-6">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-950">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-slate-500 dark:text-slate-400 sm:px-6">
                      No expenses yet. Add an expense on the dashboard.
                    </td>
                  </tr>
                ) : (
                  expenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                      <td className="px-4 py-4 text-slate-600 dark:text-slate-300 sm:px-6">
                        {formatDate(expense.date)}
                      </td>
                      <td className="px-4 py-4 text-slate-900 dark:text-slate-100 sm:px-6">
                        {expense.description}
                      </td>
                      <td className="px-4 py-4 sm:px-6">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-900 dark:text-slate-100 sm:px-6">
                        {formatCurrency(expense.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/40 bg-[var(--card)] py-6 dark:border-slate-700 dark:bg-[var(--card)]/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 text-sm text-slate-500 dark:text-slate-400">
          <p>
            Developed by Harsh Bhardwaj —
            <a
              href="https://my-portfolio-harsh-bhardwaj.vercel.app/"
              target="_blank"
              rel="noreferrer"
              className="ml-1 font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-300"
            >
              Portfolio
            </a>
          </p>
          <p>© {new Date().getFullYear()} Budget Buddy</p>
        </div>
      </footer>
    </div>
  );
}
