# Star Scavenger 🚀

A fast-paced, arcade-style space shooter built with Next.js, TypeScript, and HTML Canvas. Navigate through 5 increasingly difficult levels, battle intelligent enemies and epic bosses, collect power-ups, and climb the leaderboard!

![Star Scavenger Gameplay](./public/gameplay.gif)

<br>

| Live Demo | Tech Stack | Status |
| :---: | :---: | :---: |
| [**star-scavenger.vercel.app**](https://star-scavenger.vercel.app) | ![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white) ![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white) | ![Project Status](https://img.shields.io/badge/status-active-brightgreen?style=for-the-badge) |

<br>

Star Scavenger is a comprehensive web-based game designed to showcase modern front-end technologies, robust state management, and full-stack integration for features like authentication and leaderboards.

---

## ✨ Features

<details>
<summary><strong>🎮 Core Gameplay & Controls</strong></summary>

-   **5 Progressive Levels**: Each with unique challenges and increasing difficulty.
-   **Epic Boss Fights**: Battle a unique, multi-phase boss at the end of each level.
-   **Intelligent Enemies**: Face 3 distinct enemy types (Scout, Fighter, Bomber) with unique AI.
-   **Dynamic Difficulty**: Choose Easy, Medium, or Hard modes to match your skill level.
-   **Persistent High Scores**: Your best scores are saved locally for each difficulty.
-   **Save/Resume System**: Game state auto-saves, allowing you to resume your session anytime.
-   **Controls**:
    -   **Desktop**: `WASD` to move, `Mouse` to aim, `Left Click` to shoot, `P` to pause, `Space` for bomb.
    -   **Mobile**: Virtual Joystick to move, Tap Screen to shoot, On-screen buttons for pause/bomb.

</details>

<details>
<summary><strong>💪 Power-Ups & Progression</strong></summary>

-   **6 Dynamic Power-Ups**: Speed Boost ⚡, Multi-Shot 🔫, Big Ship 🛸, Shield 🛡️, Rapid-Fire 🔥, and the screen-clearing Bomb 💣.
-   **Supabase Authentication**: Secure user login with email/password for progress tracking.
-   **Global Leaderboard**: Compete with others! Features advanced filtering and sorting.
-   **Cross-Device Progression**: Your unlocked levels and preferences are tied to your account.

</details>

<details>
<summary><strong>📊 Analytics & Admin Dashboard</strong></summary>

-   **Admin Dashboard**: Access at `/admin` (Password: `starscavenger2024`).
-   **Comprehensive Metrics**: Tracks player engagement, level drop-off, boss stats, and power-up effectiveness.
-   **AI-Powered Insights**: Get actionable recommendations to improve game balance.
-   **Real-time Data**: Dashboard auto-refreshes, with an option to export session data as JSON.

</details>

<details>
<summary><strong>🎨 Visuals & Audio</strong></summary>

-   **Smooth 60 FPS Gameplay**: Built with `requestAnimationFrame` for fluid animations.
-   **Dynamic Effects**: Particle explosions and screen shake provide impactful feedback.
-   **Immersive Background**: A multi-layered parallax starfield creates a sense of depth.
-   **Custom Audio**: Procedural sound effects and an original background music track.

</details>

---

## 🚀 Getting Started

Follow these steps to set up and run the project locally.

**Prerequisites:**
* Node.js (v18 or newer)
* `npm` or `yarn`
* A free [Supabase](https://supabase.com/) account

**Installation & Setup:**

1.  **Clone the Repository:**
    ```bash
    git clone [https://github.com/JoshuaViera/star-scavenger.git](https://github.com/JoshuaViera/star-scavenger.git)
    cd star-scavenger
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Set Up Environment Variables:**
    -   Duplicate the example file:
        ```bash
        cp .env.example .env.local
        ```
    -   Log in to your Supabase account.
    -   Create a new project.
    -   Go to `Project Settings` > `API`.
    -   Copy your `Project URL`, `anon (public) key`, and `service_role (secret) key` into your `.env.local` file.

4.  **Run the Development Server:**
    ```bash
    npm run dev
    ```
    The game will be available at [http://localhost:3000](http://localhost:3000).

---

## 🛠️ Technical Deep Dive

<details>
<summary><strong>Project Structure</strong></summary>

```
star-scavenger/
├── src/
│   ├── app/                # Next.js App Router pages and API routes
│   │   ├── admin/          # Analytics dashboard
│   │   ├── api/            # API routes (leaderboard, game sessions)
│   │   └── page.tsx        # Main game page
│   ├── components/
│   │   ├── game/           # Game UI components (Leaderboard, Joystick)
│   │   └── GameCanvas.tsx  # Core game rendering component
│   ├── hooks/
│   │   ├── game/           # Custom hooks for game logic
│   │   │   ├── useGameState.ts
│   │   │   ├── useGameLoop.ts
│   │   │   └── ... (other game system hooks)
│   │   └── useAuth.ts      # Authentication hook
│   └── lib/
│       ├── game/           # Core game logic modules (AI, physics, effects)
│       │   ├── bosses.ts
│       │   ├── enemies.ts
│       │   └── particles.ts
│       ├── supabase/       # Supabase client configurations
│       └── ...
├── public/                 # Static assets (images, fonts, gameplay.gif)
└── README.md
```
</details>

<details>
<summary><strong>Game Architecture</strong></summary>

The game's architecture is built around a clean separation of concerns using React hooks.

-   **Core Game Loop**: A central `useGameLoop.ts` hook powered by `requestAnimationFrame` orchestrates the game's flow: Input → Update → Collision Detection → Render.
-   **State Management**: Game state (positions, velocities) is stored in `useRef` to prevent re-renders on every frame, ensuring high performance. UI state (score, game over) uses `useState` for reactive updates.
-   **Modular Systems**: Logic is encapsulated in custom hooks (`useEnemySpawning`, `usePowerUpSpawning`, etc.), making the codebase easy to manage and extend.
-   **Rendering**: The HTML Canvas API is used for all 2D rendering, providing direct control over every pixel drawn to the screen.

</details>

---

## 🔮 Future Enhancements

This project is actively being developed. Here is a roadmap of planned features:

-   [ ] **Phase 1: Visual Polish**: Ship engine trails, enhanced explosions, asteroid rotation.
-   [ ] **Phase 2: More Power-Ups**: Slow-Motion, Laser Beam, Homing Missiles.
-   [ ] **Phase 3: Enhanced Bosses**: Unique attack patterns, enrage modes, and weak points.
-   [ ] **Phase 4: Meta Progression**: Persistent ship upgrades, achievements, and daily challenges.

## 🤝 Contributing

Contributions are welcome! If you have an idea for a new feature or a bug fix, please follow these steps:

1.  Fork the repository.
2.  Create a new feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

---
⭐ If you enjoyed this game, please consider starring the repo!