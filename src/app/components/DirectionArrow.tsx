"use client";
import React from 'react';
import Arrow from '@elsdoerfer/react-arrow';
import { calculateBearing } from '../lib/haversine';

interface DirectionArrowProps {
  planeLocation: {
    lat: number;
    lon: number;
  } | null;
  observerLocation: {
    lat: number;
    lon: number;
  };
  facingDirection: number;
  size?: number;
}

export function DirectionArrow({
  planeLocation,
  observerLocation,
  facingDirection,
  size = 100
}: DirectionArrowProps) {
  if (!planeLocation) return null;

  // Calculate the bearing from observer to plane
  const bearing = calculateBearing(
    observerLocation.lat,
    observerLocation.lon,
    planeLocation.lat,
    planeLocation.lon
  );
  
  // Adjust bearing relative to observer's facing direction
  const relativeBearing = (bearing - facingDirection + 360) % 360;
  
  return (
    <div className="flex justify-center items-center my-2" style={{ height: `${size}px` }}>
      <Arrow
        angle={relativeBearing}
        length={size * 0.8}
        lineWidth={size / 35}
        color="white"
        style={{
          width: `${size}px`,
          height: `${size}px`
        }}
      />
    </div>
  );
}