import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

export type DynamoDBClientConfig = {
    client: DynamoDBDocumentClient;
    tableName: string;
};