import { AMADEUS_API_URL } from "@/constants";
import { clearToken, getToken } from "@/lib/amadeus";
import type { AmadeusResponse } from "@/types/amadeus";

export async function fetchAmadeusCities(
  keyword: string,
  max = 10,
): Promise<AmadeusResponse> {
  const token = await getToken();
  const endpoint = new URL(`${AMADEUS_API_URL}/reference-data/locations/cities`);
  endpoint.searchParams.set("keyword", keyword);
  endpoint.searchParams.set("max", String(max));

  const response = await fetch(endpoint.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      await clearToken();
    }

    let errorPayload: unknown = null;
    try {
      errorPayload = await response.json();
    } catch {
      errorPayload = { error: response.statusText };
    }

    throw new Error(
      JSON.stringify({
        status: response.status,
        ...((errorPayload as Record<string, unknown>) ?? {}),
      }),
    );
  }

  return (await response.json()) as AmadeusResponse;
}
