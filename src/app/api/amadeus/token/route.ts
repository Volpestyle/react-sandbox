import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import { AMADEUS_AUTH_URL } from "@/constants";

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const response = await axios.post(
            AMADEUS_AUTH_URL,
            new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: process.env.AMADEUS_API_KEY!,
                client_secret: process.env.AMADEUS_API_SECRET!,
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );

        return NextResponse.json(response.data);
    } catch (error) {
        console.error('Error fetching Amadeus token:', error);
        return NextResponse.json(
            { error },
            { status: 500 }
        );
    }
}