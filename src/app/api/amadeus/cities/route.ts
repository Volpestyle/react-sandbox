import { NextRequest, NextResponse } from "next/server";
import { fetchAmadeusCities } from "@/lib/amadeus-cities";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const keyword = request.nextUrl.searchParams.get("keyword")?.trim();
  const maxParam = request.nextUrl.searchParams.get("max");
  const max = maxParam ? Number(maxParam) : 10;

  if (!keyword) {
    return NextResponse.json(
      { error: "keyword query parameter is required" },
      { status: 400 },
    );
  }

  try {
    const data = await fetchAmadeusCities(keyword, Number.isNaN(max) ? 10 : max);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching cities:", error);

    // If it's our structured error, pass it through
    if (error instanceof Error && error.message.startsWith("{")) {
      const parsedError = JSON.parse(error.message) as { status: number };
      return NextResponse.json(parsedError, { status: parsedError.status });
    }

    // For unexpected errors
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
