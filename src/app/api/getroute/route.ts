import { NextRequest, NextResponse } from "next/server";

const FLIGHT_DETAILS_URL = process.env.NEXT_PUBLIC_FLIGHT_DETAILS_URL || "";
const TESTING = (process.env.TESTING === "true");

export async function GET_prod(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  // Extract the callsign from the query parameters
  const callsign = searchParams.get("callsign");
  if (!callsign) {
    return NextResponse.json(
      { error: "No callsign provided" },
      { status: 400 }
    );
  }

  try {
    // Fetch data from the external API
    const flightDetails = await fetch(`${FLIGHT_DETAILS_URL}${callsign}`);

    // Handle unsuccessful requests
    if (!flightDetails.ok) {
      return NextResponse.json(
        { error: "Failed to fetch flight details" },
        { status: flightDetails.status }
      );
    }

    // Parse the JSON data from the response
    const flightInfo = await flightDetails.json();

    // Return the data as a JSON response
    return NextResponse.json(flightInfo);
  } catch (error) {
    console.error("Error fetching flight details:", error); // Log the error for debugging
    return NextResponse.json(
      { error: "An error occurred while fetching flight data" },
      { status: 500 }
    );
  }
}
export async function GET_test(request: NextRequest) {
  // Synthetic data
  return NextResponse.json({
    "response": {
      flightroute: {
         flight: "PENTRA",
          origin: {
            municipality: "Pentra", iata_code: "PEN"
          },
          destination: {
            municipality: "Destination City", iata_code: "DST"
          }
         },
    },
  });
}

export async function GET(request: NextRequest) {
  if (TESTING) {
    return GET_test(request);
  }

  return await GET_prod(request);
}
