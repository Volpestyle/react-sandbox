import { NextRequest, NextResponse } from "next/server";
import { AMADEUS_AUTH_URL } from "@/constants";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const AMADEUS_API_KEY = process.env.AMADEUS_API_KEY;
const AMADEUS_API_SECRET = process.env.AMADEUS_API_SECRET;
const AMADEUS_API_URL = process.env.AMADEUS_API_URL;

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME!;

async function getToken() {
    try {
        // Try to get cached token from DynamoDB
        const getCommand = new GetCommand({
            TableName: TABLE_NAME,
            Key: {
                key: 'amadeus_token'
            }
        });

        const cachedItem = await docClient.send(getCommand);
        const cachedToken = cachedItem.Item;

        if (cachedToken && cachedToken.expiresAt > Date.now()) {
            return cachedToken.token;
        }

        // If no valid token, get new one
        const response = await fetch(AMADEUS_AUTH_URL, {
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
            key: 'amadeus_token',
            token: data.access_token,
            expiresAt: Date.now() + (data.expires_in * 1000) - 300000,
            ttl: Math.floor((Date.now() + (data.expires_in * 1000)) / 1000) // DynamoDB TTL
        };

        // Store in DynamoDB
        const putCommand = new PutCommand({
            TableName: TABLE_NAME,
            Item: tokenData
        });

        await docClient.send(putCommand);
        return data.access_token;
    } catch (error) {
        console.error('Error getting token:', error);
        throw error;
    }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
    const keyword = request.nextUrl.searchParams.get('keyword');

    if (!keyword) {
        return NextResponse.json({ data: [] }, { status: 200 });
    }

    try {
        const token = await getToken();
        const response = await fetch(
            `${AMADEUS_API_URL}/reference-data/locations/cities?keyword=${keyword}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        if (!response.ok) {
            if (response.status === 401) {
                // Delete expired token
                const deleteCommand = new DeleteCommand({
                    TableName: TABLE_NAME,
                    Key: {
                        key: 'amadeus_token'
                    }
                });
                await docClient.send(deleteCommand);

                const newToken = await getToken();
                const retryResponse = await fetch(
                    `${AMADEUS_API_URL}/reference-data/locations/cities?keyword=${keyword}`,
                    {
                        headers: {
                            Authorization: `Bearer ${newToken}`,
                        },
                    }
                );
                if (retryResponse.ok) {
                    return NextResponse.json(await retryResponse.json());
                }
            }
            throw new Error("Failed to fetch cities");
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching cities:', error);
        return NextResponse.json(
            { error: "Failed to fetch cities" },
            { status: 500 }
        );
    }
}