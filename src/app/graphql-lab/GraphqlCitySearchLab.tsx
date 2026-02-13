"use client";

import { AMADEUS_CITIES_KEYWORD_MIN_LENGTH } from "@/constants";
import { FormEvent, useMemo, useState } from "react";

type City = {
  type: string;
  subType: string;
  name: string;
  iataCode: string;
  countryCode: string | null;
  stateCode: string | null;
  postalCode: string | null;
  latitude: string | null;
  longitude: string | null;
};

type SearchCitiesResponse = {
  data?: {
    searchCities: {
      count: number;
      cities: City[];
    };
  };
  errors?: Array<{
    message: string;
  }>;
};

const SEARCH_CITIES_QUERY = `
  query SearchCities($keyword: String!, $max: Int) {
    searchCities(keyword: $keyword, max: $max) {
      count
      cities {
        name
        iataCode
        countryCode
        stateCode
        latitude
        longitude
      }
    }
  }
`;

export default function GraphqlCitySearchLab() {
  const [keyword, setKeyword] = useState("new");
  const [max, setMax] = useState(5);
  const [loading, setLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<SearchCitiesResponse | null>(
    null,
  );
  const [lastError, setLastError] = useState<string | null>(null);

  const canRun = keyword.trim().length >= AMADEUS_CITIES_KEYWORD_MIN_LENGTH;
  const variables = useMemo(
    () => ({
      keyword: keyword.trim(),
      max,
    }),
    [keyword, max],
  );

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
          query: SEARCH_CITIES_QUERY,
          variables,
        }),
      });

      const json = (await response.json()) as SearchCitiesResponse;
      setLastResponse(json);

      if (json.errors?.length) {
        setLastError(json.errors.map((item) => item.message).join("\n"));
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
        <h2 className="text-xl font-semibold">Milestone 1: GraphQL Query</h2>
        <p className="text-gray-600 dark:text-gray-300">
          This form sends a GraphQL query to <code>/api/graphql</code> and
          resolves cities from Amadeus through the <code>searchCities</code>{" "}
          field.
        </p>
      </div>

      <form onSubmit={runQuery} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="keyword" className="block text-sm font-medium">
            Keyword
          </label>
          <input
            id="keyword"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            className="w-full rounded-md border px-3 py-2 text-black"
            placeholder="e.g. new"
          />
          <p className="text-sm text-gray-500">
            Minimum length: {AMADEUS_CITIES_KEYWORD_MIN_LENGTH} characters.
          </p>
        </div>

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

        <button
          type="submit"
          disabled={!canRun || loading}
          className="rounded-md bg-blue-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Running..." : "Run Query"}
        </button>
      </form>

      <div className="space-y-2">
        <h3 className="font-semibold">Query</h3>
        <pre className="overflow-x-auto rounded-md border p-3 text-sm">
          {SEARCH_CITIES_QUERY}
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
