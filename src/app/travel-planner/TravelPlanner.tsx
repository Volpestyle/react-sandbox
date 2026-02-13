"use client";

import { useDebounce } from "@/hooks/util";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

const MIN_CITY_SEARCH_LEN = 3;

type City = {
  name: string;
  iataCode: string;
  countryCode: string | null;
  stateCode: string | null;
  latitude: string | null;
  longitude: string | null;
};

type PlaceSuggestion = {
  placeId: string;
  text: string;
  primaryText: string | null;
  secondaryText: string | null;
  types: string[];
};

type PlannerUser = {
  id: string;
  name: string;
  email: string;
  city: string | null;
  companyName: string | null;
};

type GraphqlError = {
  message: string;
  extensions?: {
    details?: string;
  };
};

type GraphqlResponse<T> = {
  data?: T;
  errors?: GraphqlError[];
};

const CITY_FRAGMENT = `
  fragment CityListItem on City {
    name
    iataCode
    countryCode
    stateCode
    latitude
    longitude
  }
`;

const PLACE_FRAGMENT = `
  fragment PlaceListItem on PlaceSuggestion {
    placeId
    text
    primaryText
    secondaryText
    types
  }
`;

const USER_FRAGMENT = `
  fragment UserListItem on User {
    id
    name
    email
    city
    companyName
  }
`;

const SEARCH_CITIES_QUERY = `
  ${CITY_FRAGMENT}
  query SearchCities($keyword: String!, $max: Int) {
    searchCities(keyword: $keyword, max: $max) {
      cities {
        ...CityListItem
      }
    }
  }
`;

const SEARCH_PLACES_QUERY = `
  ${PLACE_FRAGMENT}
  query SearchPlaces($input: String!, $max: Int) {
    searchPlaces(input: $input, max: $max) {
      places {
        ...PlaceListItem
      }
    }
  }
`;

const SEARCH_USERS_QUERY = `
  ${USER_FRAGMENT}
  query SearchUsers($search: String, $page: Int, $pageSize: Int) {
    users(search: $search, page: $page, pageSize: $pageSize) {
      users {
        ...UserListItem
      }
    }
  }
`;

