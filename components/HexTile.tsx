import React from 'react';
import { ResourceType } from '../lib/types';

interface HexTileProps {
  resource: ResourceType;
  tokenNumber?: number;
  size?: number;
  width?: number;
  height?: number;
  onClick?: () => void;
  hasRobber?: boolean;
}

const ResourceColors = {
  [ResourceType.Desert]: 'bg-desert',
  [ResourceType.Brick]: 'bg-brick',
  [ResourceType.Wood]: 'bg-wood',
  [ResourceType.Sheep]: 'bg-sheep',
  [ResourceType.Wheat]: 'bg-wheat',
  [ResourceType.Ore]: 'bg-ore',
};

const ResourceIcons = {
  [ResourceType.Desert]: '🏜️',
  [ResourceType.Brick]: '🧱',
  [ResourceType.Wood]: '🌲',
  [ResourceType.Sheep]: '🐑',
  [ResourceType.Wheat]: '🌾',
  [ResourceType.Ore]: '⛏️',
};

// Probability dots for each number (2-12)
const ProbabilityDots: Record<number, number> = {
  2: 1,
  3: 2,
  4: 3,
  5: 4,
  6: 5,
  8: 5,
  9: 4,
  10: 3,
  11: 2,
  12: 1
};

const HexTile: React.FC<HexTileProps> = ({ 
  resource, 
  tokenNumber, 
  size = 100,
  width,
  height,
  onClick,
  hasRobber = false
}) => {
  // Use provided width/height or calculate from size
  const tileWidth = width || size;
  const tileHeight = height || (size * 0.866); // Default height is approximately 0.866 times the width for a regular hexagon
  
  // Determine if this is a high-probability number (6 or 8)
  const isHighProbability = tokenNumber === 6 || tokenNumber === 8;
  
  // Calculate token size based on the smaller dimension
  const minDimension = Math.min(tileWidth, tileHeight);
  const tokenSize = minDimension * 0.45;
  const fontSize = minDimension * 0.22;
  const dotSize = minDimension * 0.035;
  
  // Generate probability dots
  const renderProbabilityDots = () => {
    if (!tokenNumber || !ProbabilityDots[tokenNumber]) return null;
    
    const dots = [];
    const numDots = ProbabilityDots[tokenNumber];
    const dotColor = isHighProbability ? 'bg-red-600' : 'bg-gray-800';
    
    for (let i = 0; i < numDots; i++) {
      dots.push(
        <div 
          key={i}
          className={`${dotColor} rounded-full`}
          style={{ 
            width: `${dotSize}px`, 
            height: `${dotSize}px`,
            margin: `0 ${dotSize * 0.3}px`
          }}
        />
      );
    }
    
    return (
      <div className="flex justify-center mt-1">
        {dots}
      </div>
    );
  };
  
  return (
    <div 
      className={`hexagon ${ResourceColors[resource]} flex items-center justify-center relative`}
      style={{ 
        width: `${tileWidth}px`, 
        height: `${tileHeight}px`,
        cursor: onClick ? 'pointer' : 'default'
      }}
      onClick={onClick}
    >
      {/* Resource icon - moved to top */}
      <div className="absolute top-1/4 text-4xl" style={{ fontSize: `${fontSize * 1.8}px` }}>
        {ResourceIcons[resource]}
      </div>
      
      {/* Number token - moved to bottom */}
      {tokenNumber && resource !== ResourceType.Desert && (
        <div 
          className="number-token absolute bottom-1/4"
          style={{ 
            width: `${tokenSize}px`, 
            height: `${tokenSize}px`,
            boxShadow: isHighProbability ? '0 0 0 2px #e53e3e' : '0 0 0 2px #4a5568'
          }}
        >
          <span 
            className={`font-bold ${isHighProbability ? 'text-red-600' : 'text-gray-800'}`}
            style={{ fontSize: `${fontSize}px` }}
          >
            {tokenNumber}
          </span>
          {renderProbabilityDots()}
        </div>
      )}
      
      {/* Robber */}
      {hasRobber && (
        <div className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4">
          <div className="bg-gray-800 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
            <span className="text-lg">🦹</span>
          </div>
        </div>
      )}
      
      {/* Texture overlay */}
      <div className="absolute inset-0 opacity-20">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id={`texture-${resource}`} patternUnits="userSpaceOnUse" width="10" height="10">
              {resource === ResourceType.Desert && (
                <path d="M0 5 L10 5 M5 0 L5 10" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.3" />
              )}
              {resource === ResourceType.Brick && (
                <rect width="5" height="2" fill="currentColor" fillOpacity="0.3" />
              )}
              {resource === ResourceType.Wood && (
                <path d="M0 0 L10 10 M10 0 L0 10" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.3" />
              )}
              {resource === ResourceType.Sheep && (
                <circle cx="5" cy="5" r="2" fill="currentColor" fillOpacity="0.3" />
              )}
              {resource === ResourceType.Wheat && (
                <path d="M0 0 L10 10" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.3" />
              )}
              {resource === ResourceType.Ore && (
                <rect width="3" height="3" fill="currentColor" fillOpacity="0.3" />
              )}
            </pattern>
          </defs>
          <polygon 
            points={`${tileWidth/2},0 ${tileWidth},${tileHeight/4} ${tileWidth},${tileHeight*3/4} ${tileWidth/2},${tileHeight} 0,${tileHeight*3/4} 0,${tileHeight/4}`} 
            fill={`url(#texture-${resource})`} 
          />
        </svg>
      </div>
    </div>
  );
};

export default HexTile; 