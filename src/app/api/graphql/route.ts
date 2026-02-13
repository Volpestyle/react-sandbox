import { fetchAmadeusCities } from "@/lib/amadeus-cities";
import {
  AMADEUS_CITIES_KEYWORD_MIN_LENGTH,
  GOOGLE_PLACES_AUTOCOMPLETE_API_URL,
  USERS_ENDPOINT,
} from "@/constants";
import type { GooglePlacesAutocompleteResponse } from "@/types/google-maps";
import { GraphQLError } from "graphql";
import { createSchema, createYoga } from "graphql-yoga";

type JsonPlaceholderUser = {
  id: number;
  name: string;
  username: string;
  email: string;
  phone: string;
  website: string;
  address?: {
    city?: string;
  };
  company?: {
    name?: string;
  };
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

async function fetchGooglePlacesAutocomplete(input: string) {
  const apiKey = process.env.GOOGLE_MAPS_PLATFORM_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GOOGLE_MAPS_PLATFORM_API_KEY");
  }

  const url = new URL(GOOGLE_PLACES_AUTOCOMPLETE_API_URL);
  url.searchParams.set("input", input);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("types", "geocode");
  url.searchParams.set("language", "en");

  const response = await fetch(url.toString());

  if (!response.ok) {
    const errorData = await response.json().catch(() => null) as {
      error_message?: string;
    } | null;
    throw new Error(
      errorData?.error_message ||
        `Google Places API error: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as GooglePlacesAutocompleteResponse & {
    status?: string;
    error_message?: string;
  };

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(
      data.error_message || `Google Places API error: ${data.status ?? "UNKNOWN"}`,
    );
  }

  return data;
}

const typeDefs = /* GraphQL */ `
  type Query {
    searchCities(keyword: String!, max: Int = 10): CitySearchResult!
    searchPlaces(input: String!, max: Int = 10): PlaceSearchResult!
    users(search: String = "", page: Int = 1, pageSize: Int = 4): UserSearchResult!
  }

  type CitySearchResult {
    count: Int!
    cities: [City!]!
  }

  type City {
    type: String!
    subType: String!
    name: String!
    iataCode: String!
    countryCode: String
    stateCode: String
    postalCode: String
    latitude: String
    longitude: String
  }

  type PlaceSearchResult {
    count: Int!
    places: [PlaceSuggestion!]!
  }

  type PlaceSuggestion {
    placeId: String!
    text: String!
    place: String
    primaryText: String
    secondaryText: String
    types: [String!]!
    distanceMeters: Int
  }

  type UserSearchResult {
    count: Int!
    page: Int!
    pageSize: Int!
    totalPages: Int!
    users: [User!]!
  }

  type User {
    id: ID!
    name: String!
    username: String!
    email: String!
    phone: String!
    website: String!
    city: String
    companyName: String
  }
`;

const resolvers = {
  Query: {
    searchCities: async (
      _parent: unknown,
      args: { keyword: string; max?: number },
    ) => {
      const keyword = args.keyword.trim();
      const max = Math.max(1, Math.min(20, args.max ?? 10));

      if (keyword.length < AMADEUS_CITIES_KEYWORD_MIN_LENGTH) {
        return { count: 0, cities: [] };
      }

      try {
        const data = await fetchAmadeusCities(keyword, max);
        const cities = data.data.map((location) => ({
          type: location.type,
          subType: location.subType,
          name: location.name,
          iataCode: location.iataCode,
          countryCode: location.address.countryCode ?? null,
          stateCode: location.address.stateCode ?? null,
          postalCode: location.address.postalCode ?? null,
          latitude: location.geoCode.latitude ?? null,
          longitude: location.geoCode.longitude ?? null,
        }));

        return {
          count: cities.length,
          cities,
        };
      } catch (error) {
        throw new GraphQLError("Failed to search cities", {
          originalError: error instanceof Error ? error : undefined,
          extensions: {
            code: "UPSTREAM_API_ERROR",
            details:
              error instanceof Error ? error.message : "Unknown upstream error",
          },
        });
      }
    },
    searchPlaces: async (
      _parent: unknown,
      args: { input: string; max?: number },
    ) => {
      const input = args.input.trim();
      const max = clamp(args.max ?? 10, 1, 20);

      if (!input.length) {
        return { count: 0, places: [] };
      }

      try {
        const data = await fetchGooglePlacesAutocomplete(input);
        const places = data.predictions
          .slice(0, max)
          .map((prediction) => ({
            placeId: prediction.place_id,
            text: prediction.description,
            place: null,
            primaryText: prediction.structured_formatting.main_text ?? null,
            secondaryText:
              prediction.structured_formatting.secondary_text ?? null,
            types: prediction.types ?? [],
            distanceMeters: null,
          }));

        return {
          count: places.length,
          places,
        };
      } catch (error) {
        throw new GraphQLError("Failed to search places", {
          originalError: error instanceof Error ? error : undefined,
          extensions: {
            code: "UPSTREAM_API_ERROR",
            details:
              error instanceof Error ? error.message : "Unknown upstream error",
          },
        });
      }
    },
    users: async (
      _parent: unknown,
      args: { search?: string; page?: number; pageSize?: number },
    ) => {
      try {
        const search = args.search?.trim().toLowerCase() ?? "";
        const pageSize = clamp(args.pageSize ?? 4, 1, 20);

        const response = await fetch(
          USERS_ENDPOINT,
        );
        if (!response.ok) {
          throw new Error(
            `Users API error: ${response.status} ${response.statusText}`,
          );
        }

        const users = (await response.json()) as JsonPlaceholderUser[];
        const filteredUsers = users.filter((user) =>
          user.name.toLowerCase().includes(search),
        );

        const totalPages =
          filteredUsers.length > 0
            ? Math.ceil(filteredUsers.length / pageSize)
            : 0;
        const page =
          totalPages > 0 ? clamp(args.page ?? 1, 1, totalPages) : 1;
        const start = (page - 1) * pageSize;
        const paginatedUsers = filteredUsers.slice(start, start + pageSize);

        return {
          count: filteredUsers.length,
          page,
          pageSize,
          totalPages,
          users: paginatedUsers.map((user) => ({
            id: String(user.id),
            name: user.name,
            username: user.username,
            email: user.email,
            phone: user.phone,
            website: user.website,
            city: user.address?.city ?? null,
            companyName: user.company?.name ?? null,
          })),
        };
      } catch (error) {
        throw new GraphQLError("Failed to fetch users", {
          originalError: error instanceof Error ? error : undefined,
          extensions: {
            code: "UPSTREAM_API_ERROR",
            details:
              error instanceof Error ? error.message : "Unknown upstream error",
          },
        });
      }
    },
  },
};

const yoga = createYoga({
  schema: createSchema({
    typeDefs,
    resolvers,
  }),
  graphqlEndpoint: "/api/graphql",
  graphiql: process.env.NODE_ENV !== "production",
  maskedErrors: false,
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export { yoga as GET, yoga as POST, yoga as OPTIONS };
