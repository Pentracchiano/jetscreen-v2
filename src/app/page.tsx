"use client";
import { useEffect, useRef, useState } from "react";
import SlideHolder from "./components/SlideHolder";
import { PlaneAnimation } from "./components/PlaneAnimation";
import { DirectionArrow } from "./components/DirectionArrow";
import { haversineDistance } from "./lib/haversine";

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

  const planeSlide = [
    {
      title: "",
      stat: nearestPlane ? (
        <DirectionArrow
          planeLocation={nearestPlane ? { lat: nearestPlane.lat, lon: nearestPlane.lon } : null}
          observerLocation={{ lat: CENTER_LAT, lon: CENTER_LON }}
          facingDirection={FACING_DIRECTION}
          size={80}
        />
      ) : "No Aircraft",
      width: "w-full",
      textSize: "xl",
    },
    {
      title: "Flight",
      stat: nearestPlane?.flight?.trim() || statePlaneData?.callsign || "Unknown Flight",
      width: "w-full",
      textSize: "xl",
    },
    {
      title: "Origin",
      stat: statePlaneData?.origin?.municipality 
        ? `${statePlaneData.origin.municipality} (${statePlaneData.origin.iata_code})`
        : "Unknown",
      width: "w-1/2",
      textSize: "lg",
    },
    {
      title: "Destination",
      stat: statePlaneData?.destination?.municipality
        ? `${statePlaneData.destination.municipality} (${statePlaneData.destination.iata_code})`
        : "Unknown",
      width: "w-1/2",
      textSize: "lg",
    },
    {
      title: "Altitude",
      stat: nearestPlane?.alt_baro
        ? `${Math.round(nearestPlane.alt_baro)} ft`
        : "Unknown",
      width: "w-1/3",
      textSize: "md",
    },
    {
      title: "Speed",
      stat: nearestPlane?.gs 
        ? `${Math.round(nearestPlane.gs * 1.852)} km/h`
        : "Unknown",
      width: "w-1/3",
      textSize: "md",
    },
    {
      title: "Distance",
      stat: `${nearestPlane?.distance ? nearestPlane.distance.toFixed(1) : 'Unknown'} km`,
      width: "w-1/3",
      textSize: "md",
    },
    {
      title: "Heading",
      stat: `${nearestPlane?.track ? `${Math.round(nearestPlane.track)}°` : 'Unknown'}`,
      width: "w-full",
      textSize: "sm",
    }
  ];

  const slides = [
    {
      title: "Current Time",
      stat: currentTime,
      width: "w-full",
    },
  ];

  const getPlanesAround = async () => {
    try {
      const planesAround = await fetch("/api/aircraft");
      const response = await planesAround.json();

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
    } catch (error) {
      console.error("Failed to fetch aircraft data", error);
    }
  };

  useEffect(() => {
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

  return (
    <div className="min-h-screen w-full bg-black">
      {statePlaneData && <PlaneAnimation />}
      <SlideHolder
        slides={statePlaneData ? planeSlide : slides}
        splideRef={splideRef}
      />
    </div>
  );
}
