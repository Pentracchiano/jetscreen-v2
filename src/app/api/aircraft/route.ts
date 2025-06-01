import { NextResponse } from "next/server";
import { haversineDistance } from "../../lib/haversine";

export const revalidate = 0;
const API_URL_FORMAT = process.env.ADSB_URL || "";
const CENTER_LAT = parseFloat(process.env.NEXT_PUBLIC_CENTER_LAT || "0");
const CENTER_LON = parseFloat(process.env.NEXT_PUBLIC_CENTER_LON || "0");
const RADIUS_KM = parseFloat(process.env.NEXT_PUBLIC_RADIUS_KM || "0");

const RADIUS_NAUTICAL_MILES = Math.min(Math.round(RADIUS_KM * 0.53996), 250);

const API_URL = API_URL_FORMAT
  .replace("{lat}", CENTER_LAT.toString())
  .replace("{lon}", CENTER_LON.toString())
  .replace("{radius}", RADIUS_NAUTICAL_MILES.toString());

export async function GET_prod() {
  try {
    const response = await fetch(API_URL);

    // Handle unsuccessful requests
    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch aircraft data" },
        { status: response.status }
      );
    }

    // Parse the JSON data from the response
    const data = await response.json();

    // Return the data as a JSON response
    return NextResponse.json(data);
  } catch (error) {
    // Handle any errors that occur during the fetch
    return NextResponse.json(
      { error: "An error occurred while fetching data: " + error },
      { status: 500 }
    );
  }
}

// Store the simulation state between calls
const simulationState = {
  startTime: Date.now(),
  planes: Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    flightNumber: `Flight${i + 1}`,
    altitude: Math.round(10000 + Math.random() * 20000), // Random altitude between 10,000 and 30,000 feet
    speed: Math.round(200 + Math.random() * 300), // Random ground speed between 200 and 500 knots
    circleRadius: 5 + Math.random() * (RADIUS_KM * 0.5), // Random radius in km, but not too close to the center
    rotationPeriod: 120 + Math.random() * 480, // Time to complete a circle in seconds (2-10 minutes)
    startAngle: Math.random() * 2 * Math.PI, // Random starting position
    clockwise: Math.random() > 0.5 // Random direction (clockwise or counterclockwise)
  }))
};

export async function GET() {
  const now = Date.now();
  const elapsedSeconds = (now - simulationState.startTime) / 1000;
  
  // Update each plane's position based on elapsed time
  const updatedPlanes = simulationState.planes.map(plane => {
    // Calculate the current angle based on elapsed time and rotation period
    const angularSpeed = (2 * Math.PI) / plane.rotationPeriod; // radians per second
    const angleChange = angularSpeed * elapsedSeconds;
    const currentAngle = plane.startAngle + (plane.clockwise ? angleChange : -angleChange);
    
    // Calculate new position
    const radiusInMeters = plane.circleRadius * 1000;
    const lat = CENTER_LAT + (radiusInMeters / 111320) * Math.cos(currentAngle);
    const lon = CENTER_LON + (radiusInMeters / (111320 * Math.cos((CENTER_LAT * Math.PI) / 180))) * Math.sin(currentAngle);
    
    // Calculate track (direction of movement) - tangent to the circle
    // For clockwise movement: track = angle + 90°
    // For counterclockwise movement: track = angle - 90°
    let track = ((currentAngle * 180 / Math.PI) + (plane.clockwise ? 90 : -90)) % 360;
    if (track < 0) track += 360;
    
    // Calculate real distance using haversine formula
    const distance = haversineDistance(CENTER_LAT, CENTER_LON, lat, lon);
    
    return {
      flight: plane.flightNumber,
      lat,
      lon,
      alt_baro: plane.altitude,
      gs: plane.speed,
      track: Math.round(track),
      distance: distance.toFixed(1),
      hex: `ABCDEF${plane.id.toString().padStart(2, '0')}`, // Fake hex code for identification
    };
  });
  
  // Select a random plane with some persistence
  const selectedPlaneIndex = Math.floor(now / 30000) % simulationState.planes.length;
  const selectedPlane = updatedPlanes[selectedPlaneIndex];
  
  const response = {
    ac: [selectedPlane],
    ctime: Math.floor(now / 1000),
    msg: "Simulated aircraft data",
    now: Math.floor(now / 1000),
    ptime: Math.floor(now / 1000),
    total: updatedPlanes.length
  };
  
  return NextResponse.json(response);
}