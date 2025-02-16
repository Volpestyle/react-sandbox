import { GOOGLE_PLACES_AUTOCOMPLETE_API_URL } from "@/constants";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const input = searchParams.get("input");
        const sessiontoken = searchParams.get("sessiontoken");

        if (!input) {
            return NextResponse.json(
                { error: "Input parameter is required" },
                { status: 400 }
            );
        }

        // Construct the Google Places Autocomplete API URL
        const url = new URL(GOOGLE_PLACES_AUTOCOMPLETE_API_URL);

        // Add required parameters
        url.searchParams.append("input", input);
        url.searchParams.append("key", process.env.GOOGLE_MAPS_PLATFORM_API_KEY || "");

        // Add optional parameters if provided
        if (sessiontoken) {
            url.searchParams.append("sessiontoken", sessiontoken);
        }

        // Add default parameters
        url.searchParams.append("types", "geocode");
        url.searchParams.append("language", "en");

        // Optional: Add location bias for better results
        // url.searchParams.append("location", "37.7749,-122.4194"); // Example: San Francisco
        // url.searchParams.append("radius", "50000"); // 50km radius

        const response = await fetch(url.toString());

        if (!response.ok) {
            throw new Error(`Google Places API error: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
            throw new Error(data.error_message || `Google Places API error: ${data.status}`);
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Places Autocomplete API error:", error);
        return NextResponse.json(
            { error: "Failed to fetch place suggestions" },
            { status: 500 }
        );
    }
}
