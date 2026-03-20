"use client";

import { useMemo, useState } from "react";
import { useBudget } from "@/context/BudgetContext";
import { formatCurrency, formatDate } from "@/lib/formatters";
import AppHeader from "@/components/AppHeader";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function monthLabel(date: Date) {
  return date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

export default function ExpenseInsights() {
  const { expenses } = useBudget();

  const today = new Date();
  const defaultFrom = new Date();
  defaultFrom.setMonth(defaultFrom.getMonth() - 1);

  const [range, setRange] = useState<"7d" | "30d" | "90d" | "year" | "custom">("30d");
  const [fromDate, setFromDate] = useState(defaultFrom.toISOString().slice(0, 10));
  const [toDate, setToDate] = useState(today.toISOString().slice(0, 10));

  const applyRange = (selected: "7d" | "30d" | "90d" | "year" | "custom") => {
    setRange(selected);
    if (selected === "custom") return;
    const now = new Date();
    let start = new Date();
    if (selected === "7d") {
      start.setDate(now.getDate() - 6);
    } else if (selected === "30d") {
      start.setDate(now.getDate() - 29);
    } else if (selected === "90d") {
      start.setDate(now.getDate() - 89);
    } else if (selected === "year") {
      start.setFullYear(now.getFullYear() - 1);
      start.setDate(start.getDate() + 1);
    }
    setFromDate(start.toISOString().slice(0, 10));
    setToDate(now.toISOString().slice(0, 10));
  };


  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const dateStr = expense.date;
      return dateStr >= fromDate && dateStr <= toDate;
    });
  }, [expenses, fromDate, toDate]);

  const totalSpent = useMemo(
    () => filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0),
    [filteredExpenses]
  );

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    filteredExpenses.forEach((expense) => {
      totals[expense.category] = (totals[expense.category] ?? 0) + expense.amount;
    });
    return Object.entries(totals)
      .map(([category, value]) => ({ category, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredExpenses]);

  const topN = 5;

  const pieData = useMemo(() => {
    if (categoryTotals.length <= topN) {
      return categoryTotals;
    }
    const top = categoryTotals.slice(0, topN);
    const othersTotal = categoryTotals.slice(topN).reduce((sum, item) => sum + item.value, 0);
    return [...top, { category: "Others", value: othersTotal }];
  }, [categoryTotals]);


  const monthlyTotals = useMemo(() => {
    const monthlyMap: Record<string, number> = {};
    const from = new Date(fromDate);
    const to = new Date(toDate);

    // Build month buckets between from and to
    const current = new Date(from.getFullYear(), from.getMonth(), 1);
    while (current <= to) {
      const key = current.toISOString();
      monthlyMap[key] = 0;
      current.setMonth(current.getMonth() + 1);
    }

    filteredExpenses.forEach((expense) => {
      const date = new Date(expense.date);
      const key = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
      if (key in monthlyMap) {
        monthlyMap[key] += expense.amount;
      }
    });

    return Object.entries(monthlyMap)
      .map(([key, value]) => ({ month: monthLabel(new Date(key)), amount: value }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  }, [filteredExpenses, fromDate, toDate]);

  const resetDateRange = () => {
    const now2 = new Date();
    const prevMonth = new Date();
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    setFromDate(prevMonth.toISOString().slice(0, 10));
    setToDate(now2.toISOString().slice(0, 10));
  };

  const colors = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#14b8a6"];

  const [activeIndex, setActiveIndex] = useState<number | null>(null);


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
        <section className="rounded-3xl border border-slate-200/70 bg-[var(--card)] p-6 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-[var(--card)]/60">
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-sm font-medium text-slate-700">Range:</div>
            <select
              value={range}
              onChange={(e) => applyRange(e.target.value as "7d" | "30d" | "90d" | "year" | "custom")}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="year">Last 365 days</option>
              <option value="custom">Custom</option>
            </select>

            {range === "custom" ? (
              <>
                <div className="text-sm font-medium text-slate-700">From</div>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value);
                    setRange("custom");
                  }}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
                <div className="text-sm font-medium text-slate-700">To</div>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => {
                    setToDate(e.target.value);
                    setRange("custom");
                  }}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </>
            ) : null}

            <button
              type="button"
              onClick={() => {
                resetDateRange();
                applyRange("30d");
              }}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
            >
              Reset
            </button>
            <div className="ml-auto rounded-full bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 dark:bg-sky-900/30 dark:text-sky-200">
              Total spent: {formatCurrency(totalSpent)}
            </div>
          </div>
        </section>

        <section className="mt-6">
          <div className="rounded-3xl border border-slate-200/70 bg-[var(--card)] p-8 shadow-lg backdrop-blur dark:border-slate-700/50 dark:bg-[var(--card)]/60">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Spending Breakdown</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Where your money goes in the selected period.
            </p>

            <div className="relative mt-8 flex items-center justify-center">
              {/* Soft glow behind chart */}
              <div className="absolute inset-0 mx-auto h-72 w-72 rounded-full bg-indigo-100/40 blur-3xl dark:bg-indigo-900/20" />
              <div className="relative h-[320px] w-full max-w-md">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      {colors.map((color, i) => (
                        <filter key={`shadow-${i}`} id={`glow-${i}`}>
                          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={color} floodOpacity="0.3" />
                        </filter>
                      ))}
                    </defs>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={75}
                      outerRadius={activeIndex !== null ? 125 : 120}
                      paddingAngle={3}
                      cornerRadius={6}
                      stroke="none"
                      animationBegin={0}
                      animationDuration={800}
                      animationEasing="ease-out"
                      onMouseEnter={(_, index) => setActiveIndex(index)}
                      onMouseLeave={() => setActiveIndex(null)}
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={entry.category}
                          fill={colors[index % colors.length]}
                          style={{
                            filter: activeIndex === index ? `url(#glow-${index % colors.length})` : undefined,
                            transform: activeIndex === index ? "scale(1.05)" : "scale(1)",
                            transformOrigin: "center center",
                            transition: "transform 0.3s cubic-bezier(.4,0,.2,1), filter 0.3s ease",
                          }}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => (typeof value === "number" ? formatCurrency(value) : String(value))}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 8px 30px rgba(0,0,0,.12)",
                        padding: "10px 16px",
                        fontSize: "13px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mt-8 space-y-5">
              {/* Total card */}
              <div className="mx-auto flex max-w-xs items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 px-6 py-5 shadow-sm dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-pink-950/20">
                <div className="text-center">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Spent</div>
                  <div className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">{formatCurrency(totalSpent)}</div>
                </div>
              </div>

              {/* Legend grid */}
              <div className="grid gap-2.5 sm:grid-cols-2">
                {pieData.map((entry, index) => {
                  const pct = totalSpent ? ((entry.value / totalSpent) * 100) : 0;
                  return (
                    <div
                      key={entry.category}
                      className="group flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/80"
                    >
                      <span
                        className="h-3.5 w-3.5 shrink-0 rounded-full ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900"
                        style={{
                          backgroundColor: colors[index % colors.length],
                          boxShadow: `0 0 8px ${colors[index % colors.length]}40`,
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">{entry.category}</div>
                        {/* Mini progress bar */}
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: colors[index % colors.length],
                            }}
                          />
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{formatCurrency(entry.value)}</div>
                        <div className="text-[11px] font-medium text-slate-400 dark:text-slate-500">{pct.toFixed(1)}%</div>
                      </div>
                    </div>
                  );
                })}
              </div>
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
