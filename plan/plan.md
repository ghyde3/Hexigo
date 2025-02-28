# Catan Game Implementation Plan

## Current Status Assessment
The UI has a good foundation with the following components already implemented:
- `GameBoard.tsx` - Main game board with hexagonal tiles
- `HexTile.tsx` - Individual hex tiles with resource types and token numbers
- `PlayerPanel.tsx` - Panel showing player resources and structures
- `TurnControls.tsx` - Controls for dice rolling and building actions
- Basic game mechanics (building roads, settlements, cities)
- Draggable player bar and toolbar
- Resource visualization with emojis and colors

The spacing isn't great, and we need something to indicate the active player more clearly. We need to add three new panels: the game log, the bank cards, and an enhanced player hand panel.

## UI Improvements

### 1. Layout and Spacing
- Adjust the spacing between UI elements for better visual hierarchy
- Ensure consistent padding and margins throughout the interface
- Improve the positioning of draggable panels to avoid overlapping
- Add visual indicators for active player (highlight, animation, etc.)
- Implement a turn timer to keep pace of play (similar to "01:59" in screenshot)
- Create clear action state indicators showing what actions are currently possible

### 2. New Panels
- **Game Log and Chat Panel** (new component `GameLog.tsx`):
  - Display game events (dice rolls, resource gains, trades, etc.)
  - Include chat functionality with message input field and send button
  - Scrollable history with timestamps
  - Filter options for different types of events
  - System messages (e.g., "Game Paused", "Game Resumed")

- **Bank/Development Cards Panel** (new component `BankPanel.tsx`):
  - Show available development cards with remaining counts
  - Display remaining resource counts in the bank
  - Visual indicators for card costs
  - Card stack visualization with quantity indicators (like "19" shown on resource cards)
  - Bank building with visual indicator for development cards

- **Enhanced Player Hand Panel** (enhance existing `PlayerPanel.tsx`):
  - Improve the existing PlayerPanel component
  - Show current player's development cards
  - Display available building pieces (roads, settlements, cities) with quantity
  - Include building costs reference for quick access
  - Player avatar/profile representation
  - Victory point counter
  - Special card indicators (Longest Road, Largest Army)

### 3. Visual Enhancements
- Add water/ocean texture around the board to create island effect (enhance `GameBoard.tsx`)
- Improve hex tile designs with more detailed textures and resource indicators (enhance `HexTile.tsx`)
- Add port graphics at the edges of the board with trade ratio indicators (3:1, 2:1)
- Implement port visualization with boat/ship icons and flags showing trade type
- Create number tokens with probability dots (red for high probability, black for others) (enhance `HexTile.tsx`)
- Implement animations for dice rolls, resource collection (enhance `TurnControls.tsx`)
- Add visual feedback for actions (building, trading)
- Add robber token with clear visual presence on the board (enhance `GameBoard.tsx` and `HexTile.tsx`)

## Game Mechanics Implementation

### 1. Core Game Rules
- **Setup Phase** (enhance game state in `game.ts`):
  - Initial placement of settlements and roads
  - Starting resource distribution

- **Turn Structure** (enhance `TurnControls.tsx` and game logic):
  - Dice rolling and resource production
  - Trading phase (with other players and ports)
  - Building phase
  - Development card playing
  - End turn
  - Turn timer functionality with time limits

- **Victory Conditions** (enhance game state and `PlayerPanel.tsx`):
  - Track victory points (10 points to win)
  - Display victory point counter for each player

### 2. Resource Management
- Implement resource collection based on dice rolls and hex adjacency (enhance `utils.ts`)
- Resource trading system (player-to-player, player-to-bank, ports)
- Resource stealing (robber)
- Resource limits and discarding
- Visual representation of resource quantities for all players (enhance `PlayerPanel.tsx`)

### 3. Building Mechanics
- Road building with connectivity rules (enhance `utils.ts` and `GameBoard.tsx`)
- Settlement building with distance rules (enhance `utils.ts` and `GameBoard.tsx`)
- City upgrades from settlements (enhance `utils.ts` and `GameBoard.tsx`)
- Development card purchasing and usage
- Clear visual indicators for valid building locations (enhance `GameBoard.tsx`)
- Building costs reference visible during placement phase (enhance `TurnControls.tsx`)

### 4. Special Features
- **Robber** (enhance `GameBoard.tsx` and game logic):
  - Movement mechanics
  - Stealing resources
  - Blocking resource production
  - Visual indicator on hexes

- **Longest Road and Largest Army** (enhance game state in `game.ts`):
  - Calculation algorithms
  - Special victory point cards
  - Transfer of special cards when conditions change
  - Visual indicators for who holds these special cards

- **Ports** (enhance `GameBoard.tsx`):
  - 3:1 and 2:1 trading implementation
  - Port placement on the board with distinct visuals
  - Trading interface with port-specific options
  - Port icons with ships/boats and trading ratios as shown in screenshot
  - Visual distinction between different port types (general 3:1 vs resource-specific 2:1)

### 5. Development Cards
- Knight/Soldier cards (add to game state in `types.ts` and `game.ts`)
- Progress cards (Road Building, Year of Plenty, Monopoly)
- Victory Point cards
- Card usage rules (not on the turn they're purchased)
- Visual design for different card types

## Implementation Phases

### Phase 1: New Panels and UI Enhancements
- Create `GameLog.tsx` component for displaying game events
- Create `BankPanel.tsx` component for showing available development cards and resources
- Enhance the existing `PlayerPanel.tsx` to show more detailed information
- Add visual indicator for active player (enhance `PlayerPanel.tsx` and game state)
- Implement turn timer (enhance `TurnControls.tsx`)
- Improve spacing and layout of existing components

### Phase 2: Visual Improvements
- Add water border around the game board (enhance `GameBoard.tsx`)
- Improve hex tile designs with more detailed textures (enhance `HexTile.tsx`)
- Create number tokens with probability dots (enhance `HexTile.tsx`)
- Add port graphics at the edges of the board (enhance `GameBoard.tsx`)
- Add robber token visualization (enhance `GameBoard.tsx` and `HexTile.tsx`)

### Phase 3: Game Mechanics
- Implement development cards system (enhance game state in `game.ts` and `types.ts`)
- Add robber mechanics (movement, stealing, blocking) (enhance game logic)
- Implement port trading functionality (enhance game logic and UI)
- Add longest road and largest army special cards (enhance game state)
- Enhance resource collection based on dice rolls (enhance `utils.ts`)

### Phase 4: Multiplayer and Polish
- Finalize multiplayer functionality (enhance game state and networking)
- Add animations and sound effects (enhance UI components)
- Comprehensive testing and bug fixing
- Add player avatars and profiles (enhance `PlayerPanel.tsx`)
- Polish action state indicators (enhance UI feedback)

## Testing Strategy
- Unit tests for game logic
- Integration tests for component interaction
- Playtest sessions to identify usability issues
- Cross-browser compatibility testing
- Mobile responsiveness testing

## Future Enhancements
- Expansions (Seafarers, Cities & Knights)
- Custom game rules
- Game statistics and replay
- Tournament mode
- Customizable board layouts
