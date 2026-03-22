import BudgetDashboard from "@/components/BudgetDashboard";
import AuthGuard from "@/components/AuthGuard";

export default function Home() {
  return (
    <AuthGuard>
      <BudgetDashboard />
    </AuthGuard>
  );
}
