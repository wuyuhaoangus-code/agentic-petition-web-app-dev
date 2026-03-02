import { RouterProvider } from "react-router";
import { router } from "./routes";
import { QueryClient } from "@tanstack/react-query";

interface AppProps {
  queryClient?: QueryClient;
}

// Fallback component shown during initial hydration
function HydrateFallback() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#ffffff',
    }}>
      <div style={{
        textAlign: 'center',
        color: '#434E87',
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #f3f4f6',
          borderTop: '3px solid #434E87',
          borderRadius: '50%',
          margin: '0 auto 16px',
          animation: 'spin 1s linear infinite',
        }} />
        <p style={{ fontSize: '14px', color: '#6b7280' }}>Loading...</p>
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function App({ queryClient }: AppProps = {}) {
  return <RouterProvider router={router} hydrateFallbackElement={<HydrateFallback />} />;
}