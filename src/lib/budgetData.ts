// Budget Data Types aur Categories
// Sirf types aur categories hain yahan - koi hardcoded data nahi

export type Expense = {
  id: string;
  date: string; // ISO yyyy-mm-dd
  description: string;
  category: string;
  amount: number;
  createdAt?: string; // Firebase timestamp
  updatedAt?: string; // Firebase timestamp
};

export type Income = {
  id: string;
  date: string; // ISO yyyy-mm-dd
  description: string;
  source: string;
  amount: number;
  createdAt?: string; // Firebase timestamp
  updatedAt?: string; // Firebase timestamp
};

// Categories list - expense form me dropdown ke liye
export const categories = [
  { value: "Food", label: "Food" },
  { value: "Transportation", label: "Transportation" },
  { value: "Utilities", label: "Utilities" },
  { value: "Entertainment", label: "Entertainment" },
  { value: "Shopping", label: "Shopping" },
  { value: "Health", label: "Health" },
  { value: "Other", label: "Other" },
];
