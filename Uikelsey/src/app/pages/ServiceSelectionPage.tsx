import { useLoaderData, useNavigate } from "react-router";
import { ServiceSelection } from "../components/ServiceSelection";
import { applicationsService } from "../services/applicationsService";
import { toast } from "sonner";

interface ServiceSelectionLoaderData {
  user: {
    email: string;
    name?: string;
  };
}

export function ServiceSelectionPage() {
  const { user } = useLoaderData() as ServiceSelectionLoaderData;
  const navigate = useNavigate();

  const handleServiceSelect = async (path: "niw" | "eb1a") => {
    try {
      // Check if app exists
      const apps = await applicationsService.getApplications();
      const typeLabel = path === "niw" ? "NIW" : "EB-1A";
      const existing = apps.find((a) => a.type === typeLabel);

      if (!existing) {
        await applicationsService.createApplication({
          name: `${user.name || "User"}'s ${typeLabel} Application`,
          type: typeLabel as "NIW" | "EB-1A",
        });
        toast.success(`Created new ${typeLabel} application`);
      }

      // Save to localStorage for persistence
      localStorage.setItem("dreamcard-app-type", path);

      // Navigate to dashboard
      navigate("/dashboard/overview", { replace: true });
    } catch (e: any) {
      console.error("Failed to create application", e);
      toast.error(`Failed to create application: ${e.message}`);
    }
  };

  const handleBack = () => {
    navigate("/");
  };

  return (
    <ServiceSelection
      onSelect={handleServiceSelect}
      onBack={handleBack}
      currentUser={user}
    />
  );
}
