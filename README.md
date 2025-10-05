# Star Scavenger

A fast-paced, arcade-style space shooter built with Next.js, TypeScript, and HTML Canvas. Navigate through 5 increasingly difficult levels, collect power-ups, and survive the asteroid onslaught.

## Features

- **5 Progressive Levels** - Each level unlocks only after beating the previous one
- **Power-Up System** - Collect Speed Boosts, Multi-Shot, and Big Ship upgrades
- **High Score Tracking** - Your best score persists across sessions
- **Pause/Resume** - Press P or click the pause button anytime
- **Level Selection** - Replay any unlocked level from the main menu

## Controls

- **WASD** - Move your ship
- **Mouse** - Aim your ship (follows cursor)
- **Left Click** - Fire bullets
- **P Key** - Pause/Resume game

## Power-Ups

Power-ups spawn every 10 seconds and fall from the top of the screen. Each lasts 8 seconds.

- **Speed Boost (S - Yellow)** - 50% faster bullets
- **Multi-Shot (M - Orange)** - Fire 3 bullets at once in a spread pattern
- **Big Ship (B - Gold)** - 1.5x larger ship, 2x bullet damage, 20% slower movement

## Level Progression

| Level | Name | Target Score | Difficulty |
|-------|------|--------------|------------|
| 1 | Asteroid Belt | 500 | Easy |
| 2 | Debris Field | 1,200 | Medium |
| 3 | Meteor Storm | 2,500 | Hard |
| 4 | Chaos Zone | 4,500 | Very Hard |
| 5 | The Gauntlet | 8,000 | Expert |

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **HTML Canvas API** - Real-time 2D game rendering
- **Vercel** - Deployment platform

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/JoshuaViera/star-scavenger.git
cd star-scavenger

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to play.

### Building for Production

```bash
npm run build
npm start
```

## Deployment

This project is configured for deployment on Vercel:

1. Push your code to GitHub
2. Import the repository in Vercel
3. Deploy (no additional configuration needed)

## Project Structure

```
star-scavenger/
├── src/
│   ├── app/
│   │   ├── dashboard/       # Main game page
│   │   └── page.tsx         # Root redirect
│   ├── components/
│   │   └── GameCanvas.tsx   # Core game logic and rendering
│   └── lib/
│       └── game/
│           ├── types.ts     # TypeScript interfaces
│           └── utils.ts     # Collision detection & helpers
├── public/                  # Static assets
└── README.md
```

## Game Architecture

### Core Game Loop

The game uses `requestAnimationFrame` for smooth 60 FPS rendering:

1. **Input Processing** - Keyboard (WASD) and mouse tracking
2. **Update Logic** - Move player, bullets, asteroids, power-ups
3. **Collision Detection** - Check bullet hits and player collisions
4. **Render** - Draw all game objects with canvas API
5. **State Management** - Track score, level progression, power-ups

### State Management

Game state is stored in a `useRef` to avoid React re-render performance issues during the game loop. UI state (score, game over, pause) uses `useState` for reactive updates.

## Future Enhancements

- Sound effects and background music
- Particle explosion effects
- Enemy AI ships that shoot back
- Parallax starfield background
- Screen shake on collisions
- Online leaderboard

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT License - feel free to use this project for learning or your own games.

## Acknowledgments

Built as a learning project to explore canvas-based game development with modern web technologies.