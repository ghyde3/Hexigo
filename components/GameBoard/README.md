# GameBoard Component

This directory contains the refactored GameBoard component, which has been broken down into smaller, more manageable components.

## Component Structure

- **index.tsx**: Main GameBoard component that orchestrates all subcomponents
- **types.ts**: Shared types and interfaces for the GameBoard components
- **GridSystem.tsx**: Handles the hexagonal grid system and coordinate conversions
- **TileManager.tsx**: Manages tile placement and interaction
- **PortManager.tsx**: Manages port placement and interaction
- **GridControls.tsx**: UI controls for grid display settings
- **EditModeControls.tsx**: UI controls for edit mode selection
- **utils/**
  - **coordinateUtils.ts**: Utility functions for coordinate conversion and calculations
  - **renderUtils.tsx**: Utility functions for rendering grid elements

## Future Components

The following components are planned for future implementation:

- **SettlementManager.tsx**: Manages settlement/city placement and interaction
- **RoadManager.tsx**: Manages road placement and interaction

## Usage

The main GameBoard component can be used as follows:

```tsx
import GameBoard from './components/GameBoard';

// ...

<GameBoard
  tiles={tiles}
  ports={ports}
  structures={structures}
  onTileClick={handleTileClick}
  isEditMode={isEditMode}
  onToggleEditMode={toggleEditMode}
/>
```

## Props

The GameBoard component accepts the following props:

- **tiles**: Array of Tile objects
- **ports**: Array of Port objects (optional)
- **structures**: Array of Structure objects (optional)
- **onTileClick**: Callback function when a tile is clicked (optional)
- **isEditMode**: Boolean indicating if edit mode is enabled (optional)
- **onToggleEditMode**: Callback function to toggle edit mode (optional) 