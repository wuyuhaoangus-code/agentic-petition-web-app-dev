import { Outlet, useLoaderData, useNavigate } from "react-router";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface DashboardLoaderData {
  user: {
    email: string;
    name?: string;
  };
  applicationType: "niw" | "eb1a";
  hasApplication: boolean;
}

export function DashboardLayout() {
  const { user, applicationType } = useLoaderData() as DashboardLoaderData;
  const navigate = useNavigate();

  // 🔧 Development: Temporary paid/unpaid toggle
  const [devPaidOverride, setDevPaidOverride] = useState<boolean | null>(null);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      console.log("User signed out successfully");
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
    }
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  const handleCreateNew = () => {
    navigate("/service-selection");
  };

  // Calculate effective paid status
  const effectivePaidStatus =
    devPaidOverride !== null ? devPaidOverride : false;

  // Create effective user object
  const effectiveUser = {
    ...user,
    isPaidUser: effectivePaidStatus,
  };

  return (
    <Outlet
      context={{
        user: effectiveUser,
        applicationType,
        onSignOut: handleSignOut,
        onBackToHome: handleBackToHome,
        onCreateNew: handleCreateNew,
        devPaidOverride,
        setDevPaidOverride,
      }}
    />
  );
}
