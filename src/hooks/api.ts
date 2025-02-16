import { AmadeusResponse } from "@/types/amadeus";
import { useQuery } from "@tanstack/react-query";
import { AMADEUS_CITIES_KEYWORD_MIN_LENGTH } from "@/constants";
import { Location } from "@/types/amadeus";
import type { GooglePlacesAutocompleteResponse } from "@/types/google-maps";

const defaultOptions = {
  staleTime: 1000 * 60 * 5, // Keep data fresh for 5 minutes
  gcTime: 1000 * 60 * 10, // Keep unused data in cache for 10 minutes
  retryDelay: 1000,
};

export type TypeaheadItem = {
  sortBy: string;
  displayText: string;
}

export const fetchAmadeusCities = async (keyword: string) => {
  // Api doesn't support searching for less than 2 characters
  if (keyword.length < AMADEUS_CITIES_KEYWORD_MIN_LENGTH) return { data: [] };
  const res = await fetch(
    `/api/amadeus/cities?keyword=${encodeURIComponent(keyword)}`
  );
  if (!res.ok) {
    throw new Error("Failed to fetch cities");
  }
  const data = await res.json() as AmadeusResponse;
  return data;
}

export const fetchGooglePlacesAutocomplete = async (keyword: string) => {
  const res = await fetch(
    `/api/google/places-autocomplete?input=${encodeURIComponent(keyword)}`
  );
  if (!res.ok) {
    throw new Error("Failed to fetch places autocomplete");
  }
  const data = await res.json() as GooglePlacesAutocompleteResponse;
  return data;
};

export function useGooglePlacesAutocomplete(keyword: string) {
  return useQuery({
    queryKey: ["google-places-autocomplete", keyword],
    queryFn: () => fetchGooglePlacesAutocomplete(keyword),
    select: (data): TypeaheadItem[] => data.predictions.map((prediction: google.maps.places.AutocompletePrediction) => ({
      ...prediction,
      sortBy: prediction.description,
      displayText: prediction.description,
    } as TypeaheadItem)),
    ...defaultOptions,
  });
}

export function useAmadeusCitiesSearch(keyword: string) {
  return useQuery({
    queryKey: ["amadeus-cities-search", keyword],
    queryFn: () => fetchAmadeusCities(keyword),
    select: (data): TypeaheadItem[] => data.data.map((location: Location) => ({
      ...location,
      sortBy: location.name,
      displayText: location.name,
    } as TypeaheadItem)),
    ...defaultOptions,
  });
}