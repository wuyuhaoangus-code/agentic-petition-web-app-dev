import { Outlet } from "react-router";
import { Toaster } from "sonner";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router";

export function RootLayout() {
  const navigate = useNavigate();

  // Listen for auth state changes globally
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session?.user?.email);

      if (event === "SIGNED_OUT") {
        navigate("/", { replace: true });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <>
      <Outlet />
      <Toaster />
    </>
  );
}
