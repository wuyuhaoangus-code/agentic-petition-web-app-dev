import React, { ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';

// Create a singleton QueryClient
let globalQueryClient: QueryClient | null = null;

function getGlobalQueryClient() {
  if (!globalQueryClient) {
    globalQueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 10 * 60 * 1000, // 10 minutes
          refetchOnWindowFocus: false,
          retry: 1,
        },
      },
    });
  }
  return globalQueryClient;
}

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * A safe wrapper that ensures QueryClient is available.
 * If the component is already wrapped in a QueryClientProvider, it uses that.
 * Otherwise, it creates its own QueryClientProvider.
 */
export function SafeQueryProvider({ children }: QueryProviderProps) {
  // Try to get existing QueryClient
  let hasQueryClient = false;
  try {
    useQueryClient();
    hasQueryClient = true;
  } catch (error) {
    // No QueryClient available
    hasQueryClient = false;
  }

  // If we already have a QueryClient, just render children
  if (hasQueryClient) {
    return <>{children}</>;
  }

  // Otherwise, provide one
  return (
    <QueryClientProvider client={getGlobalQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}
