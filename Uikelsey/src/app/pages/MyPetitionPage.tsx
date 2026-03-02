import { useOutletContext } from "react-router";
import { Workplace } from "../components/Workplace";

interface DashboardContext {
  user: {
    email: string;
    name?: string;
    isPaidUser?: boolean;
  };
  applicationType: "niw" | "eb1a";
  onSignOut: () => void;
  onBackToHome: () => void;
  onCreateNew: () => void;
  devPaidOverride: boolean | null;
  setDevPaidOverride: (value: boolean | null) => void;
}

export function MyPetitionPage() {
  const context = useOutletContext<DashboardContext>();

  return <Workplace {...context} />;
}
