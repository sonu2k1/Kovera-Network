# Kovera Network Map Portal

A comprehensive and dynamic analytics mapping dashboard built for the Kovera Network. This portal provides an interactive graph visualization of homes, listings, buyers, chains, and clusters, helping administrative users analyze real estate networks, user behavior, and geographic relationships effectively.

## Features

- **Interactive Network Canvas:** View relationships between "User Homes," "Seeded Listings," "Dream Homes," and "Pure Buyers."
- **Live Data Integration:** Syncs with 10 backend analytics endpoints proxying to `app.kovera.io` to provide real-time counts, filters, chains, cycles, and geocoded details.
- **Layers & Filters Sidebar:** Quickly narrow down the graph view to show specific nodes (e.g., Active Chains, Demand Clusters, Address Cycles).
- **In-depth Node Detail Panel:** Click any node to instantly view its metadata, address, dream interests, and chain readiness.
- **Administrative Tools:**
  - View internal user filters and toggle their visibility.
  - Refresh geocoding on-demand.
  - Regenerate network views and generate network data markdown exports.
- **Dynamic Theming:** Built-in Light and Dark modes with a premium, glassmorphism-inspired "Kovera Green" aesthetic.

## Tech Stack

- **Frontend:** React, TypeScript, React Router, Framer Motion, Lucide React, Vite
- **Backend (Proxy/API):** Node.js, TypeScript, Express (proxies to the Kovera Analytics API)
- **Styling:** Vanilla CSS (custom design system)

## Running Locally

### Prerequisites

- [Node.js](https://nodejs.org/en/) (v18 or higher recommended)
- `npm` or `yarn`

### Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/sonu2k1/Kovera-Network.git
   cd Kovera-Network
   ```

2. **Navigate to the application folder:**
   ```bash
   cd kovera-network-map-portal
   ```

3. **Install Dependencies:**
   ```bash
   npm install
   ```

4. **Environment Variables:**
   Create a `.env` file in the `kovera-network-map-portal` directory based on `.env.example` (if one exists). Ensure any API keys or proxy targets are configured correctly.

5. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   *This command runs both the backend Express proxy and the Vite frontend concurrently.*

6. **Open the App:**
   Visit `http://localhost:3000` in your browser. You will be redirected to the login screen.
   *(In demo mode, you can use any credentials or click the login button directly to enter).*

## API Integration Checklist

The portal relies on the following 10 `app.kovera.io` endpoints, handled securely through the backend proxy:
- `GET /graph` — Node & edge map data
- `GET /stats` — Breakdown numbers & performance
- `GET /chains` — Active real estate move chains
- `GET /clusters` — Demand clusters
- `GET /address-cycles` — Address looping / cyclic logic
- `GET /node/{id}` — Specific node detail fetching
- `GET /export` — Network map data export 
- `GET /internal-users` — Check filtered internal accounts
- `PUT /internal-users` — Add/remove internal users from filters
- `POST /refresh` — Trigger global geocoding refresh

## Contributing

Make sure all new UI features adhere to the premium Kovera aesthetic and that new API endpoints are correctly proxied in `backend/src/routes/analytics.ts`.
