"use client";
import React from 'react';
import Arrow from '@elsdoerfer/react-arrow';
import { calculateBearing } from '../lib/haversine';

interface DirectionArrowProps {
  planeLocation?: {
    lat: number;
    lon: number;
  };
  observerLocation?: {
    lat: number;
    lon: number;
  };
  facingDirection?: number;
  size?: number;
  forcedAngle?: number;
}

export function DirectionArrow({
  planeLocation,
  observerLocation,
  facingDirection,
  size = 100,
  forcedAngle 
}: DirectionArrowProps) {
  // Calculate the bearing from observer to plane
  let angle = forcedAngle;
  if (angle === undefined)
  {
    if (observerLocation === undefined || facingDirection === undefined || planeLocation == undefined)
      return null;

    const bearing = calculateBearing(
      observerLocation.lat,
      observerLocation.lon,
      planeLocation.lat,
      planeLocation.lon
    );
    
    // Adjust bearing relative to observer's facing direction
    const relativeBearing = (bearing - facingDirection + 360) % 360;
    angle = relativeBearing;
  }
  
  return (
    <div className="flex justify-center items-center my-2" style={{ height: `${size}px` }}>
      <Arrow
        angle={angle}
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