import NodeCache from "node-cache";

const AMADEUS_API_KEY = process.env.AMADEUS_API_KEY;
const AMADEUS_API_SECRET = process.env.AMADEUS_API_SECRET;
const AMADEUS_API_URL = process.env.AMADEUS_API_URL;

// Use different caching strategies based on environment
const isDev = process.env.NODE_ENV === 'development';

// For development, use in-memory cache
const devCache = isDev ? new NodeCache({ stdTTL: 3600 }) : undefined;


// For production, use DynamoDB
let prodCache: any;
let GetCommand: any, PutCommand: any, DeleteCommand: any;

if (!isDev) {
    const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
    const commands = require("@aws-sdk/lib-dynamodb");
    GetCommand = commands.GetCommand;
    PutCommand = commands.PutCommand;
    DeleteCommand = commands.DeleteCommand;

    // Add credential validation
    const accessKeyId = process.env.ACCESS_KEY_ID;
    const secretAccessKey = process.env.SECRET_ACCESS_KEY;
    const region = process.env.REGION || 'us-east-1';

    if (!accessKeyId || !secretAccessKey) {
        console.error('AWS credentials not found:', {
            hasAccessKey: !!accessKeyId,
            hasSecretKey: !!secretAccessKey,
            region
        });
        throw new Error('AWS credentials not properly configured');
    }

    console.log('Initializing DynamoDB client with:', {
        hasAccessKey: !!accessKeyId,
        accessKeyLength: accessKeyId?.length,
        hasSecretKey: !!secretAccessKey,
        secretKeyLength: secretAccessKey?.length,
        region
    });

    const client = new DynamoDBClient({
        credentials: {
            accessKeyId,
            secretAccessKey
        },
        region
    });

    prodCache = {
        client: commands.DynamoDBDocumentClient.from(client),
        tableName: process.env.DYNAMODB_TABLE_NAME!
    };
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
        console.log('Getting Amadeus authentication token...');
        let cachedToken;

        if (devCache) {
            console.log('Using development in-memory cache');
            cachedToken = devCache.get('amadeus_token');
        } else {
            console.log('Using production DynamoDB cache');
            const getCommand = new GetCommand({
                TableName: prodCache.tableName,
                Key: { key: 'amadeus_token' }
            });
            const cachedItem = await prodCache.client.send(getCommand);
            cachedToken = cachedItem.Item;
        }

        if (cachedToken && cachedToken.expiresAt > Date.now()) {
            console.log('Using cached token valid until', new Date(cachedToken.expiresAt).toISOString());
            return cachedToken.token;
        }

        console.log('No valid cached token found, requesting new token from Amadeus API');
        // If no valid token, get new one
        const response = await fetch(AMADEUS_API_URL + "/security/oauth2/token", {
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
            console.error('Failed to get token from Amadeus API:', response.status, response.statusText);
            throw new Error("Failed to get token");
        }

        const data = await response.json();
        console.log('Successfully received new token from Amadeus API');

        const tokenData = {
            token: data.access_token,
            expiresAt: Date.now() + (data.expires_in * 1000) - 300000, // 5 minutes buffer
        };

        if (devCache) {
            console.log('Caching token in development memory cache');
            devCache.set('amadeus_token', tokenData, Math.floor(data.expires_in - 300));
        } else {
            console.log('Caching token in production DynamoDB');
            const putCommand = new PutCommand({
                TableName: prodCache.tableName,
                Item: {
                    key: 'amadeus_token',
                    ...tokenData,
                    ttl: Math.floor((Date.now() + (data.expires_in * 1000)) / 1000)
                }
            });
            await prodCache.client.send(putCommand);
        }

        console.log('Token cached successfully, expires at', new Date(tokenData.expiresAt).toISOString());
        return data.access_token;
    } catch (error) {
        console.error('Error getting token:', error);
        throw error;
    }
}

export function clearToken() {
    console.log('Clearing cached Amadeus token');
    if (devCache) {
        console.log('Clearing token from development memory cache');
        devCache.del('amadeus_token');
    } else {
        console.log('Clearing token from production DynamoDB');
        return prodCache.client.send(
            new DeleteCommand({
                TableName: prodCache.tableName,
                Key: { key: 'amadeus_token' }
            })
        );
    }
} 