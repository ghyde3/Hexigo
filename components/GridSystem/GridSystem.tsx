import React, { useRef, useEffect, useState } from 'react';

export interface GridConfig {
  radius: number;
  hexSize: number;
  padding: number;
  spacing: number;
}

interface GridSystemProps {
  config: GridConfig;
  children: React.ReactNode;
  onResize?: (width: number, height: number) => void;
}

const GridSystem: React.FC<GridSystemProps> = ({ config, children, onResize }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const { radius, hexSize, padding, spacing } = config;

  // Calculate grid dimensions based on radius and hex size
  useEffect(() => {
    const width = (radius * 2 + 1) * hexSize * 1.5 * spacing + padding * 2;
    const height = (radius * 2 + 1) * hexSize * Math.sqrt(3) * spacing + padding * 2;
    setDimensions({ width, height });
    
    if (onResize) {
      onResize(width, height);
    }
  }, [radius, hexSize, padding, spacing, onResize]);

  // Calculate center offset for the grid
  const centerX = dimensions.width / 2;
  const centerY = dimensions.height / 2;

  return (
    <div className="grid-system overflow-auto border border-gray-300 rounded-lg bg-blue-100">
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        className="mx-auto"
      >
        {/* Grid background */}
        <rect
          x="0"
          y="0"
          width={dimensions.width}
          height={dimensions.height}
          fill="transparent"
        />
        
        {/* Center the grid */}
        <g transform={`translate(${centerX}, ${centerY})`}>
          {/* Optional: Draw grid guidelines */}
          {Array.from({ length: radius * 2 + 1 }, (_, i) => i - radius).map((q) =>
            Array.from({ length: radius * 2 + 1 }, (_, i) => i - radius).map((r) => {
              const s = -q - r;
              // Only show hexes within the radius
              if (Math.max(Math.abs(q), Math.abs(r), Math.abs(s)) <= radius) {
                return (
                  <circle
                    key={`${q},${r},${s}`}
                    cx={hexSize * spacing * (3/2 * q)}
                    cy={hexSize * spacing * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r)}
                    r="2"
                    fill="rgba(0,0,0,0.2)"
                  />
                );
              }
              return null;
            })
          )}
          
          {/* Render children (hex tiles, etc.) */}
          {children}
        </g>
      </svg>
    </div>
  );
};

export default GridSystem; 