import { useQuery } from "@tanstack/react-query";
import type { GooglePlacesAutocompleteNewResponse } from "@/types/google-maps";
import { defaultOptions, type TypeaheadItem } from "@/hooks/api";
import type { GooglePlacesAutocompleteResponse } from "@/types/google-maps";

export const fetchGooglePlacesAutocomplete = async (keyword: string) => {
    if (keyword.length < 1) return { predictions: [] };
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
        select: (data) => data.predictions.map((prediction) => ({
            ...prediction,
            sortBy: prediction.description,
            displayText: prediction.description,
        } as TypeaheadItem)),
        ...defaultOptions,
    });
}

export const fetchGooglePlacesAutocompleteNew = async (keyword: string) => {
    if (keyword.length < 1) return { suggestions: [] };
    const res = await fetch('/api/google/places-autocomplete', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            input: keyword,
            // locationBias: {
            //     circle: {
            //         center: {
            //             latitude: 37.7749,
            //             longitude: -122.4194
            //         },
            //         radius: 5000.0
            //     }
            // }
        })
    });

    if (!res.ok) {
        throw new Error("Failed to fetch places autocomplete");
    }
    const data = await res.json() as GooglePlacesAutocompleteNewResponse;
    return data;
};

export function useGooglePlacesAutocompleteNew(keyword: string) {
    return useQuery({
        queryKey: ["google-places-autocomplete-new", keyword],
        queryFn: () => fetchGooglePlacesAutocompleteNew(keyword),
        select: (data): TypeaheadItem[] =>
            data.suggestions.map((suggestion) => {
                const prediction = suggestion.placePrediction;
                if (!prediction) return null;

                return {
                    ...prediction,
                    sortBy: prediction.text.text,
                    displayText: prediction.text.text,
                    placeId: prediction.placeId
                } as TypeaheadItem;
            }).filter(Boolean) as TypeaheadItem[],
        enabled: keyword.length > 0,
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
        retryDelay: 1000,
    });
}