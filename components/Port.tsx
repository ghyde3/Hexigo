import React from 'react';
import { Port as PortType, PortType as PortTypeEnum } from '../lib/types';

interface PortProps {
  port: PortType;
  hexSize: number;
}

const PORT_COLORS = {
  [PortTypeEnum.Generic]: '#888888',
  [PortTypeEnum.Brick]: '#cc3333',
  [PortTypeEnum.Wood]: '#009900',
  [PortTypeEnum.Sheep]: '#99cc00',
  [PortTypeEnum.Wheat]: '#ffcc00',
  [PortTypeEnum.Ore]: '#666666'
};

const PORT_LABELS = {
  [PortTypeEnum.Generic]: '3:1',
  [PortTypeEnum.Brick]: '2:1 Brick',
  [PortTypeEnum.Wood]: '2:1 Wood',
  [PortTypeEnum.Sheep]: '2:1 Sheep',
  [PortTypeEnum.Wheat]: '2:1 Wheat',
  [PortTypeEnum.Ore]: '2:1 Ore'
};

export const Port: React.FC<PortProps> = ({ port, hexSize }) => {
  // Calculate position based on hex coordinates and direction
  const { q, r } = port.coordinates;
  const size = hexSize * 0.8; // Port size relative to hex size
  
  // Calculate the center of the hex
  const x = hexSize * (Math.sqrt(3) * q + Math.sqrt(3) / 2 * r);
  const y = hexSize * (3/2 * r);
  
  // Calculate the position of the port based on the direction (0-5)
  // Direction represents the edge of the hex where the port is located
  const angle = (port.direction * 60 + 30) * Math.PI / 180;
  const distance = hexSize * 1.1; // Distance from hex center to port
  
  const portX = x + distance * Math.cos(angle);
  const portY = y + distance * Math.sin(angle);
  
  return (
    <g transform={`translate(${portX}, ${portY})`}>
      {/* Port circle */}
      <circle
        r={size / 4}
        fill={PORT_COLORS[port.type]}
        stroke="#000"
        strokeWidth="1"
      />
      
      {/* Port label */}
      <text
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={size / 6}
        fontWeight="bold"
        fill="#fff"
      >
        {port.type === PortTypeEnum.Generic ? '3:1' : '2:1'}
      </text>
      
      {/* Resource icon for resource-specific ports */}
      {port.type !== PortTypeEnum.Generic && (
        <g transform={`translate(0, ${size / 3})`}>
          <rect
            x={-size / 5}
            y={-size / 5}
            width={size / 2.5}
            height={size / 2.5}
            rx={3}
            fill={PORT_COLORS[port.type]}
            stroke="#000"
            strokeWidth="1"
          />
          <text
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={size / 8}
            fontWeight="bold"
            fill="#fff"
          >
            {port.type.charAt(0).toUpperCase()}
          </text>
        </g>
      )}
      
      {/* Port tooltip on hover */}
      <title>{PORT_LABELS[port.type]}</title>
    </g>
  );
};

export default Port; 