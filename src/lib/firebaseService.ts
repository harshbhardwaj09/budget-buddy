// Firestore Service - Har user ka data alag alag save hota hai
// Structure: users/{userId}/userDetail/profile
//            users/{userId}/expenses/{expenseId}
//            users/{userId}/incomes/{incomeId}

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  getDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Expense, Income } from "./budgetData";

// Helper: Firestore db available hai ya nahi check karo
function getDb() {
  if (!db) throw new Error("Firestore not initialized. Check Firebase config.");
  return db;
}

// ============ USER PROFILE ============

export type UserProfile = {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  phoneNumber: string;
  emailVerified: boolean;
  joinedAt?: string;
  isPremium: boolean;
  lastLoginAt: string;
};

// User ki saari detail save karo - userDetail/profile document me
export async function saveUserProfile(
  userId: string,
  profile: {
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
    phoneNumber: string | null;
    emailVerified: boolean;
  }
): Promise<void> {
  const docRef = doc(getDb(), "users", userId, "userDetail", "profile");
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    // Existing user - sirf login info update karo, joinedAt mat chhuo
    await setDoc(
      docRef,
      {
        uid: userId,
        displayName: profile.displayName ?? "",
        email: profile.email ?? "",
        photoURL: profile.photoURL ?? "",
        phoneNumber: profile.phoneNumber ?? "",
        emailVerified: profile.emailVerified,
        lastLoginAt: serverTimestamp(),
      },
      { merge: true }
    );
  } else {
    // New user - joinedAt aur isPremium set karo
    await setDoc(docRef, {
      uid: userId,
      displayName: profile.displayName ?? "",
      email: profile.email ?? "",
      photoURL: profile.photoURL ?? "",
      phoneNumber: profile.phoneNumber ?? "",
      emailVerified: profile.emailVerified,
      joinedAt: serverTimestamp(),
      isPremium: false,
      lastLoginAt: serverTimestamp(),
    });
  }
}

// ============ EXPENSE FUNCTIONS ============

// Expense add karo - user ke subcollection me
export async function addExpenseToFirestore(
  userId: string,
  expense: Omit<Expense, "id">
): Promise<string> {
  const colRef = collection(getDb(), "users", userId, "expenses");
  const docRef = await addDoc(colRef, {
    ...expense,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

// Expense update karo
export async function updateExpenseInFirestore(
  userId: string,
  expenseId: string,
  updated: Omit<Expense, "id">
): Promise<void> {
  const docRef = doc(getDb(), "users", userId, "expenses", expenseId);
  await updateDoc(docRef, {
    ...updated,
    updatedAt: serverTimestamp(),
  });
}

// Expense delete karo
export async function deleteExpenseFromFirestore(
  userId: string,
  expenseId: string
): Promise<void> {
  const docRef = doc(getDb(), "users", userId, "expenses", expenseId);
  await deleteDoc(docRef);
}

// Expenses ko real-time listen karo (jab bhi change ho, callback chalega)
export function listenToExpenses(
  userId: string,
  callback: (expenses: Expense[]) => void,
  onError: (error: Error) => void
) {
  const colRef = collection(getDb(), "users", userId, "expenses");
  const q = query(colRef, orderBy("createdAt", "desc"));

  // onSnapshot real-time listener return karta hai
  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const expenses: Expense[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          date: data.date ?? "",
          description: data.description ?? "",
          category: data.category ?? "",
          amount: data.amount ?? 0,
          createdAt: data.createdAt instanceof Timestamp
            ? data.createdAt.toDate().toISOString()
            : undefined,
          updatedAt: data.updatedAt instanceof Timestamp
            ? data.updatedAt.toDate().toISOString()
            : undefined,
        } as Expense;
      });
      callback(expenses);
    },
    (error) => {
      onError(error);
    }
  );

  return unsubscribe;
}

// ============ INCOME FUNCTIONS ============

// Income add karo - user ke subcollection me
export async function addIncomeToFirestore(
  userId: string,
  income: Omit<Income, "id">
): Promise<string> {
  const colRef = collection(getDb(), "users", userId, "incomes");
  const docRef = await addDoc(colRef, {
    ...income,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

// Income update karo
export async function updateIncomeInFirestore(
  userId: string,
  incomeId: string,
  updated: Omit<Income, "id">
): Promise<void> {
  const docRef = doc(getDb(), "users", userId, "incomes", incomeId);
  await updateDoc(docRef, {
    ...updated,
    updatedAt: serverTimestamp(),
  });
}

// Income delete karo
export async function deleteIncomeFromFirestore(
  userId: string,
  incomeId: string
): Promise<void> {
  const docRef = doc(getDb(), "users", userId, "incomes", incomeId);
  await deleteDoc(docRef);
}

// Incomes ko real-time listen karo
export function listenToIncomes(
  userId: string,
  callback: (incomes: Income[]) => void,
  onError: (error: Error) => void
) {
  const colRef = collection(getDb(), "users", userId, "incomes");
  const q = query(colRef, orderBy("createdAt", "desc"));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const incomes: Income[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          date: data.date ?? "",
          description: data.description ?? "",
          source: data.source ?? "",
          amount: data.amount ?? 0,
          createdAt: data.createdAt instanceof Timestamp
            ? data.createdAt.toDate().toISOString()
            : undefined,
          updatedAt: data.updatedAt instanceof Timestamp
            ? data.updatedAt.toDate().toISOString()
            : undefined,
        } as Income;
      });
      callback(incomes);
    },
    (error) => {
      onError(error);
    }
  );

  return unsubscribe;
}
