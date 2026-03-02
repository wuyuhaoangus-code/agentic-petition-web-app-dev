import { useOutletContext, useNavigate } from "react-router";
import { AuthPage } from "../components/AuthPage";
import { clearSessionCache } from "../routes";

interface AuthOutletContext {
  handleNavigate: (page: "privacy" | "terms" | "cookie") => void;
  navigate: ReturnType<typeof useNavigate>;
}

export function SignInPage() {
  const { handleNavigate, navigate } = useOutletContext<AuthOutletContext>();

  const handleAuthSuccess = (
    user: { email: string; name?: string },
    isNewUser?: boolean
  ) => {
    console.log("Sign in successful:", user);
    // ✅ Clear session cache before navigation to ensure fresh session is loaded
    clearSessionCache();
    // For returning users, go directly to dashboard
    navigate("/dashboard/overview", { replace: true });
  };

  return (
    <AuthPage
      initialMode="signin"
      onBack={() => navigate("/")}
      onNavigate={handleNavigate}
      onAuthSuccess={handleAuthSuccess}
    />
  );
}