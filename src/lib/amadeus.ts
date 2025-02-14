import NodeCache from "node-cache";
import { GetCommand, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { AmadeusTokenData, AmadeusTokenResponse } from '@/types/amadeus';
import { AMADEUS_TOKEN_KEY, AMADEUS_TOKEN_TABLE_NAME } from "@/constants";
import { getDynamoClient } from "./aws";
const AMADEUS_API_KEY = process.env.AMADEUS_API_KEY;
const AMADEUS_API_SECRET = process.env.AMADEUS_API_SECRET;
const AMADEUS_API_URL = process.env.AMADEUS_API_URL;

// Use different caching strategies based on environment
const isDev = process.env.NODE_ENV === 'development';

// For development, use in-memory cache
// For production, use dynamoDB as cache
const cacheClient = isDev ? new NodeCache({ stdTTL: 3600 }) : getDynamoClient();

/**
 * Retrieves an authentication token for the Amadeus API.
 * First checks for a valid cached token (either in-memory cache for dev or DynamoDB for prod).
 * If no valid cached token exists, requests a new one from the Amadeus API.
 * 
 * The token is cached with an expiration time 5 minutes before the actual expiry
 * to ensure we don't use tokens that are about to expire.
 * 
 * @returns {Promise<string>} The Amadeus API authentication token
 * @throws {Error} If unable to retrieve a token from the Amadeus API
 */
export async function getToken(): Promise<string> {
    try {
        const cachedToken = await getCachedToken();

        if (cachedToken && cachedToken.expiresAt > Date.now()) {
            return cachedToken.token;
        }

        console.log('Fetching new token');
        const response = await fetch(`${AMADEUS_API_URL}/security/oauth2/token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                grant_type: "client_credentials",
                client_id: AMADEUS_API_KEY!,
                client_secret: AMADEUS_API_SECRET!,
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to get token: ${response.status} ${response.statusText}`);
        }

        const data = await response.json() as AmadeusTokenResponse;

        const tokenData: AmadeusTokenData = {
            token: data.access_token,
            expiresAt: Date.now() + (data.expires_in * 1000) - 300000, // 5 minutes buffer
        };

        await cacheToken(tokenData, data.expires_in);

        return data.access_token;
    } catch (error) {
        console.error('Error getting token:', error);
        throw error;
    }
}

export async function clearToken() {
    try {
        if (cacheClient instanceof NodeCache) {
            console.log('Clearing dev cache token');
            cacheClient.del(AMADEUS_TOKEN_KEY);
            return;
        }

        console.log('Clearing DynamoDB token');
        await cacheClient.send(new DeleteCommand({
            TableName: AMADEUS_TOKEN_TABLE_NAME,
            Key: { key: AMADEUS_TOKEN_KEY }
        }));
    } catch (error) {
        console.error('Error clearing token:', error);
        throw error;
    }
}

async function getCachedToken() {
    try {
        if (cacheClient instanceof NodeCache) {
            console.log('Getting cached token from dev cache');
            return cacheClient.get<AmadeusTokenData>(AMADEUS_TOKEN_KEY);
        }

        console.log('Getting cached token from DynamoDB');
        const cachedItem = await cacheClient.send(new GetCommand({
            TableName: AMADEUS_TOKEN_TABLE_NAME,
            Key: { key: AMADEUS_TOKEN_KEY }
        }));

        return cachedItem.Item as AmadeusTokenData;
    } catch (error) {
        console.error('Error getting cached token:', error);
        return;
    }
}

async function cacheToken(tokenData: AmadeusTokenData, expiresIn: number) {
    try {
        if (cacheClient instanceof NodeCache) {
            console.log('Caching token in dev cache');
            cacheClient.set(AMADEUS_TOKEN_KEY, tokenData, Math.floor(expiresIn - 300));
            return;
        }

        console.log('Caching token in DynamoDB');
        await cacheClient.send(new PutCommand({
            TableName: AMADEUS_TOKEN_TABLE_NAME,
            Item: {
                key: AMADEUS_TOKEN_KEY,
                ...tokenData,
                ttl: Math.floor((Date.now() + (expiresIn * 1000)) / 1000)
            }
        }));
    } catch (error) {
        console.error('Error caching token:', error);
    }
}