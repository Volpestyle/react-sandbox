import { fetchAmadeusCities } from "@/lib/amadeus-cities";
import { AMADEUS_CITIES_KEYWORD_MIN_LENGTH } from "@/constants";
import { GraphQLError } from "graphql";
import { createSchema, createYoga } from "graphql-yoga";

const typeDefs = /* GraphQL */ `
  type Query {
    searchCities(keyword: String!, max: Int = 10): CitySearchResult!
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
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export { yoga as GET, yoga as POST, yoga as OPTIONS };
