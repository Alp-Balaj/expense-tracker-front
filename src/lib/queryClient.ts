import { QueryClient } from "@tanstack/react-query";

// The axios interceptor (AxiosAuthBridge) already retries a request once
// after a token refresh; a second retry layer here would just delay the
// eventual redirect to /login on a truly expired session.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});
