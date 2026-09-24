# 🌐 ATLASAI — Automated Living World Atlas

[![License: MIT](https://img.shields.io/badge/License-MIT-amber.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-199900.svg)](https://leafletjs.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg)](https://tailwindcss.com/)
[![Status](https://img.shields.io/badge/Platform-Production--Ready-success.svg)]()

> **ATLASAI** is a source-aware, verification-driven digital world atlas combining planetary geospatial cartography, real-time environmental telemetry, and regional context discovery. 
> 
> Explore borders, landforms, mountain massifs, river systems, neighboring towns, live road traffic, NASA FIRMS wildfire hotspots, and WAQI air quality indexes across every corner of the Earth.

---

## 📑 Table of Contents

1. [🌟 Key Highlights & Innovations](#-key-highlights--innovations)
2. [🗺️ Interactive Map Layers & Overlays](#️-interactive-map-layers--overlays)
3. [🧭 Regional Context & Surrounding Areas Engine](#-regional-context--surrounding-areas-engine)
4. [🎓 Educational Core & Planetary Science](#-educational-core--planetary-science)
5. [🛰️ Real-Time Telemetry & Environmental Overlays](#️-real-time-telemetry--environmental-overlays)
6. [🏗️ Architectural Overview & Tech Stack](#️-architectural-overview--tech-stack)
7. [🔌 REST API Specification](#-rest-api-specification)
8. [🚀 Getting Started & Installation](#-getting-started--installation)
9. [⌨️ Map Navigation & Shortcuts Cheatsheet](#️-map-navigation--shortcuts-cheatsheet)
10. [📜 Attribution & Open Data Sources](#-attribution--open-data-sources)

---

## 🌟 Key Highlights & Innovations

* **Precision Global Search & Regional Framing**: Search any town, capital, mountain peak, river, or state. The map flies to the coordinates with tailored zoom levels and automatically spotlights surrounding significant regions.
* **Floating Control Panel for Essential Layers**: Instant toggling between **Political**, **Physical**, **Satellite**, **Street**, **Terrain**, **Traffic**, **Wildfires**, and **Air Quality** layers.
* **Geodesic Rays & Proximity Radar**: Renders animated radar pulses around focal search destinations with luminous geodetic ray lines linking to neighboring towns, mountains, and rivers.
* **Surrounding Entity Badges**: High-contrast, category-styled map markers displaying distance in kilometers, compass bearings (e.g., `78 km SE`), and peak elevations (e.g., `4,392m`).
* **Interactive 360° Ground Panorama**: Ground-level Street View mode allows interactive street and terrain exploration from any coordinate.
* **Deep Geospatial Profiles**: Every entity features factual summaries, parent jurisdictions, coordinates, elevation, population, and cross-linked regional relationships.

---

## 🗺️ Interactive Map Layers & Overlays

The atlas includes a dedicated floating control panel on the upper-right corner of the map canvas, providing 8 essential layers:

| Layer | Type | Engine / Provider | Description |
|---|---|---|---|
| **🏛️ Political** | Base Cartography | Esri World Light Gray / OSM Admin | Clear administrative borders, national territories, sovereignty boundaries, and capital markers. |
| **🌲 Physical** | Base Cartography | NatGeo World Physical / ESRI | Physical world relief, natural landforms, biomes, major drainage basins, and mountain ranges. |
| **🛰️ Satellite** | Base Cartography | ESRI World Imagery + Hybrid Labels | Ultra-high-resolution orbital imagery combined with vector road and boundary overlays. |
| **🧭 Street** | Base Cartography | Esri World Street Navigation Grid | Navigation-grade street grid, arterial avenues, pedestrian paths, and local points of interest. |
| **⛰️ Terrain** | Base Cartography | Esri World Topographic Relief | Topographic elevation relief contours, hillshading, and alpine elevation highlights. |
| **🚗 Traffic** | Real-Time Overlay | Simulated Congestion Flow & Live Arterials | Live road network congestion simulation highlighting arterial flow velocity and delays. |
| **🔥 Wildfires** | Real-Time Overlay | NASA FIRMS MODIS / VIIRS Hotspots | Thermal infrared anomaly clusters detecting active surface wildfires and thermal hotspots worldwide. |
| **💨 Air Quality** | Real-Time Overlay | WAQI Real-time PM2.5 AQI Heatmap | Multi-station real-time particulate matter (PM2.5 / PM10) Air Quality Index heatmap. |

---

## 🧭 Regional Context & Surrounding Areas Engine

### The Problem with Traditional Maps
In traditional mapping tools, searching for a place zooms into an isolated pin, leaving users disoriented without immediate awareness of neighboring towns, nearby peaks, or adjacent waterways.

### How ATLASAI Solves This
When a user selects or searches for any location:
1. **Target Focus Beacon**: A concentric pulsing radar halo (`focal-radar-halo`) illuminates the exact coordinates.
2. **Contextual Geodetic Rays**: Mathematical lines are drawn from the center outward to all significant neighboring landmarks within a 250 km radius.
3. **High-Contrast Badges**: Neighboring places receive dedicated badges displaying:
   - Category icon (`🏔️` Mountains, `🌊` Rivers, `🏙️` Towns, `🌲` Reserves).
   - Distance in kilometers and 16-point compass bearing (`N`, `NE`, `ENE`, `E`, etc.).
   - Metres above sea level for topographic peaks.
4. **Category Filter Chips**: Instant top-left tabs allow filtering down to **Towns**, **Mountains**, or **Rivers**.
5. **Interactive Bottom Dock**: A horizontal carousel presents surrounding places with one-click glide (`flyTo`) transitions.

---

## 🎓 Educational Core & Planetary Science

ATLASAI serves as an educational companion for students, researchers, cartographers, and curious explorers:

```
                            PLANETARY SPHERES
                                    │
       ┌──────────────┬─────────────┴─────────────┬──────────────┐
       ▼              ▼                           ▼              ▼
  LITHOSPHERE    HYDROSPHERE                 ATMOSPHERE     ANTHROPOSPHERE
  • Mountains    • River basins              • Air Quality  • Sovereign borders
  • Volcanic arcs• Lakes & seas              • Climate zones• Urban settlements
  • Valleys      • Ocean trenches            • Wildfires    • Economic corridors
```

* **Physical Geography**: Understand tectonic boundaries, continental shields, drainage basins, and biome classifications.
* **Political & Cultural Boundaries**: Study international borders, dispute zones, administrative provinces, and indigenous homelands.
* **Demographics & Urban Centers**: Compare metropolitan populations, elevation gradients, and transport networks.
* **Environmental Intelligence**: Monitor global air quality indexes and seasonal wildfire migrations in real time.

---

## 🛰️ Real-Time Telemetry & Environmental Overlays

### 🔥 NASA FIRMS Wildfire Telemetry
* Visualizes active thermal anomalies retrieved from satellite sensors (MODIS on Terra/Aqua and VIIRS on Suomi NPP / NOAA-20).
* Hotspots pulse with rose-colored infrared indicators to highlight burn corridors and forest fire perimeters.

### 💨 WAQI Real-Time Air Quality (PM2.5 / AQI)
* Evaluates atmospheric particulate matter according to international Air Quality Index standards:
  - `0 - 50`: Good (Emerald)
  - `51 - 100`: Moderate (Yellow)
  - `101 - 150`: Unhealthy for Sensitive Groups (Amber)
  - `151 - 200`: Unhealthy (Orange/Red)
  - `201 - 300`: Very Unhealthy (Purple)
  - `300+`: Hazardous (Maroon)

---

## 🏗️ Architectural Overview & Tech Stack

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React 19 + Vite)                      │
│                                                                        │
│   ┌─────────────────────┐   ┌───────────────────┐   ┌──────────────┐   │
│   │    AtlasMap.tsx     │   │ Global Search Bar │   │ Layer Toggle │   │
│   │ (Leaflet Canvas)    │   │ (Fuzzy Matcher)   │   │ Control Dock │   │
│   └──────────┬──────────┘   └─────────┬─────────┘   └───────┬──────┘   │
│              │                        │                     │          │
│              └────────────────────────┼─────────────────────┘          │
│                                       ▼                                │
│                          State & API Client (/src/api)                 │
└───────────────────────────────────────┬────────────────────────────────┘
                                        │ HTTP / JSON
┌───────────────────────────────────────▼────────────────────────────────┐
│                         BACKEND (Node.js + Express)                    │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │ Express Server (server.ts) ── Router (api.router.ts)           │   │
│   └───────────────────────────────┬────────────────────────────────┘   │
│                                   ▼                                    │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │ Geospatial Engine Adapter (engine.adapter.ts)                  │   │
│   │  • Haversine & Geodesic Distance Engine                        │   │
│   │  • Compass Bearing Calculator (16-wind Rose)                   │   │
│   │  • Overpass OSM Fallback & Query Cache                         │   │
│   └───────────────────────────────┬────────────────────────────────┘   │
│                                   ▼                                    │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │ Neon Serverless PostgreSQL Database / Seed Engine              │   │
│   └────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

### Key Technologies:
* **Frontend Framework**: [React 19](https://react.dev/) with functional components and TypeScript.
* **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with native `@import "tailwindcss";` and glassmorphic HUD styling.
* **Mapping Engine**: [Leaflet 1.9.4](https://leafletjs.com/) with multi-tile layer switching, SVG vectors, and custom DivIcons.
* **Icons**: [Lucide React](https://lucide.dev/).
* **Backend Runtime**: [Express](https://expressjs.com/) with [tsx](https://github.com/privatenumber/tsx) execution.
* **Geospatial Processing**: Native spherical trigonometry (Haversine formula, initial bearing formulas).

---

## 🔌 REST API Specification

### 1. Global Entity Search
```http
GET /api/geo/search?q={query}&type={optionalType}
```
**Example Response:**
```json
[
  {
    "id": "mount-rainier",
    "name": "Mount Rainier",
    "type": "mountain",
    "parentName": "Washington, United States",
    "coordinates": [46.8523, -121.7603],
    "elevationM": 4392,
    "description": "Active stratovolcano in the Cascade Range..."
  }
]
```

### 2. Surrounding Regions Discovery
```http
GET /api/geo/surrounding?entityId={id}&lat={lat}&lng={lng}&radiusKm=250
```
**Example Response:**
```json
[
  {
    "id": "tacoma-wa",
    "name": "Tacoma",
    "type": "city",
    "coordinates": [47.2529, -122.4443],
    "distanceKm": 68.4,
    "bearing": "NW",
    "parentName": "Washington, United States"
  },
  {
    "id": "columbia-river",
    "name": "Columbia River",
    "type": "river",
    "coordinates": [45.6256, -121.9489],
    "distanceKm": 137.2,
    "bearing": "SSE",
    "parentName": "Pacific Northwest"
  }
]
```

### 3. Entity Detail
```http
GET /api/geo/entities/:id
```
Returns full metadata, historical provenance, regional associations, and climatic indices.

---

## 🚀 Getting Started & Installation

### Prerequisites
* Node.js v18.0.0 or higher
* npm v9.0.0 or higher

### Local Development Setup
```bash
# 1. Clone the repository
git clone https://github.com/your-username/atlas-ai.git

# 2. Navigate to project root
cd atlas-ai

# 3. Install dependencies
npm install

# 4. Start full-stack development server (Express + Vite on Port 3000)
npm run dev
```

The application will be live at `http://localhost:3000`.

### Production Build
```bash
# Compile and bundle client application
npm run build

# Start production server
npm run start
```

---

## ⌨️ Map Navigation & Shortcuts Cheatsheet

| Interaction | Action |
|---|---|
| **Click & Drag** | Pan across the planetary surface |
| **Scroll Wheel / Pinch** | Smooth zoom in / out |
| **Double Click** | Quick zoom into coordinate |
| **Search Selection** | Centers map, auto-zooms to ideal scale, and activates surrounding beacon |
| **Surrounding Badge Click** | Centers and focuses the clicked neighboring town or mountain |
| **`World View` Button** | Instant zoom-out to global planetary overview |
| **`Street View` Button** | Opens 360° ground-level panorama viewer for focal location |
| **`Layers & Overlays`** | Expands or minimizes the floating layer control panel |

---

## 📜 Attribution & Open Data Sources

ATLASAI relies on geographic and scientific data from world-class open institutions:

* **[OpenStreetMap](https://www.openstreetmap.org/)**: Standard world cartography & geographical geometries © OpenStreetMap contributors (ODbL).
* **[ESRI / National Geographic](https://www.esri.com/)**: World Imagery, Street Navigation, Topographic Relief, Light Gray Base, and Physical Relief maps.
* **[NASA FIRMS](https://firms.modaps.eosdis.nasa.gov/)**: Fire Information for Resource Management System.
* **[World Air Quality Index (WAQI)](https://waqi.info/)**: Real-time atmospheric air quality sensor network.
* **[CyclOSM & OpenRailwayMap](https://www.cyclosm.org/)**: Global cycling and railway infrastructure cartography.

---

<p align="center">
  <b>ATLASAI — Automated Living World Atlas</b><br/>
  <i>Exploring every continent, ridge, watershed, and settlement on Earth.</i>
</p>
