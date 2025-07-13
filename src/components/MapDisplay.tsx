"use client";

import React, { useState, useMemo } from 'react';
import type { DeviceData, Point as PointType } from '@/types';
import { Card, CardContent } from '@/components/ui/card';

import { useCongestionThreshold } from "@/context/CongestionThresholdContext";

interface MapDisplayProps {
  allDeviceData: DeviceData | null;
  selectedDevices: string[];
  showOnlyLatest: boolean;
  stores: DocumentData[];
}

export const MIN_COORD = 0;
export const MAX_COORD = 21;
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

export function MapDisplay({ allDeviceData, selectedDevices, showOnlyLatest, stores }: MapDisplayProps) {
  const { congestionThreshold } = useCongestionThreshold();
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

  const storeCongestionStatus = useMemo(() => {
    const statusMap: { [key: string]: { count: number; status: string } } = {};

    stores.forEach(store => {
      let deviceCount = 0;
      const storeMinX = store.latitude;
      const storeMaxX = store.latitude + store.width;
      const storeMinY = store.longitude;
      const storeMaxY = store.longitude + store.height;

      selectedDevices.forEach(deviceId => {
        const device = allDeviceData?.[deviceId];
        if (device?.points) {
          const pointsArray = Object.values(device.points)
            .filter(p => typeof p.latitude === 'number' && typeof p.longitude === 'number' && p.timestamp)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          
          if (pointsArray.length > 0) {
            const latestPoint = pointsArray[0];
            const { x, y } = transformCoordinates(latestPoint.longitude, latestPoint.latitude);

            // Check if the latest point is within the store's bounding box
            if (x >= storeMinX && x <= storeMaxX && y >= storeMinY && y <= storeMaxY) {
              deviceCount++;
            }
          }
        }
      });

      const status = deviceCount >= congestionThreshold ? "混雑中" : "閑散中";
      statusMap[store.id] = { count: deviceCount, status };
    });

    return statusMap;
  }, [allDeviceData, selectedDevices, stores, transformCoordinates, congestionThreshold]);

  const congestionCircles = useMemo(() => {
    const latestPoints = selectedDevices.map(deviceId => {
      const device = allDeviceData?.[deviceId];
      if (!device?.points) return null;
      const pointsArray = Object.values(device.points)
        .filter(p => typeof p.latitude === 'number' && typeof p.longitude === 'number' && p.timestamp)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return pointsArray.length > 0 ? pointsArray[0] : null;
    }).filter((p): p is PointType => p !== null);

    if (latestPoints.length < 2) return [];

    const gridSize = 5; // Grid size in SVG units
    const grid: { [key: string]: PointType[] } = {};

    latestPoints.forEach(point => {
      const { x, y } = transformCoordinates(point.longitude, point.latitude);
      const gridX = Math.floor(x / gridSize);
      const gridY = Math.floor(y / gridSize);
      const key = `${gridX},${gridY}`;
      if (!grid[key]) {
        grid[key] = [];
      }
      grid[key].push(point);
    });

    const circles: { cx: number; cy: number; r: number }[] = [];

    for (const key in grid) {
      const cellPoints = grid[key];
      if (cellPoints.length >= congestionThreshold) {
        const transformedCellPoints = cellPoints.map(p => transformCoordinates(p.longitude, p.latitude));

        const centerX = transformedCellPoints.reduce((sum, p) => sum + p.x, 0) / transformedCellPoints.length;
        const centerY = transformedCellPoints.reduce((sum, p) => sum + p.y, 0) / transformedCellPoints.length;

        const radius = Math.max(...transformedCellPoints.map(p => {
          const dx = p.x - centerX;
          const dy = p.y - centerY;
          return Math.sqrt(dx * dx + dy * dy);
        }));

        circles.push({
          cx: centerX,
          cy: centerY,
          r: radius + LATEST_POINT_RADIUS_SVG_UNITS, // Add padding
        });
      }
    }

    return circles;
  }, [allDeviceData, selectedDevices, congestionThreshold]);

  return (
    <Card className="w-full h-full shadow-lg overflow-hidden">
      <CardContent className="p-0 w-full h-full">
        <svg
          viewBox={`${MIN_COORD} ${MIN_COORD} ${RANGE} ${RANGE}`}
          preserveAspectRatio="xMidYMid meet"
          width="100%"
          height="100%"
          aria-label="Map of device paths"
        >
          {/* Background Image */}
          <image
            href="/picture/142.png"
            x={MIN_COORD}
            y={MIN_COORD}
            width={RANGE}
            height={RANGE}
            preserveAspectRatio="xMidYMid slice"
            transform={`rotate(0, ${MIN_COORD + RANGE / 2}, ${MIN_COORD + RANGE / 2})`}
          />

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
                  style={{ display: showOnlyLatest ? 'none' : 'block' }}
                />
                {(showOnlyLatest ? [latestPoint] : devicePath.points).map((p, index) => {
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

          {congestionCircles.map((circle, index) => (
            <circle
              key={index}
              cx={circle.cx}
              cy={circle.cy}
              r={circle.r}
              fill="red"
              fillOpacity="0.3"
              stroke="red"
              strokeWidth="0.1"
            />
          ))}

          

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

          {/* Render Stores */}
          {stores.map(store => {
            const congestionInfo = storeCongestionStatus[store.id];
            const statusText = congestionInfo ? congestionInfo.status : "";
            const statusColor = congestionInfo && congestionInfo.status === "混雑中" ? "red" : "green";

            return (
              <g key={store.id}>
                <rect
                  x={store.longitude}
                  y={21-store.latitude}
                  width={store.width}
                  height={store.height}
                  fill="rgba(0, 255, 0, 0.2)" // Green semi-transparent fill
                  stroke="green"
                  strokeWidth="0.1"
                />
                <text
                  x={store.longitude + store.width / 2}
                  y={21-store.latitude + store.height / 2 - 0.5} // Adjust Y to place name above status
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="0.8"
                  fill="black"
                  fontFamily="Inter, sans-serif"
                >
                  {store.name}
                </text>
                {statusText && (
                  <text
                    x={store.longitude + store.width / 2}
                    y={21-store.latitude + store.height / 2 + 0.5} // Adjust Y to place status below name
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="0.7"
                    fill={statusColor}
                    fontFamily="Inter, sans-serif"
                  >
                    {statusText}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </CardContent>
    </Card>
  );
}