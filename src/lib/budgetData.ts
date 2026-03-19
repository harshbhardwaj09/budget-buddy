export type Expense = {
  id: string;
  date: string; // ISO yyyy-mm-dd
  description: string;
  category: string;
  amount: number;
};

export const categories = [
  { value: "Food", label: "Food" },
  { value: "Transportation", label: "Transportation" },
  { value: "Utilities", label: "Utilities" },
  { value: "Entertainment", label: "Entertainment" },
  { value: "Shopping", label: "Shopping" },
  { value: "Health", label: "Health" },
  { value: "Other", label: "Other" },
];

export const initialExpenses: Expense[] = [
  {
    id: "1",
    date: "2026-03-10",
    description: "Groceries at Farmers Market",
    category: "Food",
    amount: 42.25,
  },
  {
    id: "2",
    date: "2026-03-12",
    description: "Monthly subway pass",
    category: "Transportation",
    amount: 54.0,
  },
  {
    id: "3",
    date: "2026-03-14",
    description: "Electricity bill",
    category: "Utilities",
    amount: 78.6,
  },
  {
    id: "4",
    date: "2026-03-16",
    description: "Movie night + snacks",
    category: "Entertainment",
    amount: 29.9,
  },
  {
    id: "5",
    date: "2026-03-17",
    description: "New running shoes",
    category: "Shopping",
    amount: 112.0,
  },
];
