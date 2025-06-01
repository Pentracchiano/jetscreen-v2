"use client";

import React, { useState, useEffect, useRef } from "react";
import { DirectionArrow } from "./components/DirectionArrow";
import SlideHolder from "./components/SlideHolder";
import { PlaneAnimation } from "./components/PlaneAnimation";
import { haversineDistance } from "./lib/haversine";

// Define types that match the structure expected by SlideHolder's new props
type ItemProps = {
  title?: string;
  stat: React.ReactNode | string;
  width?: string;
  textSize?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl";
};
type RowProps = ItemProps[];
type SlideContent = {
  // This structure matches SlideHolder's SlideContentProps
  rows: RowProps[];
};

const CENTER_LAT = parseFloat(process.env.NEXT_PUBLIC_CENTER_LAT || "0");
const CENTER_LON = parseFloat(process.env.NEXT_PUBLIC_CENTER_LON || "0");
const RADIUS_KM = parseFloat(process.env.NEXT_PUBLIC_RADIUS_KM || "0");
const FACING_DIRECTION = parseFloat(process.env.NEXT_PUBLIC_FACING_DIRECTION || "0");

export default function Home() {
  const [statePlaneData, setStatePlaneData] = useState<any>(null);
  const [nearestPlane, setNearestPlane] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState<string>("");
  const currentCallsign = useRef<string>("");
  const splideRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('/ping.mp3');
  }, []);

  const planeInfoSlides: SlideContent[] = React.useMemo(() => {
    // Only create a plane slide if there's data for it
    if (!nearestPlane && !statePlaneData) {
      return [];
    }
    return [
      {
        rows: [
          [ // Row 1
            {
              stat: nearestPlane ? (
                <DirectionArrow
                  planeLocation={{ lat: nearestPlane.lat, lon: nearestPlane.lon }}
                  observerLocation={{ lat: CENTER_LAT, lon: CENTER_LON }}
                  facingDirection={FACING_DIRECTION}
                  size={120}
                />
              ) : "No Aircraft",
              width: "w-1/3",
              textSize: "xl", // Size for the arrow placeholder / "No Aircraft" text
            },
            {
              title: "Flight",
              stat: nearestPlane?.flight?.trim() || statePlaneData?.callsign || "Unknown Flight",
              width: "w-2/3",
              textSize: "5xl",
            },
          ],
          [ // Row 2
            {
              title: "Origin",
              stat: statePlaneData?.origin?.municipality
                ? `${statePlaneData.origin.municipality} (${statePlaneData.origin.iata_code})`
                : "Unknown",
              width: "w-1/3",
              textSize: "3xl",
            },
            {
              // A static Direction arrow pointing right
              stat: <DirectionArrow
                forcedAngle={90}
                size={90}
              />,
              width: "w-1/3",
              textSize: "3xl",
            },
            {
              title: "Destination",
              stat: statePlaneData?.destination?.municipality
                ? `${statePlaneData.destination.municipality} (${statePlaneData.destination.iata_code})`
                : "Unknown",
              width: "w-1/3",
              textSize: "3xl",
            },
          ],
          [ // Row 3
            {
              title: "Altitude",
              stat: nearestPlane?.alt_baro
                ? `${Math.round(nearestPlane.alt_baro * 0.3048)} m`
                : "Unknown",
              width: "w-1/3",
              textSize: "2xl",
            },
            {
              title: "Speed",
              stat: nearestPlane?.gs
                ? `${Math.round(nearestPlane.gs * 1.852)} km/h`
                : "Unknown",
              width: "w-1/3",
              textSize: "2xl",
            },
            {
              title: "Distance",
              stat: `${nearestPlane?.distance ? nearestPlane.distance.toFixed(1) : 'Unknown'} km`,
              width: "w-1/3",
              textSize: "2xl",
            },
          ],
        ],
      },
    ];
  }, [nearestPlane, statePlaneData]); // Removed CENTER_LAT, CENTER_LON, FACING_DIRECTION

  const timeInfoSlides: SlideContent[] = React.useMemo(() => [
    {
      rows: [
        [
          {
            title: "Current Time",
            stat: currentTime,
            width: "w-full",
            textSize: "5xl",
          },
        ],
      ],
    },
  ], [currentTime]);

  const getPlanesAround = async () => {
    setIsLoading(true);
    try {
      const planesAround = await fetch("/api/aircraft");
      const response = await planesAround.json();

      console.debug("Fetched aircraft data:", response);

      const planeDistances = response.ac
        .map((plane: any) => {
          if (!plane.flight || !plane.lat || !plane.lon) {
            return null;
          }
          const distance = haversineDistance(
            CENTER_LAT,
            CENTER_LON,
            plane.lat,
            plane.lon
          );
          if (distance > RADIUS_KM) {
            console.debug(`Distance for ${plane} exceeds radius: ${distance}`, );
            return null;
          }
          return { ...plane, distance };
        })
        .filter((plane: any) => plane !== null);

      if (planeDistances.length === 0) {
        setStatePlaneData(null);
        setNearestPlane(null);
        return;
      }

      try {
        planeDistances.sort((a: any, b: any) => a.distance - b.distance);
        const nearestPlane = planeDistances[0];
        setNearestPlane(nearestPlane);
        
        const nearestPlaneCallsign = nearestPlane?.flight.trim();
        if (currentCallsign.current === nearestPlaneCallsign) {
          return;
        }

        audioRef?.current?.play();
        currentCallsign.current = nearestPlaneCallsign;

        const flightDetails = await fetch(
          `/api/getroute?callsign=${nearestPlaneCallsign}`
        );
        const flightInfo = await flightDetails.json();

        if (flightDetails.ok) {
          const flightRoute = flightInfo.response.flightroute;
          console.log("Flight route:", flightRoute);
          setStatePlaneData(flightRoute);
        } else {
          console.error("Error fetching flight details:", flightInfo.error);
        }
      } catch (error) {
        console.error("Failed to fetch aircraft data", error);
      }
      finally {
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Failed to fetch aircraft data", error);
    }
  };

  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString());
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timeInterval);
  }, []);

  useEffect(() => {
    getPlanesAround();
    // Fetch aircraft data every 10 seconds
    const planeInterval = setInterval(() => {
      getPlanesAround();
    }, 10000);
    return () => clearInterval(planeInterval);
  }, []); 

  const combinedSlides = React.useMemo(() => {
    if (isLoading && planeInfoSlides.length === 0) {
      // Optionally, return a specific loading slide structure
      // For now, just show the time slide if plane data is loading and not yet available
      return timeInfoSlides;
    }
    // If not loading, or if plane slides are available, combine them
    return [...planeInfoSlides, ...timeInfoSlides];
  }, [isLoading, planeInfoSlides, timeInfoSlides]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black relative overflow-hidden">
      <PlaneAnimation />
      <div className="absolute inset-0 z-10">
        <SlideHolder slides={combinedSlides} splideRef={splideRef} />
      </div>
    </main>
  );
}
