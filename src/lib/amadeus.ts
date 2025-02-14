import NodeCache from "node-cache";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const AMADEUS_API_KEY = process.env.AMADEUS_API_KEY;
const AMADEUS_API_SECRET = process.env.AMADEUS_API_SECRET;
const AMADEUS_API_URL = process.env.AMADEUS_API_URL;

// Use different caching strategies based on environment
const isDev = process.env.NODE_ENV === 'development';

// For development, use in-memory cache
const devCache = isDev ? new NodeCache({ stdTTL: 3600 }) : undefined;

// For production, initialize DynamoDB utilities
let ddbClient: any;

async function getDynamoClient() {
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
export async function getToken() {
    try {
        const cachedToken = await getCachedToken();

        if (cachedToken && cachedToken.expiresAt > Date.now()) {
            return cachedToken.token;
        }

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

        const data = await response.json();

        const tokenData = {
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
        if (isDev && devCache) {
            devCache.del('amadeus_token');
            return;
        }

        const client = await getDynamoClient();

        await client.client.send(new DeleteCommand({
            TableName: client.tableName,
            Key: { key: 'amadeus_token' }
        }));
    } catch (error) {
        console.error('Error clearing token:', error);
        throw error;
    }
}

async function getCachedToken() {
    try {
        if (devCache) {
            return devCache.get('amadeus_token');
        }

        const client = await getDynamoClient();

        const cachedItem = await client.client.send(new GetCommand({
            TableName: client.tableName,
            Key: { key: 'amadeus_token' }
        }));

        return cachedItem.Item;
    } catch (error) {
        console.error('Error getting cached token:', error);
        return null;
    }
}

async function cacheToken(tokenData: any, expiresIn: number) {
    try {
        if (devCache) {
            devCache.set('amadeus_token', tokenData, Math.floor(expiresIn - 300));
            return;
        }

        const client = await getDynamoClient();

        await client.client.send(new PutCommand({
            TableName: client.tableName,
            Item: {
                key: 'amadeus_token',
                ...tokenData,
                ttl: Math.floor((Date.now() + (expiresIn * 1000)) / 1000)
            }
        }));
    } catch (error) {
        console.error('Error caching token:', error);
        // Don't throw - token is still valid even if caching fails
    }
}