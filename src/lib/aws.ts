import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

export function getDynamoClient() {
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

    return client;
}