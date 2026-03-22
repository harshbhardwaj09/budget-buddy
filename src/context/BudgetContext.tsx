// BudgetContext - Ab sab data Firebase Firestore se aata hai
// Har user ka data alag alag hota hai (userId ke basis pe)
// Real-time sync hota hai - ek device pe add karo, doosre pe dikhega

"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Expense, Income } from "@/lib/budgetData";
import { useAuth } from "@/context/AuthContext";
import {
  addExpenseToFirestore,
  updateExpenseInFirestore,
  deleteExpenseFromFirestore,
  listenToExpenses,
  addIncomeToFirestore,
  updateIncomeInFirestore,
  deleteIncomeFromFirestore,
  listenToIncomes,
} from "@/lib/firebaseService";

type BudgetContextValue = {
  expenses: Expense[];
  incomes: Income[];
  loading: boolean;
  error: string | null;
  addExpense: (expense: Omit<Expense, "id">) => Promise<void>;
  updateExpense: (id: string, updated: Omit<Expense, "id">) => Promise<void>;
  removeExpense: (id: string) => Promise<void>;
  addIncome: (income: Omit<Income, "id">) => Promise<void>;
  updateIncome: (id: string, updated: Omit<Income, "id">) => Promise<void>;
  removeIncome: (id: string) => Promise<void>;
};

const BudgetContext = createContext<BudgetContextValue | null>(null);

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Jab user login ho, uske data ko real-time listen karo
  useEffect(() => {
    // Agar user logged in nahi hai to data clear karo
    if (!user) {
      setExpenses([]);
      setIncomes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    let expensesLoaded = false;
    let incomesLoaded = false;

    const checkLoaded = () => {
      if (expensesLoaded && incomesLoaded) {
        setLoading(false);
      }
    };

    // Expenses ko listen karo
    const unsubExpenses = listenToExpenses(
      user.uid,
      (data) => {
        setExpenses(data);
        expensesLoaded = true;
        checkLoaded();
      },
      (err) => {
        console.error("Expenses listen error:", err);
        setError("Failed to load expenses. Please refresh.");
        expensesLoaded = true;
        checkLoaded();
      }
    );

    // Incomes ko listen karo
    const unsubIncomes = listenToIncomes(
      user.uid,
      (data) => {
        setIncomes(data);
        incomesLoaded = true;
        checkLoaded();
      },
      (err) => {
        console.error("Incomes listen error:", err);
        setError("Failed to load incomes. Please refresh.");
        incomesLoaded = true;
        checkLoaded();
      }
    );

    // Cleanup: jab user change ho ya component unmount ho
    return () => {
      unsubExpenses();
      unsubIncomes();
    };
  }, [user]);

  // ============ EXPENSE ACTIONS ============

  const addExpense = useCallback(async (expense: Omit<Expense, "id">) => {
    if (!user) return;
    try {
      setError(null);
      await addExpenseToFirestore(user.uid, expense);
    } catch (err) {
      console.error("Add expense error:", err);
      setError("Failed to add expense. Please try again.");
    }
  }, [user]);

  const updateExpense = useCallback(async (id: string, updated: Omit<Expense, "id">) => {
    if (!user) return;
    try {
      setError(null);
      await updateExpenseInFirestore(user.uid, id, updated);
    } catch (err) {
      console.error("Update expense error:", err);
      setError("Failed to update expense. Please try again.");
    }
  }, [user]);

  const removeExpense = useCallback(async (id: string) => {
    if (!user) return;
    try {
      setError(null);
      await deleteExpenseFromFirestore(user.uid, id);
    } catch (err) {
      console.error("Delete expense error:", err);
      setError("Failed to delete expense. Please try again.");
    }
  }, [user]);

  // ============ INCOME ACTIONS ============

  const addIncome = useCallback(async (income: Omit<Income, "id">) => {
    if (!user) return;
    try {
      setError(null);
      await addIncomeToFirestore(user.uid, income);
    } catch (err) {
      console.error("Add income error:", err);
      setError("Failed to add income. Please try again.");
    }
  }, [user]);

  const updateIncome = useCallback(async (id: string, updated: Omit<Income, "id">) => {
    if (!user) return;
    try {
      setError(null);
      await updateIncomeInFirestore(user.uid, id, updated);
    } catch (err) {
      console.error("Update income error:", err);
      setError("Failed to update income. Please try again.");
    }
  }, [user]);

  const removeIncome = useCallback(async (id: string) => {
    if (!user) return;
    try {
      setError(null);
      await deleteIncomeFromFirestore(user.uid, id);
    } catch (err) {
      console.error("Delete income error:", err);
      setError("Failed to delete income. Please try again.");
    }
  }, [user]);

  const value = useMemo<BudgetContextValue>(
    () => ({
      expenses,
      incomes,
      loading,
      error,
      addExpense,
      updateExpense,
      removeExpense,
      addIncome,
      updateIncome,
      removeIncome,
    }),
    [expenses, incomes, loading, error, addExpense, updateExpense, removeExpense, addIncome, updateIncome, removeIncome]
  );

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
}

export function useBudget() {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error("useBudget must be used within a BudgetProvider");
  }
  return context;
}