async function graphqlRequest<TData, TVariables>(
  query: string,
  variables: TVariables,
): Promise<TData> {
  const response = await fetch("/api/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  const json = (await response.json()) as GraphqlResponse<TData>;
  if (!response.ok || json.errors?.length) {
    const message = json.errors
      ?.map((error) =>
        error.extensions?.details
          ? `${error.message}: ${error.extensions.details}`
          : error.message,
      )
      .join("\n");
    throw new Error(message || "GraphQL request failed");
  }

  if (!json.data) {
    throw new Error("GraphQL response missing data");
  }

  return json.data;
}

export default function TravelPlanner() {
  const [tripName, setTripName] = useState("Weekend Escape");
  const [citySearch, setCitySearch] = useState("");
  const [placeSearch, setPlaceSearch] = useState("");
  const [ownerSearch, setOwnerSearch] = useState("");

  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [selectedOwner, setSelectedOwner] = useState<PlannerUser | null>(null);
  const [selectedPlaces, setSelectedPlaces] = useState<PlaceSuggestion[]>([]);

  const debouncedCitySearch = useDebounce(citySearch, 300);
  const debouncedPlaceSearch = useDebounce(placeSearch, 300);
  const debouncedOwnerSearch = useDebounce(ownerSearch, 300);

  const cityQuery = useQuery({
    queryKey: ["travel-planner", "cities", debouncedCitySearch],
    queryFn: () =>
      graphqlRequest<{ searchCities: { cities: City[] } }, { keyword: string; max: number }>(
        SEARCH_CITIES_QUERY,
        { keyword: debouncedCitySearch.trim(), max: 7 },
      ),
    enabled: debouncedCitySearch.trim().length >= MIN_CITY_SEARCH_LEN,
  });

  const placeQuery = useQuery({
    queryKey: ["travel-planner", "places", debouncedPlaceSearch],
    queryFn: () =>
      graphqlRequest<
        { searchPlaces: { places: PlaceSuggestion[] } },
        { input: string; max: number }
      >(SEARCH_PLACES_QUERY, { input: debouncedPlaceSearch.trim(), max: 7 }),
    enabled: debouncedPlaceSearch.trim().length > 0,
  });

  const ownerQuery = useQuery({
    queryKey: ["travel-planner", "owners", debouncedOwnerSearch],
    queryFn: () =>
      graphqlRequest<
        { users: { users: PlannerUser[] } },
        { search: string; page: number; pageSize: number }
      >(SEARCH_USERS_QUERY, {
        search: debouncedOwnerSearch.trim(),
        page: 1,
        pageSize: 6,
      }),
  });

  const cityOptions = cityQuery.data?.searchCities.cities ?? [];
  const placeOptions = placeQuery.data?.searchPlaces.places ?? [];
  const ownerOptions = ownerQuery.data?.users.users ?? [];

  const addPlaceToPlan = (place: PlaceSuggestion) => {
    setSelectedPlaces((current) => {
      if (current.some((item) => item.placeId === place.placeId)) {
        return current;
      }
      return [...current, place];
    });
  };

  const removePlaceFromPlan = (placeId: string) => {
    setSelectedPlaces((current) =>
      current.filter((item) => item.placeId !== placeId),
    );
  };

  const draftPayload = useMemo(
    () => ({
      tripName,
      destination: selectedCity,
      owner: selectedOwner,
      itineraryStops: selectedPlaces.map((place, index) => ({
        order: index + 1,
        placeId: place.placeId,
        title: place.primaryText ?? place.text,
        subtitle: place.secondaryText,
      })),
    }),
    [tripName, selectedCity, selectedOwner, selectedPlaces],
  );

  return (
    <div className="space-y-8">
      <p className="text-gray-600 dark:text-gray-300">
        Product-style page using GraphQL as a BFF: choose destination, add
        suggested stops, and assign a planner owner.
      </p>

      <div className="rounded-lg border p-4 space-y-3">
        <label className="block text-sm font-medium" htmlFor="trip-name">
          Trip Name
        </label>
        <input
          id="trip-name"
          value={tripName}
          onChange={(event) => setTripName(event.target.value)}
          className="w-full rounded-md border px-3 py-2 text-black"
          placeholder="Trip name"
        />
      </div>

      <section className="rounded-lg border p-4 space-y-4">
        <h2 className="text-lg font-semibold">1) Destination</h2>
        <input
          value={citySearch}
          onChange={(event) => setCitySearch(event.target.value)}
          className="w-full rounded-md border px-3 py-2 text-black"
          placeholder="Search city (min 3 chars)"
        />
        {cityQuery.error && (
          <p className="text-sm text-red-600">{cityQuery.error.message}</p>
        )}
        <div className="grid gap-2">
          {cityOptions.map((city) => (
            <button
              key={`${city.iataCode}-${city.name}`}
              type="button"
              onClick={() => setSelectedCity(city)}
              className={`rounded-md border px-3 py-2 text-left transition-colors ${
                selectedCity?.iataCode === city.iataCode
                  ? "bg-blue-600 text-white border-blue-600"
                  : "hover:bg-gray-50 text-black"
              }`}
            >
              <div className="font-medium">
                {city.name} ({city.iataCode})
              </div>
              <div className="text-sm opacity-80">
                {[city.stateCode, city.countryCode].filter(Boolean).join(", ")}
              </div>
            </button>
          ))}
          {debouncedCitySearch.trim().length >= MIN_CITY_SEARCH_LEN &&
            !cityQuery.isLoading &&
            cityOptions.length === 0 && (
              <p className="text-sm text-gray-500">No city results.</p>
            )}
        </div>
      </section>

      <section className="rounded-lg border p-4 space-y-4">
        <h2 className="text-lg font-semibold">2) Stops</h2>
        <input
          value={placeSearch}
          onChange={(event) => setPlaceSearch(event.target.value)}
          className="w-full rounded-md border px-3 py-2 text-black"
          placeholder="Search places (coffee, museum, etc.)"
        />
        {placeQuery.error && (
          <p className="text-sm text-amber-700">{placeQuery.error.message}</p>
        )}
        <div className="grid gap-2">
          {placeOptions.map((place) => (
            <button
              key={place.placeId}
              type="button"
              onClick={() => addPlaceToPlan(place)}
              className="rounded-md border px-3 py-2 text-left hover:bg-gray-50 text-black"
            >
              <div className="font-medium">{place.primaryText ?? place.text}</div>
              <div className="text-sm opacity-70">{place.secondaryText}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-lg border p-4 space-y-4">
        <h2 className="text-lg font-semibold">3) Planner Owner</h2>
        <input
          value={ownerSearch}
          onChange={(event) => setOwnerSearch(event.target.value)}
          className="w-full rounded-md border px-3 py-2 text-black"
          placeholder="Search internal owner"
        />
        {ownerQuery.error && (
          <p className="text-sm text-red-600">{ownerQuery.error.message}</p>
        )}
        <div className="grid gap-2">
          {ownerOptions.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => setSelectedOwner(user)}
              className={`rounded-md border px-3 py-2 text-left transition-colors ${
                selectedOwner?.id === user.id
                  ? "bg-blue-600 text-white border-blue-600"
                  : "hover:bg-gray-50 text-black"
              }`}
            >
              <div className="font-medium">{user.name}</div>
              <div className="text-sm opacity-80">{user.email}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-lg border p-4 space-y-4">
        <h2 className="text-lg font-semibold">Plan Summary</h2>
        {selectedPlaces.length > 0 ? (
          <ul className="space-y-2">
            {selectedPlaces.map((place) => (
              <li
                key={place.placeId}
                className="flex items-center justify-between rounded-md border px-3 py-2"
              >
                <div>
                  <div className="font-medium">
                    {place.primaryText ?? place.text}
                  </div>
                  <div className="text-sm opacity-70">{place.secondaryText}</div>
                </div>
                <button
                  type="button"
                  onClick={() => removePlaceFromPlan(place.placeId)}
                  className="text-sm text-red-600 hover:underline"
                >
                  remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No stops added yet.</p>
        )}

        <div className="space-y-2">
          <h3 className="font-medium">Draft payload</h3>
          <pre className="overflow-x-auto rounded-md border p-3 text-sm">
            {JSON.stringify(draftPayload, null, 2)}
          </pre>
        </div>
      </section>
    </div>
  );
}
