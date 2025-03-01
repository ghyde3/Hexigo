import React from 'react';

export type ResourceType = 'desert' | 'ore' | 'wood' | 'brick' | 'sheep' | 'wheat';

export interface HexTileProps {
  resourceType: ResourceType;
  value?: number;
  q: number;
  r: number;
  s: number;
  size: number;
  spacing?: number;
  onClick?: () => void;
  isSelected?: boolean;
  isHighlighted?: boolean;
}

// Resource icons mapping
const resourceIcons: Record<ResourceType, string> = {
  desert: '🏜️',
  ore: '⛏️',
  wood: '🌲',
  brick: '🧱',
  sheep: '🐑',
  wheat: '🌾',
};

// Resource color mapping
const resourceColors: Record<ResourceType, string> = {
  desert: '#e9d8a6',
  ore: '#9c9c9c',
  wood: '#588157',
  brick: '#bc6c25',
  sheep: '#a7c957',
  wheat: '#ffb703',
};

const HexTile: React.FC<HexTileProps> = ({
  resourceType,
  value,
  q,
  r,
  s,
  size,
  spacing = 1.0,
  onClick,
  isSelected = false,
  isHighlighted = false,
}) => {
  // Calculate pixel coordinates from cube coordinates
  const x = size * spacing * (3/2 * q);
  const y = size * spacing * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r);

  // Calculate points for hexagon
  const hexPoints = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i;
    const pointX = size * Math.cos(angle);
    const pointY = size * Math.sin(angle);
    return `${pointX},${pointY}`;
  }).join(' ');

  // Determine stroke color and width based on selection and highlight state
  let strokeColor = '#1f2937'; // Default dark gray
  let strokeWidth = 2;
  
  if (isSelected) {
    strokeColor = 'white';
    strokeWidth = 3;
  } else if (isHighlighted) {
    strokeColor = '#f59e0b'; // Amber for highlighted tiles
    strokeWidth = 4;
  }

  return (
    <g
      transform={`translate(${x}, ${y})`}
      onClick={onClick}
      className="cursor-pointer transition-all duration-200 ease-in-out"
    >
      <polygon
        points={hexPoints}
        fill={resourceColors[resourceType]}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />
      {value !== undefined && (
        <text
          x="0"
          y="0"
          textAnchor="middle"
          dominantBaseline="middle"
          className="font-bold text-lg"
          fill="#1f2937"
        >
          {value}
        </text>
      )}
      <text
        x="0"
        y={value !== undefined ? 20 : 0}
        textAnchor="middle"
        dominantBaseline="middle"
        className="text-2xl"
      >
        {resourceIcons[resourceType]}
      </text>
    </g>
  );
};

export default HexTile; 