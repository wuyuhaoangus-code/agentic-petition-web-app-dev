import { useOutletContext, useNavigate } from "react-router";
import { AuthPage } from "../components/AuthPage";
import { clearSessionCache } from "../routes";

interface AuthOutletContext {
  handleNavigate: (page: "privacy" | "terms" | "cookie") => void;
  navigate: ReturnType<typeof useNavigate>;
}

export function SignUpPage() {
  const { handleNavigate, navigate } = useOutletContext<AuthOutletContext>();

  const handleAuthSuccess = (
    user: { email: string; name?: string },
    isNewUser?: boolean
  ) => {
    console.log("Sign up successful:", user);
    // ✅ Clear session cache before navigation to ensure fresh session is loaded
    clearSessionCache();
    // For new users, redirect to service selection
    navigate("/service-selection", { replace: true });
  };

  return (
    <AuthPage
      initialMode="signup"
      onBack={() => navigate("/")}
      onNavigate={handleNavigate}
      onAuthSuccess={handleAuthSuccess}
    />
  );
}