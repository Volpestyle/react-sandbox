export interface AmadeusTokenData {
    token: string;
    expiresAt: number;
}

export interface AmadeusTokenResponse {
    access_token: string;
    expires_in: number;
}

export interface AmadeusResponse {
    data: Location[];
    included?: {
        airports?: Record<string, Location>;
    };
    meta: {
        count: string;
        links: {
            self: string;
        };
    };
}

interface GeoCode {
    latitude: string;
    longitude: string;
}

interface Address {
    countryCode?: string;
    stateCode?: string;
    postalCode?: string;
}

interface Relationship {
    id: string;
    type: string;
    href: string;
}

export interface Location {
    type: string;
    subType: string;
    name: string;
    iataCode: string;
    address: Address;
    geoCode: GeoCode;
    relationships?: Relationship[];
}

export interface CityResponse {
    data: Array<{
        type: string;
        subType: string;
        name: string;
        iataCode: string;
        address: {
            countryCode: string;
        };
        geoCode: {
            latitude: string;
            longitude: string;
        };
    }>;
} 