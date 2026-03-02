import { Outlet, useNavigate } from "react-router";
import { useState } from "react";
import { PrivacyPolicyModal } from "../components/PrivacyPolicyModal";
import { TermsOfServiceModal } from "../components/TermsOfServiceModal";
import { CookiePolicyModal } from "../components/CookiePolicyModal";

export function AuthLayout() {
  const navigate = useNavigate();
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [cookieModalOpen, setCookieModalOpen] = useState(false);

  const handleNavigate = (page: "privacy" | "terms" | "cookie") => {
    if (page === "privacy") {
      setPrivacyModalOpen(true);
    } else if (page === "terms") {
      setTermsModalOpen(true);
    } else if (page === "cookie") {
      setCookieModalOpen(true);
    }
  };

  return (
    <>
      <Outlet context={{ handleNavigate, navigate }} />
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
    </>
  );
}
