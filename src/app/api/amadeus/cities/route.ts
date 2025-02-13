import { NextRequest, NextResponse } from "next/server";
import { AMADEUS_AUTH_URL } from "@/constants";
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

    const client = new DynamoDBClient({});
    prodCache = {
        client: commands.DynamoDBDocumentClient.from(client),
        tableName: process.env.DYNAMODB_TABLE_NAME!
    };
}

async function getToken() {
    try {
        let cachedToken;

        if (isDev) {
            // Dev: Use NodeCache
            console.log('getting token from devCache', devCache.get('amadeus_token'));
            cachedToken = devCache.get('amadeus_token');
        } else {
            // Prod: Use DynamoDB
            console.log('getting token from prodCache', prodCache);
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
            // Dev: Cache in NodeCache
            console.log('caching token in devCache', tokenData);
            devCache.set('amadeus_token', tokenData, Math.floor(data.expires_in - 300));
        } else {
            // Prod: Store in DynamoDB
            console.log('caching token in prodCache', tokenData);
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

export async function GET(request: NextRequest): Promise<NextResponse> {
    const keyword = request.nextUrl.searchParams.get('keyword');

    try {
        const token = await getToken();
        const response = await fetch(
            `${AMADEUS_API_URL}/reference-data/locations/cities?keyword=${keyword}&max=10`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        if (!response.ok) {
            if (response.status === 401) {
                // Clear expired token
                if (isDev) {
                    console.log('clearing expired token from devCache');
                    devCache.del('amadeus_token');
                } else {
                    console.log('clearing expired token from prodCache');
                    const deleteCommand = new DeleteCommand({
                        TableName: prodCache.tableName,
                        Key: { key: 'amadeus_token' }
                    });
                    await prodCache.client.send(deleteCommand);
                }
            }

            const errorData = await response.json();
            throw new Error(JSON.stringify({
                status: response.status,
                ...errorData
            }));
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching cities:', error);

        // If it's our structured error, pass it through
        if (error instanceof Error && error.message.startsWith('{')) {
            return NextResponse.json(
                JSON.parse(error.message),
                { status: JSON.parse(error.message).status }
            );
        }

        // For unexpected errors
        return NextResponse.json(
            { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}