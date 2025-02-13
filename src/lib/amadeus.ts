import NodeCache from "node-cache";

const AMADEUS_API_KEY = process.env.AMADEUS_API_KEY;
const AMADEUS_API_SECRET = process.env.AMADEUS_API_SECRET;
const AMADEUS_API_URL = process.env.AMADEUS_API_URL;

// Use different caching strategies based on environment
const isDev = process.env.NODE_ENV === 'development';

// For development, use in-memory cache
const devCache = new NodeCache({ stdTTL: 3600 });

// For production, use DynamoDB
let prodCache: any;
let GetCommand: any, PutCommand: any, DeleteCommand: any;

if (!isDev) {
    const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
    const commands = require("@aws-sdk/lib-dynamodb");
    GetCommand = commands.GetCommand;
    PutCommand = commands.PutCommand;
    DeleteCommand = commands.DeleteCommand;

    const client = new DynamoDBClient({
        credentials: {
            accessKeyId: process.env.ACCESS_KEY_ID!,
            secretAccessKey: process.env.SECRET_ACCESS_KEY!
        },
        region: process.env.REGION || 'us-east-1'
    });

    prodCache = {
        client: commands.DynamoDBDocumentClient.from(client),
        tableName: process.env.DYNAMODB_TABLE_NAME!
    };
}

export async function getToken() {
    try {
        let cachedToken;

        if (isDev) {
            cachedToken = devCache.get('amadeus_token');
        } else {
            const getCommand = new GetCommand({
                TableName: prodCache.tableName,
                Key: { key: 'amadeus_token' }
            });
            const cachedItem = await prodCache.client.send(getCommand);
            cachedToken = cachedItem.Item;
        }

        if (cachedToken && cachedToken.expiresAt > Date.now()) {
            return cachedToken.token;
        }

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
            throw new Error("Failed to get token");
        }

        const data = await response.json();
        const tokenData = {
            token: data.access_token,
            expiresAt: Date.now() + (data.expires_in * 1000) - 300000,
        };

        if (isDev) {
            devCache.set('amadeus_token', tokenData, Math.floor(data.expires_in - 300));
        } else {
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

        return data.access_token;
    } catch (error) {
        console.error('Error getting token:', error);
        throw error;
    }
}

export function clearToken() {
    if (isDev) {
        devCache.del('amadeus_token');
    } else {
        return prodCache.client.send(
            new DeleteCommand({
                TableName: prodCache.tableName,
                Key: { key: 'amadeus_token' }
            })
        );
    }
} 