import { createRoot } from "react-dom/client";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import App from "./app/App.tsx";
import "./styles/index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App queryClient={queryClient} />
  </QueryClientProvider>,
);