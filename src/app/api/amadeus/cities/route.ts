import { NextRequest, NextResponse } from "next/server";
import { getToken, clearToken } from "@/lib/amadeus";
import { AMADEUS_API_URL } from "@/constants";

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
                await clearToken();
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