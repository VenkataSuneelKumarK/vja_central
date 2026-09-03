import { QueryClient } from "@tanstack/react-query";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Persisted cache means recently viewed screens still render from cache
// when the device goes offline (§20 of the brief: "show cached content"
// rather than a blank screen). Content is fetched fresh whenever the query
// is stale and the device is back online.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
      gcTime: 24 * 60 * 60 * 1000,
    },
  },
});

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "vja-query-cache",
});
