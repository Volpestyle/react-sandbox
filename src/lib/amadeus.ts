import NodeCache from "node-cache";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClientConfig } from "@/types/aws";
import { AmadeusTokenData, AmadeusTokenResponse } from '@/types/amadeus';
import { AMADEUS_TOKEN_KEY } from "@/constants";

const AMADEUS_API_KEY = process.env.AMADEUS_API_KEY;
const AMADEUS_API_SECRET = process.env.AMADEUS_API_SECRET;
const AMADEUS_API_URL = process.env.AMADEUS_API_URL;

// Use different caching strategies based on environment
const isDev = process.env.NODE_ENV === 'development';

// For development, use in-memory cache
const devCache = isDev ? new NodeCache({ stdTTL: 3600 }) : undefined;

// For production, initialize DynamoDB utilities
let ddbClient: DynamoDBClientConfig;

async function getDynamoClientConfig() {
    if (!ddbClient) {

        const accessKeyId = process.env.ACCESS_KEY_ID;
        const secretAccessKey = process.env.SECRET_ACCESS_KEY;
        const region = process.env.REGION || 'us-east-1';

        if (!accessKeyId || !secretAccessKey) {
            throw new Error('AWS credentials not properly configured');
        }

        const client = new DynamoDBClient({
            credentials: { accessKeyId, secretAccessKey },
            region
        });



        ddbClient = {
            client: DynamoDBDocumentClient.from(client),
            tableName: process.env.DYNAMODB_TABLE_NAME!
        };
    }
    return ddbClient;
}

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
        if (devCache) {
            console.log('Clearing dev cache token');
            devCache.del(AMADEUS_TOKEN_KEY);
            return;
        }

        const config = await getDynamoClientConfig();

        console.log('Clearing DynamoDB token');
        await config.client.send(new DeleteCommand({
            TableName: config.tableName,
            Key: { key: AMADEUS_TOKEN_KEY }
        }));
    } catch (error) {
        console.error('Error clearing token:', error);
        throw error;
    }
}

async function getCachedToken() {
    try {
        if (devCache) {
            console.log('Getting cached token from dev cache');
            return devCache.get<AmadeusTokenData>(AMADEUS_TOKEN_KEY);
        }

        const config = await getDynamoClientConfig();

        console.log('Getting cached token from DynamoDB');
        const cachedItem = await config.client.send(new GetCommand({
            TableName: config.tableName,
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
        if (devCache) {
            console.log('Caching token in dev cache');
            devCache.set(AMADEUS_TOKEN_KEY, tokenData, Math.floor(expiresIn - 300));
            return;
        }

        const config = await getDynamoClientConfig();

        console.log('Caching token in DynamoDB');
        await config.client.send(new PutCommand({
            TableName: config.tableName,
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