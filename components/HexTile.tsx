import React from 'react';
import { ResourceType } from '../lib/types';

interface HexTileProps {
  resource: ResourceType;
  tokenNumber?: number;
  size?: number;
  width?: number;
  height?: number;
  onClick?: () => void;
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

const HexTile: React.FC<HexTileProps> = ({ 
  resource, 
  tokenNumber, 
  size = 100,
  width,
  height,
  onClick 
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
  const dotMargin = minDimension * 0.01;
  
  return (
    <div 
      className={`hexagon ${ResourceColors[resource]} relative flex items-center justify-center cursor-pointer hover:brightness-110 transition-all duration-200`}
      style={{ 
        width: `${tileWidth}px`, 
        height: `${tileHeight}px`,
        boxShadow: '0 0 0 2px rgba(255, 255, 255, 0.5)',
      }}
      onClick={onClick}
    >
      {/* Hex border */}
      <div 
        className="hexagon absolute top-0 left-0 w-full h-full border-2 border-amber-200 opacity-50"
        style={{ 
          width: `${tileWidth}px`, 
          height: `${tileHeight}px`,
        }}
      />
      
      {/* Subtle texture overlay */}
      <div 
        className="hexagon absolute top-0 left-0 w-full h-full opacity-10 mix-blend-overlay"
        style={{ 
          width: `${tileWidth}px`, 
          height: `${tileHeight}px`,
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'1\'/%3E%3Ccircle cx=\'13\' cy=\'13\' r=\'1\'/%3E%3C/g%3E%3C/svg%3E")',
        }}
      />
      
      <div className="flex flex-col items-center justify-center z-10">
        <span className="text-2xl mb-2">{ResourceIcons[resource]}</span>
        
        {tokenNumber && (
          <div 
            className={`number-token ${isHighProbability ? 'high-probability' : ''} shadow-md`}
            style={{
              width: `${tokenSize}px`,
              height: `${tokenSize}px`,
              fontSize: `${fontSize}px`,
              fontWeight: 'bold',
              border: isHighProbability ? '2px solid #dc2626' : '1px solid #888',
            }}
          >
            {tokenNumber}
            <div className="dots flex justify-center mt-1">
              {Array.from({ length: tokenNumber === 2 || tokenNumber === 12 ? 1 : 
                            tokenNumber === 3 || tokenNumber === 11 ? 2 : 
                            tokenNumber === 4 || tokenNumber === 10 ? 3 : 
                            tokenNumber === 5 || tokenNumber === 9 ? 4 : 5 }).map((_, i) => (
                <div 
                  key={i} 
                  className={`rounded-full ${isHighProbability ? 'bg-red-600' : 'bg-black'}`}
                  style={{ 
                    width: `${dotSize}px`, 
                    height: `${dotSize}px`,
                    margin: `0 ${dotMargin}px` 
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HexTile; 