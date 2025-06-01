"use client";

import React, { useState, useMemo } from 'react';
import type { DeviceData, Point as PointType } from '@/types';
import { Card, CardContent } from '@/components/ui/card';

interface MapDisplayProps {
  allDeviceData: DeviceData | null;
  selectedDevices: string[];
}

const MIN_COORD = -5;
const MAX_COORD = 30;
const RANGE = MAX_COORD - MIN_COORD; // 35
const POINT_RADIUS_SVG_UNITS = 0.3; // Radius of points in SVG coordinate units
const LATEST_POINT_RADIUS_SVG_UNITS = 0.5;

// Define a list of distinct colors for paths
const deviceColors = [
  "hsl(var(--primary))", // Deep Sky Blue (theme primary)
  "hsl(150, 70%, 50%)",  // A green
  "hsl(30, 90%, 60%)",   // An orange
  "hsl(270, 70%, 65%)",  // A purple
  "hsl(0, 70%, 60%)",    // A red (different from accent)
];

export function MapDisplay({ allDeviceData, selectedDevices }: MapDisplayProps) {
  const [hoveredPoint, setHoveredPoint] = useState<{ point: PointType; x: number; y: number; color: string } | null>(null);

  const transformCoordinates = (lon: number, lat: number) => {
    // Check if coordinates are valid numbers
    if (typeof lon !== 'number' || isNaN(lon) || typeof lat !== 'number' || isNaN(lat)) {
        // Return a default or off-screen position for invalid data
        return { x: -1000, y: -1000 }; 
    }
    return {
      x: lon,
      y: MIN_COORD + (MAX_COORD - lat), // Invert Y: higher latitude = smaller SVG Y
    };
  };
  
  const pathsToDisplay = useMemo(() => {
    if (!allDeviceData) return [];

    return selectedDevices.map((deviceId, deviceIndex) => {
      const device = allDeviceData[deviceId];
      if (!device || !device.points) return null;

      const pointsArray = Object.values(device.points)
        .filter(p => typeof p.latitude === 'number' && typeof p.longitude === 'number' && p.timestamp) // Ensure points are valid
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      if (pointsArray.length === 0) return null;

      const pathData = pointsArray.map(p => {
        const { x, y } = transformCoordinates(p.longitude, p.latitude);
        return `${x},${y}`;
      }).join(' ');

      const color = deviceColors[deviceIndex % deviceColors.length];

      return {
        id: deviceId,
        pathData,
        points: pointsArray,
        color,
      };
    }).filter(p => p !== null);
  }, [allDeviceData, selectedDevices]);

  return (
    <Card className="w-full h-full shadow-lg overflow-hidden">
      <CardContent className="p-0 w-full h-full">
        <svg
          viewBox={`${MIN_COORD} ${MIN_COORD} ${RANGE} ${RANGE}`}
          preserveAspectRatio="xMidYMid meet"
          width="100%"
          height="100%"
          className="bg-card"
          aria-label="Map of device paths"
        >
          {/* Optional: Add a grid or axes lines for better orientation */}
          {[...Array(RANGE + 1)].map((_, i) => {
            const val = MIN_COORD + i;
            // Subtle grid lines
            return (
              <React.Fragment key={`grid-${i}`}>
                <line x1={MIN_COORD} y1={val} x2={MAX_COORD} y2={val} stroke="hsl(var(--border))" strokeWidth="0.05" />
                <line x1={val} y1={MIN_COORD} x2={val} y2={MAX_COORD} stroke="hsl(var(--border))" strokeWidth="0.05" />
              </React.Fragment>
            )
          })}

          {pathsToDisplay.map(devicePath => {
            if (!devicePath) return null;
            const latestPoint = devicePath.points[devicePath.points.length - 1];
            
            return (
              <g key={devicePath.id}>
                <polyline
                  points={devicePath.pathData}
                  fill="none"
                  stroke={devicePath.color}
                  strokeWidth={0.2} // Reasonable thickness for paths
                  className="map-path"
                  aria-label={`Path for device ${devicePath.id}`}
                />
                {devicePath.points.map((p, index) => {
                  const { x, y } = transformCoordinates(p.longitude, p.latitude);
                  const isLatest = index === devicePath.points.length - 1;
                  return (
                    <circle
                      key={`${devicePath.id}-${p.timestamp}`}
                      cx={x}
                      cy={y}
                      r={isLatest ? LATEST_POINT_RADIUS_SVG_UNITS : POINT_RADIUS_SVG_UNITS}
                      fill={isLatest ? 'hsl(var(--accent))' : devicePath.color}
                      stroke={isLatest ? 'hsl(var(--accent-foreground))' : "none"}
                      strokeWidth={isLatest ? 0.05 : 0}
                      className="map-point cursor-pointer"
                      onMouseEnter={() => setHoveredPoint({ point: p, x, y, color: devicePath.color })}
                      onMouseLeave={() => setHoveredPoint(null)}
                      aria-label={`Point for device ${devicePath.id} at ${new Date(p.timestamp).toLocaleTimeString()}`}
                    />
                  );
                })}
              </g>
            );
          })}

          {hoveredPoint && (
            <g transform={`translate(${hoveredPoint.x} ${hoveredPoint.y})`}>
               <rect
                x={POINT_RADIUS_SVG_UNITS + 0.2}
                y={-(POINT_RADIUS_SVG_UNITS + 1.5)} // Position above the point
                width={12} // Approximate width, adjust as needed
                height={1.5} // Approximate height
                fill="hsl(var(--popover))"
                stroke={hoveredPoint.color}
                strokeWidth="0.05"
                rx="0.2" // Rounded corners
              />
              <text
                x={POINT_RADIUS_SVG_UNITS + 0.5} // Offset for text padding
                y={-(POINT_RADIUS_SVG_UNITS + 0.5)} // Adjust vertical position
                fontSize="0.8" // Smaller font size in SVG units
                fill="hsl(var(--popover-foreground))"
                className="font-sans pointer-events-none" // Tailwind font class won't apply directly, use SVG attributes
                fontFamily="Inter, sans-serif"
                textAnchor="start"
              >
                {new Date(hoveredPoint.point.timestamp).toLocaleString()}
              </text>
            </g>
          )}
        </svg>
      </CardContent>
    </Card>
  );
}
