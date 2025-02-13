import { AmadeusResponse } from "@/types/amadeus";
import { useQuery } from "@tanstack/react-query";

const defaultOptions = {
  staleTime: 1000 * 60 * 5, // Keep data fresh for 5 minutes
  gcTime: 1000 * 60 * 10, // Keep unused data in cache for 10 minutes
  retryDelay: 1000,
};

export function useCitiesSearch(keyword: string) {
  return useQuery<AmadeusResponse>({
    queryKey: ["cities", keyword],
    queryFn: async () => {
      const res = await fetch(
        `/api/amadeus/cities?keyword=${encodeURIComponent(keyword)}`
      );
      if (!res.ok) {
        throw new Error("Failed to fetch cities");
      }
      return res.json();
    },
    ...defaultOptions,
  });
}
