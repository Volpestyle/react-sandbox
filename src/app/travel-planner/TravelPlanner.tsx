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

  const completionSteps = [
    { label: "DESTINATION", done: !!selectedCity },
    { label: "STOPS", done: selectedPlaces.length > 0 },
    { label: "OWNER", done: !!selectedOwner },
  ];
  const completedCount = completionSteps.filter((s) => s.done).length;

  const payloadString = JSON.stringify(draftPayload, null, 2);
  const payloadLines = payloadString.split("\n");

  return (
    <div className="space-y-4">
      {/* ── Status Bar ── */}
      <div className="tech-border bg-card">
        <div className="px-4 py-3 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <input
              id="trip-name"
              value={tripName}
              onChange={(event) => setTripName(event.target.value)}
              className="bg-transparent text-lg font-semibold outline-none border-b border-transparent hover:border-border-accent focus:border-accent transition-colors min-w-0"
              placeholder="Trip name"
            />
            <span className="text-xs text-muted tracking-wider">{completedCount}/3 COMPLETE</span>
          </div>
          <div className="flex items-center gap-3">
            {completionSteps.map((step) => (
              <div key={step.label} className="flex items-center gap-1.5">
                <span className={`status-dot ${step.done ? "status-dot-online" : "status-dot-idle"}`} />
                <span className="text-[10px] text-muted tracking-wider">{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Grid: 3 search panels ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ── Destination Panel ── */}
        <div className={`tech-border bg-card ${selectedCity ? "tech-border-accent" : ""}`}>
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <span className="text-xs text-muted tracking-wider">DESTINATION</span>
            {selectedCity && (
              <span className="text-xs font-medium text-accent">{selectedCity.name} ({selectedCity.iataCode})</span>
            )}
          </div>
          <div className="p-4 space-y-3">
            <input
              value={citySearch}
              onChange={(event) => setCitySearch(event.target.value)}
              className="input-field"
              placeholder="Search city (min 3 chars)"
            />
            {cityQuery.isLoading && <div className="scan-loader" />}
            {cityQuery.error && (
              <p className="text-xs text-destructive">{cityQuery.error.message}</p>
            )}
            <div className="space-y-1 max-h-64 overflow-y-auto thin-scrollbar">
              {cityOptions.map((city) => {
                const isSelected = selectedCity?.iataCode === city.iataCode;
                return (
                  <button
                    key={`${city.iataCode}-${city.name}`}
                    type="button"
                    onClick={() => setSelectedCity(city)}
                    className={`w-full rounded px-3 py-2 text-left text-sm transition-colors ${
                      isSelected
                        ? "bg-accent-subtle border border-accent/30"
                        : "hover:bg-surface-hover border border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{city.name}</span>
                      <span className="text-[10px] text-muted tracking-wider font-mono">{city.iataCode}</span>
                    </div>
                    <div className="text-xs text-muted">
                      {[city.stateCode, city.countryCode].filter(Boolean).join(", ")}
                    </div>
                  </button>
                );
              })}
              {debouncedCitySearch.trim().length >= MIN_CITY_SEARCH_LEN &&
                !cityQuery.isLoading &&
                cityOptions.length === 0 && (
                  <p className="text-xs text-muted px-3 py-2">No city results.</p>
                )}
            </div>
          </div>
        </div>

        {/* ── Stops Panel ── */}
        <div className={`tech-border bg-card ${selectedPlaces.length > 0 ? "tech-border-accent" : ""}`}>
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <span className="text-xs text-muted tracking-wider">STOPS</span>
            {selectedPlaces.length > 0 && (
              <span className="text-xs font-mono text-accent">{selectedPlaces.length} ADDED</span>
            )}
          </div>
          <div className="p-4 space-y-3">
            <input
              value={placeSearch}
              onChange={(event) => setPlaceSearch(event.target.value)}
              className="input-field"
              placeholder="Search places (coffee, museum, etc.)"
            />
            {placeQuery.isLoading && <div className="scan-loader" />}
            {placeQuery.error && (
              <p className="text-xs text-destructive">{placeQuery.error.message}</p>
            )}
            <div className="space-y-1 max-h-64 overflow-y-auto thin-scrollbar">
              {placeOptions.map((place) => {
                const alreadyAdded = selectedPlaces.some((p) => p.placeId === place.placeId);
                return (
                  <button
                    key={place.placeId}
                    type="button"
                    onClick={() => addPlaceToPlan(place)}
                    disabled={alreadyAdded}
                    className={`w-full rounded px-3 py-2 text-left text-sm transition-colors border ${
                      alreadyAdded
                        ? "border-accent/20 bg-accent-muted opacity-60 cursor-default"
                        : "border-transparent hover:bg-surface-hover"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{place.primaryText ?? place.text}</span>
                      {alreadyAdded && <span className="text-[9px] text-accent tracking-wider">ADDED</span>}
                    </div>
                    {place.secondaryText && (
                      <div className="text-xs text-muted truncate">{place.secondaryText}</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Owner Panel ── */}
        <div className={`tech-border bg-card ${selectedOwner ? "tech-border-accent" : ""}`}>
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <span className="text-xs text-muted tracking-wider">PLANNER OWNER</span>
            {selectedOwner && (
              <span className="text-xs font-medium text-accent">{selectedOwner.name}</span>
            )}
          </div>
          <div className="p-4 space-y-3">
            <input
              value={ownerSearch}
              onChange={(event) => setOwnerSearch(event.target.value)}
              className="input-field"
              placeholder="Search users by name"
            />
            {ownerQuery.isLoading && <div className="scan-loader" />}
            {ownerQuery.error && (
              <p className="text-xs text-destructive">{ownerQuery.error.message}</p>
            )}
            <div className="space-y-1 max-h-64 overflow-y-auto thin-scrollbar">
              {ownerOptions.map((user) => {
                const isSelected = selectedOwner?.id === user.id;
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => setSelectedOwner(user)}
                    className={`w-full rounded px-3 py-2 text-left text-sm transition-colors ${
                      isSelected
                        ? "bg-accent-subtle border border-accent/30"
                        : "hover:bg-surface-hover border border-transparent"
                    }`}
                  >
                    <div className="font-medium">{user.name}</div>
                    <div className="text-xs text-muted">{user.email}</div>
                    {user.companyName && (
                      <div className="text-[10px] text-muted tracking-wider mt-0.5">{user.companyName}</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Row: Itinerary + Payload ── */}
      <div className="grid grid-cols-1 lg:grid-cols-8 gap-4">
        {/* ── Itinerary ── */}
        <div className="lg:col-span-5 tech-border bg-card">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <span className="text-xs text-muted tracking-wider">ITINERARY</span>
            <span className="text-xs text-muted font-mono">{selectedPlaces.length} STOP{selectedPlaces.length !== 1 ? "S" : ""}</span>
          </div>
          <div className="p-4">
            {selectedPlaces.length > 0 ? (
              <div className="space-y-2">
                {selectedPlaces.map((place, index) => (
                  <div
                    key={place.placeId}
                    className="flex items-center gap-3 rounded border border-border px-3 py-2.5 bg-background hover:border-border-accent transition-colors group"
                  >
                    <span className="text-xs font-mono text-muted w-5 text-center shrink-0">{String(index + 1).padStart(2, "0")}</span>
                    <div className="h-4 w-px bg-border" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{place.primaryText ?? place.text}</div>
                      {place.secondaryText && (
                        <div className="text-xs text-muted truncate">{place.secondaryText}</div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removePlaceFromPlan(place.placeId)}
                      className="text-[10px] tracking-wider text-muted hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                    >
                      REMOVE
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-xs text-muted tracking-wider">NO STOPS ADDED</p>
                <p className="text-xs text-muted mt-1">Search and add places from the stops panel above</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Draft Payload (Terminal) ── */}
        <div className="lg:col-span-3 tech-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-card flex items-center justify-between">
            <span className="text-xs text-muted tracking-wider">DRAFT PAYLOAD</span>
            <span className="text-[10px] text-muted tracking-wider font-mono">JSON</span>
          </div>
          <div className="terminal-block p-4 overflow-x-auto thin-scrollbar max-h-96">
            <table className="border-collapse">
              <tbody>
                {payloadLines.map((line, i) => (
                  <tr key={i}>
                    <td className="line-number pr-4 align-top select-none">{i + 1}</td>
                    <td className="whitespace-pre">{line}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
