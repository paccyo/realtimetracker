"use client";

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { MIN_COORD, MAX_COORD } from "@/components/MapDisplay";

interface Store {
  id: string;
  name: string;
  category: string;
  longitude: number;
  latitude: number;
  width: number;
  height: number;
}

interface MapSelectionToolProps {
  onSelectionComplete: (selection: { x: number; y: number; width: number; height: number } | null) => void;
  existingStores: Store[];
}

const MapSelectionTool: React.FC<MapSelectionToolProps> = ({ onSelectionComplete, existingStores }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentRect, setCurrentRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  const svgToMapCoordinates = useCallback((svgX: number, svgY: number) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = svgX;
    pt.y = svgY;
    const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());
    return { x: svgP.x, y: svgP.y };
  }, []);

  const handleMouseDown = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    setIsDrawing(true);
    const { x, y } = svgToMapCoordinates(event.clientX, event.clientY);
    setStartPoint({ x, y });
    setCurrentRect({ x, y, width: 0, height: 0 });
  }, [svgToMapCoordinates]);

  const handleMouseMove = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawing || !startPoint) return;
    const { x, y } = svgToMapCoordinates(event.clientX, event.clientY);

    const newX = Math.min(startPoint.x, x);
    const newY = Math.min(startPoint.y, y);
    const newWidth = Math.abs(x - startPoint.x);
    const newHeight = Math.abs(y - startPoint.y);

    setCurrentRect({ x: newX, y: newY, width: newWidth, height: newHeight });
  }, [isDrawing, startPoint, svgToMapCoordinates]);

  const handleMouseUp = useCallback(() => {
    setIsDrawing(false);
    if (currentRect && (currentRect.width > 0 || currentRect.height > 0)) {
      onSelectionComplete(currentRect);
    } else {
      onSelectionComplete(null);
    }
    setStartPoint(null);
  }, [currentRect, onSelectionComplete]);

  return (
    <div className="relative w-full h-full">
      <svg
        ref={svgRef}
        viewBox={`${MIN_COORD} ${MIN_COORD} ${MAX_COORD - MIN_COORD} ${MAX_COORD - MIN_COORD}`}
        preserveAspectRatio="xMidYMid meet"
        width="100%"
        height="100%"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp} // End drawing if mouse leaves SVG area
        style={{ position: 'absolute', top: 0, left: 0, zIndex: 10 }}
      >
        {/* Background Image */}
        <image
          href="/picture/142.png"
          x={MIN_COORD}
          y={MIN_COORD}
          width={MAX_COORD - MIN_COORD}
          height={MAX_COORD - MIN_COORD}
          preserveAspectRatio="xMidYMid slice"
          transform={`rotate(0, ${(MIN_COORD + MAX_COORD) / 2}, ${(MIN_COORD + MAX_COORD) / 2})`}
        />

        {currentRect && (
          <rect
            x={currentRect.x}
            y={currentRect.y}
            width={currentRect.width}
            height={currentRect.height}
            fill="rgba(0, 123, 255, 0.3)"
            stroke="blue"
            strokeWidth="0.1"
          />
        )}

        {existingStores.map((store) => (
          <rect
            key={store.id}
            x={store.longitude}
            y={21-store.latitude}
            width={store.width}
            height={store.height}
            fill="rgba(255, 0, 0, 0.3)" // Red color for existing stores
            stroke="red"
            strokeWidth="0.1"
          />
        ))}
      </svg>
    </div>
  );
};

export default MapSelectionTool;
