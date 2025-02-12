import { NextResponse } from 'next/server';
import axios from 'axios';

const AMADEUS_API_URL = 'https://test.api.amadeus.com/v1';

async function getAccessToken() {
    const response = await axios.post(
        'https://test.api.amadeus.com/v1/security/oauth2/token',
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
    return response.data.access_token;
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const keyword = searchParams.get('keyword');

        if (!keyword) {
            return NextResponse.json({ data: [] });
        }

        const accessToken = await getAccessToken();

        const response = await axios.get(`${AMADEUS_API_URL}/reference-data/locations/cities`, {
            params: {
                keyword,
                include: 'CITIES',
            },
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        return NextResponse.json(response.data);
    } catch (error) {
        console.error('Error fetching cities:', error);
        return NextResponse.json(
            { error: 'Failed to fetch cities' },
            { status: 500 }
        );
    }
} 