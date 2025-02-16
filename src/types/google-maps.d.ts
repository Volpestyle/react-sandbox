/// <reference types="@types/google.maps" />

export interface GooglePlacesAutocompleteResponse {
    predictions: google.maps.places.AutocompletePrediction[];
    status: google.maps.places.PlacesServiceStatus;
}
