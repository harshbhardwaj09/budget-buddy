import ExpenseInsights from "@/components/ExpenseInsights";
import AuthGuard from "@/components/AuthGuard";

export default function InsightsPage() {
  return (
    <AuthGuard>
      <ExpenseInsights />
    </AuthGuard>
  );
}
