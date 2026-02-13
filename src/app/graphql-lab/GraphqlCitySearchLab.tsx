"use client";

import { AMADEUS_CITIES_KEYWORD_MIN_LENGTH } from "@/constants";
import { FormEvent, useMemo, useState } from "react";

type QueryType = "cities" | "places" | "users";

type GraphqlResponse = {
  data?: unknown;
  errors?: Array<{
    message: string;
    extensions?: {
      code?: string;
      details?: string;
    };
  }>;
};

const CITY_LIST_ITEM_FRAGMENT = `
  fragment CityListItem on City {
    name
    iataCode
    countryCode
    stateCode
    latitude
    longitude
  }
`;

const PLACE_LIST_ITEM_FRAGMENT = `
  fragment PlaceListItem on PlaceSuggestion {
    placeId
    text
    primaryText
    secondaryText
    types
    distanceMeters
  }
`;

const USER_LIST_ITEM_FRAGMENT = `
  fragment UserListItem on User {
    id
    name
    username
    email
    city
    companyName
  }
`;

const SEARCH_CITIES_QUERY = `
  ${CITY_LIST_ITEM_FRAGMENT}

  query SearchCities($keyword: String!, $max: Int) {
    searchCities(keyword: $keyword, max: $max) {
      count
      cities {
        ...CityListItem
      }
    }
  }
`;

const SEARCH_PLACES_QUERY = `
  ${PLACE_LIST_ITEM_FRAGMENT}

  query SearchPlaces($input: String!, $max: Int) {
    searchPlaces(input: $input, max: $max) {
      count
      places {
        ...PlaceListItem
      }
    }
  }
`;

const SEARCH_USERS_QUERY = `
  ${USER_LIST_ITEM_FRAGMENT}

  query SearchUsers($search: String, $page: Int, $pageSize: Int) {
    users(search: $search, page: $page, pageSize: $pageSize) {
      count
      page
      pageSize
      totalPages
      users {
        ...UserListItem
      }
    }
  }
`;

const QUERY_LABELS: Record<QueryType, string> = {
  cities: "searchCities",
  places: "searchPlaces",
  users: "users",
};

export default function GraphqlCitySearchLab() {
  const [queryType, setQueryType] = useState<QueryType>("cities");
  const [keyword, setKeyword] = useState("new");
  const [max, setMax] = useState(5);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(4);
  const [loading, setLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<GraphqlResponse | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const activeQuery = useMemo(() => {
    if (queryType === "places") return SEARCH_PLACES_QUERY;
    if (queryType === "users") return SEARCH_USERS_QUERY;
    return SEARCH_CITIES_QUERY;
  }, [queryType]);

  const variables = useMemo(() => {
    const trimmedKeyword = keyword.trim();

    if (queryType === "places") {
      return {
        input: trimmedKeyword,
        max,
      };
    }

    if (queryType === "users") {
      return {
        search: trimmedKeyword,
        page,
        pageSize,
      };
    }

    return {
      keyword: trimmedKeyword,
      max,
    };
  }, [queryType, keyword, max, page, pageSize]);

  const canRun = useMemo(() => {
    const trimmedKeyword = keyword.trim();
    if (queryType === "cities") {
      return trimmedKeyword.length >= AMADEUS_CITIES_KEYWORD_MIN_LENGTH;
    }
    if (queryType === "places") {
      return trimmedKeyword.length > 0;
    }
    return true;
  }, [queryType, keyword]);

  const keywordLabel =
    queryType === "users" ? "User search (optional)" : "Keyword";
  const keywordPlaceholder =
    queryType === "cities"
      ? "e.g. new"
      : queryType === "places"
        ? "e.g. coffee"
        : "e.g. leanne";

  const runQuery = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setLastError(null);

    try {
      const response = await fetch("/api/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: activeQuery,
          variables,
        }),
      });

      const json = (await response.json()) as GraphqlResponse;
      setLastResponse(json);

      if (json.errors?.length) {
        setLastError(
          json.errors
            .map((item) =>
              item.extensions?.details
                ? `${item.message}: ${item.extensions.details}`
                : item.message,
            )
            .join("\n"),
        );
      }
    } catch (error) {
      setLastError(
        error instanceof Error ? error.message : "Unknown request error",
      );
      setLastResponse(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">
          Milestone 2: Multi-Query GraphQL Lab
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          This playground sends GraphQL queries to <code>/api/graphql</code> for
          cities, places, and users. Each query uses a reusable fragment.
        </p>
      </div>

      <form onSubmit={runQuery} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="query-type" className="block text-sm font-medium">
            Query
          </label>
          <select
            id="query-type"
            value={queryType}
            onChange={(event) => setQueryType(event.target.value as QueryType)}
            className="w-full rounded-md border px-3 py-2 text-black"
          >
            <option value="cities">searchCities</option>
            <option value="places">searchPlaces</option>
            <option value="users">users</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="keyword" className="block text-sm font-medium">
            {keywordLabel}
          </label>
          <input
            id="keyword"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            className="w-full rounded-md border px-3 py-2 text-black"
            placeholder={keywordPlaceholder}
          />
          {queryType === "cities" && (
            <p className="text-sm text-gray-500">
              Minimum length: {AMADEUS_CITIES_KEYWORD_MIN_LENGTH} characters.
            </p>
          )}
        </div>

        {(queryType === "cities" || queryType === "places") && (
          <div className="space-y-2">
            <label htmlFor="max" className="block text-sm font-medium">
              Max results
            </label>
            <input
              id="max"
              type="number"
              min={1}
              max={20}
              value={max}
              onChange={(event) => setMax(Number(event.target.value) || 1)}
              className="w-full rounded-md border px-3 py-2 text-black"
            />
          </div>
        )}

        {queryType === "users" && (
          <>
            <div className="space-y-2">
              <label htmlFor="page" className="block text-sm font-medium">
                Page
              </label>
              <input
                id="page"
                type="number"
                min={1}
                value={page}
                onChange={(event) => setPage(Number(event.target.value) || 1)}
                className="w-full rounded-md border px-3 py-2 text-black"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="page-size" className="block text-sm font-medium">
                Page size
              </label>
              <input
                id="page-size"
                type="number"
                min={1}
                max={20}
                value={pageSize}
                onChange={(event) =>
                  setPageSize(Number(event.target.value) || 1)
                }
                className="w-full rounded-md border px-3 py-2 text-black"
              />
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={!canRun || loading}
          className="rounded-md bg-blue-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Running..." : `Run ${QUERY_LABELS[queryType]}`}
        </button>
      </form>

      <div className="space-y-2">
        <h3 className="font-semibold">Query</h3>
        <pre className="overflow-x-auto rounded-md border p-3 text-sm">
          {activeQuery}
        </pre>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold">Variables</h3>
        <pre className="overflow-x-auto rounded-md border p-3 text-sm">
          {JSON.stringify(variables, null, 2)}
        </pre>
      </div>

      {lastError && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-red-700">
          {lastError}
        </div>
      )}

      {lastResponse && (
        <div className="space-y-2">
          <h3 className="font-semibold">Response</h3>
          <pre className="overflow-x-auto rounded-md border p-3 text-sm">
            {JSON.stringify(lastResponse, null, 2)}
          </pre>
        </div>
      )}

      <p className="text-sm text-gray-500">
        Want GraphiQL too? Open <code>/api/graphql</code> in the browser during
        dev mode.
      </p>
    </div>
  );
}
