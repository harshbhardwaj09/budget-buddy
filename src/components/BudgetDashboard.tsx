"use client";

import { useMemo, useRef, useState } from "react";
import { categories, Expense, Income } from "@/lib/budgetData";
import { clamp } from "@/lib/utils";
import { formatCurrency, formatDate, normalizeAmount } from "@/lib/formatters";
import { useBudget } from "@/context/BudgetContext";
import AppHeader from "@/components/AppHeader";

export default function BudgetDashboard() {
  const formRef = useRef<HTMLDivElement | null>(null);
  const incomeFormRef = useRef<HTMLDivElement | null>(null);
  const { expenses, addExpense, updateExpense, removeExpense, incomes, addIncome, updateIncome, removeIncome, loading, error: budgetError } = useBudget();
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [form, setForm] = useState({
    category: categories[0].value,
    customCategory: "",
    description: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<string | null>(null);
  const [tableView, setTableView] = useState<"expenses" | "income">("expenses");

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

  const totalIncome = useMemo(
    () => incomes.reduce((sum, inc) => sum + inc.amount, 0),
    [incomes]
  );

  const savings = totalIncome - totalSpent;

  const [incomeForm, setIncomeForm] = useState({
    source: "",
    description: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
  });
  const [editingIncomeId, setEditingIncomeId] = useState<string | null>(null);
  const [incomeErrorField, setIncomeErrorField] = useState<string | null>(null);

  const addIncomeEntry = async () => {
    const rawAmount = normalizeAmount(incomeForm.amount);
    const amount = parseFloat(rawAmount);
    if (!incomeForm.source.trim()) {
      setIncomeErrorField("incomeSource");
      document.getElementById("incomeSource")?.focus();
      return;
    }
    if (Number.isNaN(amount) || amount <= 0) {
      setIncomeErrorField("incomeAmount");
      document.getElementById("incomeAmount")?.focus();
      return;
    }
    setIncomeErrorField(null);
    const payload = {
      date: incomeForm.date,
      description: incomeForm.description.trim(),
      source: incomeForm.source.trim(),
      amount: clamp(amount, 0.01, 10000000),
    };

    if (editingIncomeId) {
      await updateIncome(editingIncomeId, payload);
      setEditingIncomeId(null);
    } else {
      await addIncome(payload);
    }
    setIncomeForm({ source: "", description: "", amount: "", date: new Date().toISOString().slice(0, 10) });
  };

  const startEditIncome = (inc: Income) => {
    setEditingIncomeId(inc.id);
    setIncomeForm({
      source: inc.source,
      description: inc.description,
      amount: inc.amount.toString(),
      date: inc.date,
    });
    setIncomeErrorField(null);
    setTableView("income");

    setTimeout(() => {
      if (!incomeFormRef.current) return;
      const safeOffset = 120;
      const top = incomeFormRef.current.getBoundingClientRect().top + window.scrollY - safeOffset;
      window.scrollTo({ top: top > 0 ? top : 0, behavior: "smooth" });
    }, 0);
  };

  const cancelEditIncome = () => {
    setEditingIncomeId(null);
    setIncomeForm({ source: "", description: "", amount: "", date: new Date().toISOString().slice(0, 10) });
    setIncomeErrorField(null);
  };

  const addExpenseEntry = async () => {
    const rawAmount = normalizeAmount(form.amount);
    const amount = parseFloat(rawAmount);

    if (Number.isNaN(amount) || amount <= 0) {
      setErrorField("amount");
      document.getElementById("amount")?.focus();
      return;
    }

    setErrorField(null);

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
      await updateExpense(editingId, payload);
      setEditingId(null);
    } else {
      await addExpense(payload);
    }
    // Reset form
    setForm({
      category: categories[0].value,
      customCategory: "",
      description: "",
      amount: "",
      date: new Date().toISOString().slice(0, 10),
    });
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
    setErrorField(null);

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
    setErrorField(null);
  };

  const removeExpenseEntry = (id: string) => {
    removeExpense(id);
    if (editingId === id) {
      cancelEdit();
    }
  };


  // Loading state - jab tak data load nahi hota
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-sky-50 to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
        <AppHeader title="Budget Cash Flow" subtitle="Loading your data..." />
        <div className="flex items-center justify-center py-20 text-slate-500">
          Loading your budget data...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-sky-50 to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      <AppHeader
        title="Budget Cash Flow"
        subtitle="Track expenses, categorize spending, and keep your money on track."
      />

      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        {/* Error banner */}
        {budgetError && (
          <div className="mb-6 rounded-2xl bg-red-50 px-5 py-4 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {budgetError}
          </div>
        )}
        <section className="grid gap-6 lg:grid-cols-2">
          <div>
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
                      onChange={(event) => {
                        setForm((prev) => ({ ...prev, amount: event.target.value }));
                        if (errorField === "amount") setErrorField(null);
                      }}
                      placeholder="0.00"
                      className={`h-11 w-full rounded-xl border px-10 text-sm shadow-sm outline-none transition placeholder-slate-400 focus:ring-2 dark:bg-slate-800/70 dark:placeholder-slate-500 ${errorField === "amount" ? "border-red-500 text-red-600 dark:border-red-500 dark:text-red-400 focus:border-red-500 focus:ring-red-200" : "border-slate-200 bg-white/70 text-slate-900 focus:border-indigo-500 focus:ring-indigo-200 dark:border-slate-600 dark:text-slate-100"}`}
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

              <div className="mt-4 flex flex-wrap items-center gap-2">
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
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    onClick={cancelEdit}
                  >
                    Cancel
                  </button>
                ) : (
                  <button
                    type="button"
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
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

              <div className="mt-6">
                <div className="rounded-2xl bg-sky-600/10 p-4">
                  <p className="text-sm font-medium text-sky-900 dark:text-sky-300">Total Spent</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-50">
                    {formatCurrency(totalSpent)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div ref={incomeFormRef} className="rounded-3xl border border-slate-200/70 bg-[var(--card)] p-6 shadow-sm backdrop-blur">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                    {editingIncomeId ? "Edit Income" : "Add Income"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                    {editingIncomeId
                      ? "Update the income entry or cancel to add a new one."
                      : "Log your income sources to track savings."}
                  </p>
                </div>
              </div>



              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label htmlFor="incomeSource" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Source
                  </label>
                  <input
                    id="incomeSource"
                    type="text"
                    value={incomeForm.source}
                    onChange={(e) => {
                      setIncomeForm((prev) => ({ ...prev, source: e.target.value }));
                      if (incomeErrorField === "incomeSource") setIncomeErrorField(null);
                    }}
                    placeholder="e.g., Salary, Freelance"
                    className={`h-11 rounded-xl border px-4 text-sm shadow-sm outline-none transition placeholder-slate-400 focus:ring-2 dark:bg-slate-800/70 dark:placeholder-slate-500 ${incomeErrorField === "incomeSource" ? "border-red-500 text-red-600 dark:border-red-500 dark:text-red-400 focus:border-red-500 focus:ring-red-200" : "border-slate-200 bg-white/70 text-slate-900 focus:border-indigo-500 focus:ring-indigo-200 dark:border-slate-600 dark:text-slate-100"}`}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="incomeDescription" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Description (optional)
                  </label>
                  <input
                    id="incomeDescription"
                    type="text"
                    value={incomeForm.description}
                    onChange={(e) => setIncomeForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="e.g., March salary"
                    className="h-11 rounded-xl border border-slate-200 bg-white/70 px-4 text-sm text-slate-900 shadow-sm outline-none transition placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800/70 dark:text-slate-100 dark:placeholder-slate-500"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="incomeAmount" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Amount
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400">
                      ₹
                    </span>
                    <input
                      id="incomeAmount"
                      type="text"
                      inputMode="decimal"
                      value={incomeForm.amount}
                      onChange={(e) => {
                        setIncomeForm((prev) => ({ ...prev, amount: e.target.value }));
                        if (incomeErrorField === "incomeAmount") setIncomeErrorField(null);
                      }}
                      placeholder="0.00"
                      className={`h-11 w-full rounded-xl border px-10 text-sm shadow-sm outline-none transition placeholder-slate-400 focus:ring-2 dark:bg-slate-800/70 dark:placeholder-slate-500 ${incomeErrorField === "incomeAmount" ? "border-red-500 text-red-600 dark:border-red-500 dark:text-red-400 focus:border-red-500 focus:ring-red-200" : "border-slate-200 bg-white/70 text-slate-900 focus:border-indigo-500 focus:ring-indigo-200 dark:border-slate-600 dark:text-slate-100"}`}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="incomeDate" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Date
                  </label>
                  <input
                    id="incomeDate"
                    type="date"
                    value={incomeForm.date}
                    onChange={(e) => setIncomeForm((prev) => ({ ...prev, date: e.target.value }))}
                    className="h-11 rounded-xl border border-slate-200 bg-white/70 px-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800/70 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500"
                  onClick={addIncomeEntry}
                >
                  {editingIncomeId ? "Save changes" : "Add income"}
                </button>
                {editingIncomeId ? (
                  <button
                    type="button"
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    onClick={cancelEditIncome}
                  >
                    Cancel
                  </button>
                ) : (
                  <button
                    type="button"
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    onClick={() => setIncomeForm({ source: "", description: "", amount: "", date: new Date().toISOString().slice(0, 10) })}
                  >
                    Reset form
                  </button>
                )}
              </div>

              <div className="mt-6">
                <div className="rounded-2xl bg-emerald-500/10 p-4">
                  <p className="text-sm font-medium text-emerald-900 dark:text-emerald-300">Total Income</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-50">
                    {formatCurrency(totalIncome)}
                  </p>
                </div>
              </div>
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-slate-200/70 bg-[var(--card)] p-6 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Recent Activity</h2>
              <p className="mt-1 text-sm text-slate-500">
                {tableView === "expenses"
                  ? `${filteredExpenses.length} expense${filteredExpenses.length === 1 ? "" : "s"} shown.`
                  : `${incomes.length} income${incomes.length === 1 ? "" : "s"} shown.`}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {/* Toggle pill */}
              <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => { setTableView("expenses"); setSortConfig(null); }}
                  className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-all ${tableView === "expenses" ? "bg-white text-indigo-700 shadow-sm dark:bg-slate-700 dark:text-indigo-300" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"}`}
                >
                  Expenses
                </button>
                <button
                  type="button"
                  onClick={() => { setTableView("income"); setSortConfig(null); }}
                  className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-all ${tableView === "income" ? "bg-white text-emerald-700 shadow-sm dark:bg-slate-700 dark:text-emerald-300" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"}`}
                >
                  Income
                </button>
              </div>
              {tableView === "expenses" && (
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  Show
                  <select
                    value={categoryFilter}
                    onChange={(event) => setCategoryFilter(event.target.value)}
                    className="h-10 min-w-0 max-w-[10rem] rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <option value="All">All categories</option>
                    {categories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          </div>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
            {tableView === "expenses" ? (
              <table className="w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-700">
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
                <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-900">
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
                        <td className="px-4 py-4 text-slate-900 dark:text-slate-100 sm:px-6">{expense.description}</td>
                        <td className="px-4 py-4 sm:px-6">
                          {categories.some((c) => c.value === expense.category) ? (
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200">{expense.category}</span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">Custom: {expense.category}</span>
                          )}
                        </td>
                        <td className="px-4 py-4 font-semibold text-red-600 dark:text-red-400 sm:px-6">-{formatCurrency(expense.amount)}</td>
                        <td className="px-4 py-4 sm:px-6">
                          <div className="flex flex-col gap-1 sm:flex-row sm:gap-2">
                            <button type="button" onClick={() => startEdit(expense)} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50">Edit</button>
                            <button type="button" onClick={() => removeExpenseEntry(expense.id)} className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-4 py-4 font-medium text-slate-600 dark:text-slate-300 sm:px-6">
                      <button type="button" className="inline-flex items-center gap-1 text-left" onClick={() => toggleSort("date")}>Date <span>{sortConfig?.key === "date" ? (sortConfig.direction === "asc" ? "↑" : "↓") : "↕"}</span></button>
                    </th>
                    <th className="px-4 py-4 font-medium text-slate-600 dark:text-slate-300 sm:px-6">
                      <button type="button" className="inline-flex items-center gap-1 text-left" onClick={() => toggleSort("description")}>Source <span>{sortConfig?.key === "description" ? (sortConfig.direction === "asc" ? "↑" : "↓") : "↕"}</span></button>
                    </th>
                    <th className="px-4 py-4 font-medium text-slate-600 dark:text-slate-300 sm:px-6">Description</th>
                    <th className="px-4 py-4 font-medium text-slate-600 dark:text-slate-300 sm:px-6">
                      <button type="button" className="inline-flex items-center gap-1 text-left" onClick={() => toggleSort("amount")}>Amount <span>{sortConfig?.key === "amount" ? (sortConfig.direction === "asc" ? "↑" : "↓") : "↕"}</span></button>
                    </th>
                    <th className="px-4 py-4 font-medium text-slate-600 dark:text-slate-300 sm:px-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-900">
                  {incomes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-slate-500 dark:text-slate-400 sm:px-6">
                        No income added yet.
                      </td>
                    </tr>
                  ) : (
                    incomes.map((inc) => (
                      <tr key={inc.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800 ${editingIncomeId === inc.id ? "bg-emerald-50/50 dark:bg-emerald-900/10" : ""}`}>
                        <td className="px-4 py-4 text-slate-600 dark:text-slate-300 sm:px-6">{formatDate(inc.date)}</td>
                        <td className="px-4 py-4 text-slate-900 dark:text-slate-100 sm:px-6">{inc.source}</td>
                        <td className="px-4 py-4 text-slate-900 dark:text-slate-100 sm:px-6">{inc.description}</td>
                        <td className="px-4 py-4 font-semibold text-emerald-600 dark:text-emerald-400 sm:px-6">+{formatCurrency(inc.amount)}</td>
                        <td className="px-4 py-4 sm:px-6">
                          <div className="flex flex-col gap-1 sm:flex-row sm:gap-2">
                            <button type="button" onClick={() => startEditIncome(inc)} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/50">Edit</button>
                            <button type="button" onClick={() => removeIncome(inc.id)} className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
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
          <p>© {new Date().getFullYear()} Budget Cash Flow</p>
        </div>
      </footer>
    </div>
  );
}
