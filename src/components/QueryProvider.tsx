'use client';

import { QueryClient, QueryClientProvider as TanstackQueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'; // Re-add this import
import React from 'react';
import { AxiosError } from 'axios';
import logger from '@/lib/logger'; // Import the logger

const COMPONENT_NAME = "QueryProvider";

// Create a new QueryClient instance
// It's good practice to create the client outside the component or memoize it
// to prevent re-creating it on every render.
// For client components, useState is a good way to ensure it's created once per component instance.
export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(() => {
    logger.info(COMPONENT_NAME, "Initializing QueryClient with default options.");
    return new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 1000 * 60 * 5, // 5 minutes
          retry: (failureCount, error) => {
            const axiosError = error as AxiosError; // Cast to AxiosError
            if (axiosError.response?.status === 404) return false; // Don't retry on 404
            if (axiosError.response?.status === 401) return false; // Don't retry on 401
            return failureCount < 2; // Retry a few times for other errors
          },
          refetchOnWindowFocus: false, // Optional: disable refetch on window focus
        },
        mutations: {
          retry: (failureCount, error) => {
            const axiosError = error as AxiosError;
            if (axiosError.response?.status === 401 || axiosError.response?.status === 404) return false;
            return failureCount < 1; // Retry mutations once for other errors
          }
        }
      },
    });
  }); // End of useState initializer

  logger.debug(COMPONENT_NAME, "QueryProvider rendered.");

  return (
    <TanstackQueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} /> {/* Uncommented for development use */}
    </TanstackQueryClientProvider>
  );
}
