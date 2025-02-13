"use client";
import { QueryClientProvider } from "@tanstack/react-query";

import { QueryClient } from "@tanstack/react-query";

export const QueryClientLayout = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        experimental_prefetchInRender: true,
      },
    },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

export default QueryClientLayout;
