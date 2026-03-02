import { createBrowserRouter, redirect } from "react-router";
import { supabase } from "@/lib/supabase";
import { applicationsService } from "./services/applicationsService";

// Layouts
import { RootLayout } from "./layouts/RootLayout";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { AuthLayout } from "./layouts/AuthLayout";
import { MarketingLayout } from "./layouts/MarketingLayout";

// Pages
import { LandingPage } from "./pages/LandingPage";
import { SignInPage } from "./pages/SignInPage";
import { SignUpPage } from "./pages/SignUpPage";
import { ServiceSelectionPage } from "./pages/ServiceSelectionPage";
import { ResourcesNIWPage } from "./pages/ResourcesNIWPage";
import { ResourcesEB1APage } from "./pages/ResourcesEB1APage";
import { ResourcesStatsPage } from "./pages/ResourcesStatsPage";
import { DashboardOverviewPage } from "./pages/DashboardOverviewPage";
import { MyPetitionPage } from "./pages/MyPetitionPage";
import { ExpertReviewPage } from "./pages/ExpertReviewPage";
import { FormsPage } from "./pages/FormsPage";
import { FormPdfViewerPage } from "./pages/FormPdfViewerPage";
import { ExportPackagePage } from "./pages/ExportPackagePage";
import { ExportPackageDetailsPage } from "./pages/ExportPackageDetailsPage";
import { SettingsPage } from "./pages/SettingsPage";
import AdminApp from "./admin/AdminApp";
import { NotFoundPage } from "./pages/NotFoundPage";

// Admin email list
const ADMIN_EMAILS = [
  "admin@dreamcard.ai",
  "kelsey.li@dreamcard.ai",
  "demo@dreamcard.ai",
];

// ✅ Session cache to prevent multiple auth checks
let sessionCache: { session: any; timestamp: number } | null = null;
const SESSION_CACHE_DURATION = 1000; // 1 second cache

// ✅ Export function to clear session cache (for use after login/signup)
export function clearSessionCache() {
  console.log('🧹 Clearing session cache');
  sessionCache = null;
}

async function getAuthSession() {
  const now = Date.now();
  
  // Return cached session if still valid
  if (sessionCache && (now - sessionCache.timestamp) < SESSION_CACHE_DURATION) {
    console.log('🔄 Using cached session');
    return sessionCache.session;
  }
  
  console.log('🔍 Fetching fresh session');
  const { data: { session } } = await supabase.auth.getSession();
  
  // Cache the result
  sessionCache = { session, timestamp: now };
  
  return session;
}

// Clear cache when user signs in/out
supabase.auth.onAuthStateChange((event, session) => {
  console.log('🔐 Auth state changed:', event);
  sessionCache = { session, timestamp: Date.now() };
});

// Auth loader - checks if user is authenticated
async function requireAuth() {
  const session = await getAuthSession();

  if (!session) {
    console.log('❌ No session, redirecting to signin');
    throw redirect("/auth/signin");
  }

  console.log('✅ Session valid, user authenticated');
  return {
    user: {
      email: session.user.email || "",
      name: session.user.user_metadata?.name,
    },
  };
}

// Check if user is already authenticated (for auth pages)
async function checkAuthRedirect() {
  const session = await getAuthSession();

  if (session) {
    console.log('✅ Already logged in, redirecting to dashboard');
    // User is already logged in, redirect to dashboard
    throw redirect("/dashboard/overview");
  }

  console.log('ℹ️ No session, showing auth page');
  return null;
}

// Dashboard loader - requires auth and application type
async function requireDashboard() {
  const authData = await requireAuth();

  // Try to get user's applications
  try {
    const apps = await applicationsService.getApplications();

    if (apps.length > 0) {
      // ✅ FIX: Check localStorage for user's selected application type first
      const savedAppType = localStorage.getItem("dreamcard-app-type");
      let appType: "niw" | "eb1a";

      if (savedAppType === "niw" || savedAppType === "eb1a") {
        // Use saved preference
        appType = savedAppType;
        
        // Verify the user has this type of application
        const typeLabel = appType === "niw" ? "NIW" : "EB-1A";
        const hasMatchingApp = apps.some((a) => a.type === typeLabel);
        
        if (!hasMatchingApp) {
          // User doesn't have this type, use most recent
          const mostRecentApp = apps[0];
          appType = mostRecentApp.type === "NIW" ? "niw" : "eb1a";
          // Update localStorage
          localStorage.setItem("dreamcard-app-type", appType);
        }
      } else {
        // No saved preference, use most recent
        const mostRecentApp = apps[0];
        appType = mostRecentApp.type === "NIW" ? "niw" : "eb1a";
        // Save to localStorage
        localStorage.setItem("dreamcard-app-type", appType);
      }

      return {
        ...authData,
        applicationType: appType,
        hasApplication: true,
      };
    } else {
      // No application found, redirect to service selection
      throw redirect("/service-selection");
    }
  } catch (error) {
    console.error("Error loading applications:", error);
    // If error, redirect to service selection
    throw redirect("/service-selection");
  }
}

// Admin loader - requires auth and admin email
async function requireAdmin() {
  const authData = await requireAuth();

  if (!ADMIN_EMAILS.includes(authData.user.email)) {
    throw redirect("/");
  }

  return authData;
}

// Service selection loader - requires auth
async function requireServiceSelection() {
  const authData = await requireAuth();

  // Check if user already has an application
  try {
    const apps = await applicationsService.getApplications();
    if (apps.length > 0) {
      // User already has an application, redirect to dashboard
      throw redirect("/dashboard/overview");
    }
  } catch (error) {
    console.error("Error checking applications:", error);
  }

  return authData;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      // Marketing pages
      {
        element: <MarketingLayout />,
        children: [
          {
            index: true,
            element: <LandingPage />,
          },
          {
            path: "resources/niw",
            element: <ResourcesNIWPage />,
          },
          {
            path: "resources/eb1a",
            element: <ResourcesEB1APage />,
          },
          {
            path: "resources/stats",
            element: <ResourcesStatsPage />,
          },
        ],
      },

      // Auth pages
      {
        path: "auth",
        element: <AuthLayout />,
        loader: checkAuthRedirect,
        children: [
          {
            path: "signin",
            element: <SignInPage />,
          },
          {
            path: "signup",
            element: <SignUpPage />,
          },
        ],
      },

      // Service selection (protected)
      {
        path: "service-selection",
        element: <ServiceSelectionPage />,
        loader: requireServiceSelection,
      },

      // Dashboard pages (protected)
      {
        path: "dashboard",
        element: <DashboardLayout />,
        loader: requireDashboard,
        children: [
          {
            index: true,
            loader: () => redirect("/dashboard/overview"),
          },
          {
            path: "overview",
            element: <DashboardOverviewPage />,
          },
          {
            path: "my-petition",
            element: <MyPetitionPage />,
          },
          {
            path: "expert-review",
            element: <ExpertReviewPage />,
          },
          {
            path: "forms",
            element: <FormsPage />,
          },
          {
            path: "forms/:formId/how-to-fill",
            element: <FormPdfViewerPage />,
          },
          {
            path: "export-package",
            element: <ExportPackagePage />,
          },
          {
            path: "export-package/:runId",
            element: <ExportPackageDetailsPage />,
          },
          {
            path: "settings",
            element: <SettingsPage />,
          },
        ],
      },

      // Admin page (protected)
      {
        path: "admin",
        element: <AdminApp />,
        loader: requireAdmin,
      },

      // 404 page
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);