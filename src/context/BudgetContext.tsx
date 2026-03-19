"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Expense, initialExpenses } from "@/lib/budgetData";

type BudgetContextValue = {
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, "id">) => void;
  updateExpense: (id: string, updated: Omit<Expense, "id">) => void;
  removeExpense: (id: string) => void;
  resetExpenses: () => void;
};

const BudgetContext = createContext<BudgetContextValue | null>(null);

const STORAGE_KEY = "budgetBuddy:expenses";

function loadStoredExpenses(): Expense[] {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return initialExpenses;
    const parsed = JSON.parse(stored) as Expense[];
    if (!Array.isArray(parsed)) return initialExpenses;
    return parsed;
  } catch {
    return initialExpenses;
  }
}

function persistExpenses(expenses: Expense[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  } catch {
    // ignore
  }
}

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);

  useEffect(() => {
    setExpenses(loadStoredExpenses());
  }, []);

  useEffect(() => {
    persistExpenses(expenses);
  }, [expenses]);

  const value = useMemo<BudgetContextValue>(() => {
    const addExpense = (expense: Omit<Expense, "id">) => {
      setExpenses((prev) => [
        { ...expense, id: crypto.randomUUID() },
        ...prev,
      ]);
    };

    const updateExpense = (id: string, updated: Omit<Expense, "id">) => {
      setExpenses((prev) =>
        prev.map((expense) => (expense.id === id ? { ...expense, ...updated } : expense))
      );
    };

    const removeExpense = (id: string) => {
      setExpenses((prev) => prev.filter((expense) => expense.id !== id));
    };

    const resetExpenses = () => {
      setExpenses(initialExpenses);
    };

    return {
      expenses,
      addExpense,
      updateExpense,
      removeExpense,
      resetExpenses,
    };
  }, [expenses]);

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
}

export function useBudget() {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error("useBudget must be used within a BudgetProvider");
  }
  return context;
}
