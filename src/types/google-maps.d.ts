/// <reference types="@types/google.maps" />

export interface GooglePlacesAutocompleteResponse {
    predictions: google.maps.places.AutocompletePrediction[];
    status: google.maps.places.PlacesServiceStatus;
}

export interface GooglePlacesAutocompleteNewResponse {
    suggestions: Array<{
        placePrediction?: {
            place: string;
            placeId: string;
            text: {
                text: string;
                matches?: Array<{
                    startOffset?: number;
                    endOffset: number;
                }>;
            };
            structuredFormat?: {
                mainText: {
                    text: string;
                    matches?: Array<{
                        startOffset?: number;
                        endOffset: number;
                    }>;
                };
                secondaryText?: {
                    text: string;
                };
            };
            types?: string[];
            distanceMeters?: number;
        };
        queryPrediction?: {
            text: {
                text: string;
                matches?: Array<{
                    startOffset?: number;
                    endOffset: number;
                }>;
            };
        };
    }>;
} 