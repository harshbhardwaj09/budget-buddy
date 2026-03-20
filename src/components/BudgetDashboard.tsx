"use client";

import { useMemo, useRef, useState } from "react";
import { categories, Expense } from "@/lib/budgetData";
import { clamp } from "@/lib/utils";
import { formatCurrency, formatDate, normalizeAmount } from "@/lib/formatters";
import { useBudget } from "@/context/BudgetContext";
import AppHeader from "@/components/AppHeader";

export default function BudgetDashboard() {
  const formRef = useRef<HTMLDivElement | null>(null);
  const { expenses, addExpense, updateExpense, removeExpense } = useBudget();
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [form, setForm] = useState({
    category: categories[0].value,
    customCategory: "",
    description: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filteredExpenses = useMemo(() => {
    if (categoryFilter === "All") return expenses;
    return expenses.filter((expense) => expense.category === categoryFilter);
  }, [categoryFilter, expenses]);

  const [sortConfig, setSortConfig] = useState<{
    key: "date" | "description" | "category" | "amount";
    direction: "asc" | "desc";
  } | null>(null);

  const sortedExpenses = useMemo(() => {
    if (!sortConfig) return filteredExpenses;
    const sorted = [...filteredExpenses].sort((a, b) => {
      if (sortConfig.key === "amount") {
        return sortConfig.direction === "asc" ? a.amount - b.amount : b.amount - a.amount;
      }
      const aValue = String(a[sortConfig.key]).toLowerCase();
      const bValue = String(b[sortConfig.key]).toLowerCase();
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredExpenses, sortConfig]);

  const toggleSort = (key: "date" | "description" | "category" | "amount") => {
    setSortConfig((prev) => {
      if (!prev || prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return null;
    });
  };

  const totalSpent = useMemo(
    () => expenses.reduce((sum, expense) => sum + expense.amount, 0),
    [expenses]
  );

  const topCategory = useMemo(() => {
    const totals: Record<string, number> = {};
    expenses.forEach((expense) => {
      totals[expense.category] = (totals[expense.category] ?? 0) + expense.amount;
    });
    const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    return sorted.length ? sorted[0][0] : "—";
  }, [expenses]);

  const addExpenseEntry = () => {
    const rawAmount = normalizeAmount(form.amount);
    const amount = parseFloat(rawAmount);

    if (Number.isNaN(amount) || amount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    setError(null);

    const selectedCategory = form.category === "Other" && form.customCategory.trim()
      ? form.customCategory.trim()
      : form.category;

    const payload = {
      date: form.date,
      description: form.description.trim(),
      category: selectedCategory,
      amount: clamp(amount, 0.01, 100000),
    };

    if (editingId) {
      updateExpense(editingId, payload);
      setEditingId(null);
      // Reset form after saving edit
      setForm({
        category: categories[0].value,
        customCategory: "",
        description: "",
        amount: "",
        date: new Date().toISOString().slice(0, 10),
      });
    } else {
      addExpense(payload);
      // Reset form after adding new expense
      setForm({
        category: categories[0].value,
        customCategory: "",
        description: "",
        amount: "",
        date: new Date().toISOString().slice(0, 10),
      });
    }
  };

  const startEdit = (expense: Expense) => {
    setEditingId(expense.id);

    const isKnownCategory = categories.some((category) => category.value === expense.category);
    setForm({
      category: isKnownCategory ? expense.category : "Other",
      customCategory: isKnownCategory ? "" : expense.category,
      description: expense.description,
      amount: expense.amount.toString(),
      date: expense.date,
    });
    setError(null);

    // Scroll the form into view when editing an existing expense,
    // with a small additional offset so the section is fully visible.
    setTimeout(() => {
      if (!formRef.current) return;
      const safeOffset = 120; // px from top
      const top = formRef.current.getBoundingClientRect().top + window.scrollY - safeOffset;
      window.scrollTo({ top: top > 0 ? top : 0, behavior: "smooth" });
    }, 0);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm((prev) => ({ ...prev, description: "", amount: "" }));
    setError(null);
  };

  const removeExpenseEntry = (id: string) => {
    removeExpense(id);
    if (editingId === id) {
      cancelEdit();
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-sky-50 to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      <AppHeader
        title="Budget Buddy"
        subtitle="Track expenses, categorize spending, and keep your money on track."
        stats={[
          { label: "transactions", value: expenses.length },
          { label: "spent", value: formatCurrency(totalSpent) },
        ]}
      />

      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div ref={formRef} className="rounded-3xl border border-slate-200/70 bg-[var(--card)] p-6 shadow-sm backdrop-blur">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                    {editingId ? "Edit expense" : "Add an expense"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                    {editingId
                      ? "Update an existing entry or cancel to add a new one."
                      : "Start logging what you spend and categorize it for better insights."}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
                    onClick={addExpenseEntry}
                  >
                    {editingId ? "Save changes" : "Add expense"}
                  </button>
                  {editingId ? (
                    <button
                      type="button"
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                      onClick={cancelEdit}
                    >
                      Cancel
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                      onClick={() => {
                        setForm((prev) => ({
                          ...prev,
                          description: "",
                          amount: "",
                          category: categories[0].value,
                        }));
                      }}
                    >
                      Reset form
                    </button>
                  )}
                </div>

                {error ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                ) : null}
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label htmlFor="category" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Category
                  </label>
                  <select
                    id="category"
                    value={form.category}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, category: event.target.value }))
                    }
                    className="h-11 rounded-xl border border-slate-200 bg-white/70 px-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800/70 dark:text-slate-100"
                  >
                    {categories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                    <option value="Other">Other (add new)</option>
                  </select>
                  {form.category === "Other" && (
                    <input
                      id="customCategory"
                      type="text"
                      value={form.customCategory}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, customCategory: event.target.value }))
                      }
                      placeholder="Enter custom category (optional)"
                      className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white/70 px-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800/70 dark:text-slate-100"
                    />
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="description" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Description (optional)
                  </label>
                  <input
                    id="description"
                    type="text"
                    value={form.description}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, description: event.target.value }))
                    }
                    placeholder="e.g., Lunch at cafe"
                    className="h-11 rounded-xl border border-slate-200 bg-white/70 px-4 text-sm text-slate-900 shadow-sm outline-none transition placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800/70 dark:text-slate-100 dark:placeholder-slate-500"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="amount" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Amount
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400">
                      ₹
                    </span>
                    <input
                      id="amount"
                      type="text"
                      inputMode="decimal"
                      value={form.amount}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, amount: event.target.value }))
                      }
                      placeholder="0.00"
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white/70 px-10 text-sm text-slate-900 shadow-sm outline-none transition placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800/70 dark:text-slate-100 dark:placeholder-slate-500"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="date" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Date
                  </label>
                  <input
                    id="date"
                    type="date"
                    value={form.date}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, date: event.target.value }))
                    }
                    className="h-11 rounded-xl border border-slate-200 bg-white/70 px-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800/70 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-sky-600/10 p-4">
                  <p className="text-sm font-medium text-sky-900">Total spent</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-50">
                    {formatCurrency(totalSpent)}
                  </p>
                </div>
                <div className="rounded-2xl bg-emerald-500/10 p-4">
                  <p className="text-sm font-medium text-emerald-900">Top category</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-50">
                    {topCategory}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/70 bg-[var(--card)] p-6 shadow-sm backdrop-blur">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Tips</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li className="flex gap-2">
                <span className="mt-0.5 inline-flex h-2 w-2 flex-none rounded-full bg-indigo-600" />
                  Add a new expense whenever you purchase something to keep totals accurate.
                </li>
                <li className="flex gap-2">
                  <span className="mt-0.5 inline-flex h-2 w-2 flex-none rounded-full bg-emerald-600" />
                  Use categories to spot trends in where your money goes.
                </li>
                <li className="flex gap-2">
                  <span className="mt-0.5 inline-flex h-2 w-2 flex-none rounded-full bg-sky-600" />
                  This UI is ready for a login/backend integration later.
                </li>
              </ul>
            </div>
        </section>

        <section className="mt-10 rounded-3xl border border-slate-200/70 bg-[var(--card)] p-6 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Recent activity</h2>
              <p className="mt-1 text-sm text-slate-500">
                {filteredExpenses.length} expense{filteredExpenses.length === 1 ? "" : "s"} shown.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-slate-700">
                Show
                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  className="ml-2 inline-flex h-10 w-40 items-center rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="All">All categories</option>
                  {categories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="px-4 py-4 font-medium text-slate-600 dark:text-slate-300 sm:px-6">
                    <button type="button" className="inline-flex items-center gap-1 text-left" onClick={() => toggleSort("date")}>Date <span>{sortConfig?.key === "date" ? (sortConfig.direction === "asc" ? "↑" : "↓") : "↕"}</span></button>
                  </th>
                  <th className="px-4 py-4 font-medium text-slate-600 dark:text-slate-300 sm:px-6">
                    <button type="button" className="inline-flex items-center gap-1 text-left" onClick={() => toggleSort("description")}>Description <span>{sortConfig?.key === "description" ? (sortConfig.direction === "asc" ? "↑" : "↓") : "↕"}</span></button>
                  </th>
                  <th className="px-4 py-4 font-medium text-slate-600 dark:text-slate-300 sm:px-6">
                    <button type="button" className="inline-flex items-center gap-1 text-left" onClick={() => toggleSort("category")}>Category <span>{sortConfig?.key === "category" ? (sortConfig.direction === "asc" ? "↑" : "↓") : "↕"}</span></button>
                  </th>
                  <th className="px-4 py-4 font-medium text-slate-600 dark:text-slate-300 sm:px-6">
                    <button type="button" className="inline-flex items-center gap-1 text-left" onClick={() => toggleSort("amount")}>Amount <span>{sortConfig?.key === "amount" ? (sortConfig.direction === "asc" ? "↑" : "↓") : "↕"}</span></button>
                  </th>
                  <th className="px-4 py-4 font-medium text-slate-600 dark:text-slate-300 sm:px-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white dark:bg-slate-900">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-500 dark:text-slate-400 sm:px-6">
                      No expenses yet. Add one to get started.
                    </td>
                  </tr>
                ) : (
                  sortedExpenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                      <td className="px-4 py-4 text-slate-600 dark:text-slate-300 sm:px-6">{formatDate(expense.date)}</td>
                      <td className="px-4 py-4 text-slate-900 dark:text-slate-100 sm:px-6">
                        {expense.description}
                      </td>
                      <td className="px-4 py-4 sm:px-6">
                        {categories.some((category) => category.value === expense.category) ? (
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                            {expense.category}
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
                            Custom: {expense.category}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-900 dark:text-slate-100 sm:px-6">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="px-4 py-4 sm:px-6">
                        <div className="flex flex-col gap-1 sm:flex-row sm:gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(expense)}
                            className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => removeExpenseEntry(expense.id)}
                            className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/40 bg-[var(--card)] py-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>
            Developed by Harsh Bhardwaj —{" "}
            <a
              href="https://my-portfolio-harsh-bhardwaj.vercel.app/"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-300"
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
