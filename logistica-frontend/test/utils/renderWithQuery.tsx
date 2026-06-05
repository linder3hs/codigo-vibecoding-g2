import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
}

function Wrapper({ children }: { children: ReactNode }) {
  const queryClient = makeQueryClient();
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

function renderWithQuery(ui: React.ReactElement) {
  return render(ui, { wrapper: Wrapper });
}

function renderHookWithQuery<T>(hook: () => T) {
  return renderHook(hook, { wrapper: Wrapper });
}

export { renderWithQuery, renderHookWithQuery, makeQueryClient };
