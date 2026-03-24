import { useAuth } from "@/hooks/useAuth";
import AuthPage from "./AuthPage";
import DashboardPage from "./DashboardPage";

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return user ? <DashboardPage /> : <AuthPage />;
}
