import { Outlet, useNavigate, useLocation } from "react-router";
import { Navigation } from "../components/Navigation";
import { Footer } from "../components/Footer";
import { BookingButton } from "../components/BookingButton";
import { useState, useEffect } from "react";
import { PrivacyPolicyModal } from "../components/PrivacyPolicyModal";
import { TermsOfServiceModal } from "../components/TermsOfServiceModal";
import { CookiePolicyModal } from "../components/CookiePolicyModal";
import { supabase } from "@/lib/supabase";

export function MarketingLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState<{
    email: string;
    name?: string;
  } | null>(null);

  // Modal states
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [cookieModalOpen, setCookieModalOpen] = useState(false);

  // Check for existing session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUser({
          email: session.user.email || "",
          name: session.user.user_metadata?.name,
        });
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUser({
          email: session.user.email || "",
          name: session.user.user_metadata?.name,
        });
      } else {
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = (mode: "signin" | "signup") => {
    navigate(`/auth/${mode}`);
  };

  const handleResourcesClick = (page: "niw" | "eb1a" | "stats") => {
    navigate(`/resources/${page}`);
  };

  const handleNavigate = (page: "privacy" | "terms" | "cookie") => {
    if (page === "privacy") {
      setPrivacyModalOpen(true);
    } else if (page === "terms") {
      setTermsModalOpen(true);
    } else if (page === "cookie") {
      setCookieModalOpen(true);
    }
  };

  const handleAccountClick = () => {
    if (currentUser) {
      navigate("/dashboard/overview");
    }
  };

  // Determine current page for navigation
  const getCurrentPage = () => {
    if (location.pathname === "/") return "home";
    if (location.pathname.startsWith("/resources/niw")) return "niw";
    if (location.pathname.startsWith("/resources/eb1a")) return "eb1a";
    if (location.pathname.startsWith("/resources/stats")) return "stats";
    return "home";
  };

  const getActiveResourcePage = () => {
    if (location.pathname.startsWith("/resources/niw")) return "niw";
    if (location.pathname.startsWith("/resources/eb1a")) return "eb1a";
    if (location.pathname.startsWith("/resources/stats")) return "stats";
    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation
        onAuth={handleAuth}
        onResourcesClick={handleResourcesClick}
        currentPage={getCurrentPage()}
        activeResourcePage={getActiveResourcePage()}
        currentUser={currentUser}
        onAccountClick={handleAccountClick}
        onHomeClick={() => navigate("/")}
      />
      <Outlet />
      <Footer onNavigate={handleNavigate} />
      <BookingButton onAuth={handleAuth} currentUser={currentUser} />

      {/* Modals */}
      <PrivacyPolicyModal
        open={privacyModalOpen}
        onOpenChange={setPrivacyModalOpen}
      />
      <TermsOfServiceModal
        open={termsModalOpen}
        onOpenChange={setTermsModalOpen}
      />
      <CookiePolicyModal
        open={cookieModalOpen}
        onOpenChange={setCookieModalOpen}
      />
    </div>
  );
}
