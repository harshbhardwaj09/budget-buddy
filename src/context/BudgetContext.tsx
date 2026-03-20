"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Expense, Income, initialExpenses, initialIncomes } from "@/lib/budgetData";

type BudgetContextValue = {
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, "id">) => void;
  updateExpense: (id: string, updated: Omit<Expense, "id">) => void;
  removeExpense: (id: string) => void;
  resetExpenses: () => void;
  incomes: Income[];
  addIncome: (income: Omit<Income, "id">) => void;
  updateIncome: (id: string, updated: Omit<Income, "id">) => void;
  removeIncome: (id: string) => void;
};

const BudgetContext = createContext<BudgetContextValue | null>(null);

const STORAGE_KEY = "budgetBuddy:expenses";
const INCOME_STORAGE_KEY = "budgetBuddy:incomes";

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

function loadStoredIncomes(): Income[] {
  try {
    const stored = window.localStorage.getItem(INCOME_STORAGE_KEY);
    if (!stored) return initialIncomes;
    const parsed = JSON.parse(stored) as Income[];
    if (!Array.isArray(parsed)) return initialIncomes;
    return parsed;
  } catch {
    return initialIncomes;
  }
}

function persistIncomes(incomes: Income[]) {
  try {
    window.localStorage.setItem(INCOME_STORAGE_KEY, JSON.stringify(incomes));
  } catch {
    // ignore
  }
}

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [incomes, setIncomes] = useState<Income[]>(initialIncomes);

  useEffect(() => {
    setExpenses(loadStoredExpenses());
    setIncomes(loadStoredIncomes());
  }, []);

  useEffect(() => {
    persistExpenses(expenses);
  }, [expenses]);

  useEffect(() => {
    persistIncomes(incomes);
  }, [incomes]);

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

    const addIncome = (income: Omit<Income, "id">) => {
      setIncomes((prev) => [
        { ...income, id: crypto.randomUUID() },
        ...prev,
      ]);
    };

    const updateIncome = (id: string, updated: Omit<Income, "id">) => {
      setIncomes((prev) =>
        prev.map((income) => (income.id === id ? { ...income, ...updated } : income))
      );
    };

    const removeIncome = (id: string) => {
      setIncomes((prev) => prev.filter((income) => income.id !== id));
    };

    return {
      expenses,
      addExpense,
      updateExpense,
      removeExpense,
      resetExpenses,
      incomes,
      addIncome,
      updateIncome,
      removeIncome,
    };
  }, [expenses, incomes]);

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
}

export function useBudget() {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error("useBudget must be used within a BudgetProvider");
  }
  return context;
}
