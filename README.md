# FlameAtlas — AI Fire Safety Dashboard for Moon & Mars

Frontend for **FlameAtlas**, a NASA Space Apps 2026 ("Flame in Freefall") dashboard that turns public NASA microgravity fire experiments into ranked, explained fire-risk answers for each mission phase.

> **Demo build:** all numbers come from dummy data and client-side stand-ins for the model endpoints (`src/utils/models.js`). Not for flight decisions.

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
npm run preview  # serve the production build
```

Optional: `cp .env.example .env` and add your free NASA API key for live solar flare data.

Requires Node 18+.

## Kids mode (default)

FlameAtlas opens in **Kids mode**, made for young explorers. A **Kids / Pro** switch sits in the top bar.

- **Sparky**, an original robot-firefighter guide, welcomes new visitors in 3 short steps. He then floats in the corner with a tip for whatever section is on screen. Tap him to show or hide tips.
- **Simple words everywhere:** kid titles and descriptions for every section, friendly nav names (Fire Lab, Sun Blasts, Burn Race, Ghost Flames, Quiz Time…), and simple readouts ("How heavy you feel: 16%", "Fire danger meter"). Scientific labels (XGBoost, PSI IDs, formulas) are hidden.
- **Games first:** every section opens on its game, with "Learn" one tap away.
- **Fun:** a rounder, bigger font (Fredoka), bigger slider thumbs, and **sound effects** made in the browser (pop on taps, ding for XP, fanfare for badges) with a mute button.
- **Pro mode** brings back the full scientist dashboard with all charts and technical detail.

## Solar Flare Watch (NASA DONKI API)

A 3D space-weather simulation driven by **real solar flares from NASA's DONKI API**.

- **Data:** the last 30 days of flares from `api.nasa.gov/DONKI/FLR`. If that fails it tries the key-free CCMC mirror (`kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get/FLR`), and after that a bundled real snapshot (26 Aug – 19 Sep 2026). A chip in the header shows which source is in use.
- **API key:** copy `.env.example` to `.env` and set `VITE_NASA_API_KEY` (free at https://api.nasa.gov). Without it, `DEMO_KEY` is used, which is rate-limited.
- **Simulation:** an animated Sun (GLSL granulation and sunspots) replays each flare in four steps: a flash with a magnetic loop at the real active-region location, an **X-ray wave** (8 min in real life), an **energetic particle storm** along a curved Parker-spiral path (20–60 min), and a **CME cloud** (1–3 days). Earth's magnetic shield deflects particles for the ISS. A live event feed explains each step in kid-friendly words.
- **Risk score (0–100)** for the selected mission phase combines flare class, linked particle storm and CME, magnetic connection (western flares aim particles our way) and phase shielding (ISS 25% → Mars transit 100%). Three sub-scores: **crew radiation**, **electronics glitches**, and **fire ignition**, which is scaled by the phase's cabin oxygen and links space weather back to fire safety. There's also a decaying "right now" score.
- **Timeline:** a 30-day bar chart by X-ray class (C/M/X) with SEP markers. Tap a bar to replay that flare.
- **Game, Storm Shelter:** you're the flight director. When the X-ray alarm sounds, choose *Take shelter* or *Keep working* before the particles arrive. The risk score stays hidden until you decide. 3 correct calls earn the **Storm Watcher** badge and unlock the DONKI data card.

The model lives in `src/utils/spaceWeather.js` and the 3D scene in `src/components/solar/`. The risk score is educational, not an operational forecast.

## Solar Storm vs Earth (interactive what-if simulator)

This shows how a solar flare and its CME affect Earth. Users build their own storm or load a scenario:

- **Inputs:** flare strength (C1 → X45), CME direction (direct / glancing / miss), CME speed (300–3000 km/s), CME magnetic field Bz ("door open" when southward), cloud density, and **your city's latitude** (presets like Dhaka, London, Oslo).
- **Scenarios:** Quiet day, Strong M-flare, May 2024 "Gannon" storm, Halloween 2003, Carrington 1859, plus **the strongest real flare from NASA DONKI** in the last 30 days.
- **3D simulation:** a procedural Earth with day/night and city lights. Dipole magnetic field lines get **squashed on the day side and stretched into a tail**. The magnetopause and bow shock follow the Shue model, and solar-wind particles flow around them. The CME cloud travels from the Sun, protons rain into the poles, and **aurora curtains slide toward the equator** as Kp rises. ISS, GPS and GEO satellites change colour when threatened, city lights **flicker during grid-threatening storms**, and the sunlit ionosphere glows during radio blackouts. After the first launch, the sliders change the storm **live**.
- **Results:** Earth impact score, NOAA **R/S/G** scales, CME arrival time, how far the shield is squeezed (red if inside GEO orbit), "Can you see the aurora from your city?", and impact meters for radio, GPS, satellites, power grids, astronauts and flights.
- **Badge:** *Aurora Hunter*, for making the aurora visible from a city below 45° latitude.

The model is in `src/utils/earthImpact.js` and the scene in `src/components/earth/`.

## Game mode: every section is playable

Every section has an **Explore / Play** switch. Playing earns **XP**, **levels** (Cadet → Mission Fire Chief), **14 badges** and **4 missions**. Progress is saved in the browser. Open the trophy room from the level badge in the top bar.

| Section | Simulation / game | What kids learn | Badge |
|---|---|---|---|
| Mission overview | **Mission journey map** with an animated rocket. Visit all stops, or *Guess* the riskiest phase | Oxygen + partial gravity = more danger | Solar Explorer, Risk Reader |
| Flame Lab 3D | Full 3D fire simulation with **7 lab challenges** | Convection, microgravity, smoke alarms, extinguishers, cool flames | First Light, Space Ball, Alarm Raiser, Firefighter, Ghost Buster, Oxygen Starver, Moon Fire |
| Material Risk Ranker | **Burn Race** (3D): predict which material burns faster, then watch a 3-2-1 race on a test bench | Materials differ; fire-safe ones self-extinguish | Fire Detective |
| Gravity Gap-Filler | **Gravity Guess**: predict flame spread at Moon/Mars gravity from 0g and 1g data, earn 0–3 stars | Scientists fill data gaps with models and uncertainty | Gap Filler |
| Invisible Flame Radar | **Cool Flame Hunter**: 14 radar scans to find 5 hidden cool flames on a fogged map | Cool flames hide between "no fire" and "hot flame" | Ghost Flame Hunter |
| FireGPT | **FireGPT Quiz**: 7 questions with streak bonuses and NASA citations | Key microgravity fire facts | Space Scholar |
| Research Gap Map | **Gap Planner**: spend a 3-experiment budget where NASA learns the most | Research priorities | Mission Planner |
| Data sources | **Collectible NASA data cards** that flip open as badges are earned | Where the data comes from | — |

Game content is in `src/utils/gameData.js` and state is in `src/hooks/useGame.jsx`. The games live in `src/components/games/` and shared game UI (HUD, toasts, trophy drawer, stars, mode tabs) is in `src/components/game/`. 3D canvases mount only while on screen to save GPU memory.

## Flame Lab 3D

An interactive React Three Fiber simulation that teaches how fire behaves in space. It's built for kids but accurate enough for grown-ups.

- **Four places:** Earth (1g), Space station (0g), Moon base (0.16g, 34% O₂), Mars base (0.38g, 34% O₂). There's also a gravity slider for anything in between. The lab follows the dashboard's mission phase.
- **Live flame physics:** a custom GLSL shader flame morphs from a yellow teardrop (Earth) to a dim blue ball (space). Oxygen and material change its size, and the fuel chars and shrinks as it burns.
- **Particles you can learn from:** O₂ molecules (blue pairs) are pulled in and "eaten" by the fire. Soot rises and pools at the ceiling, which sets off the **smoke alarm** on Earth but rarely in space. A CO₂ extinguisher cloud puts the fire out.
- **Hidden cool flames:** put out a fuel droplet in 0g, then turn on **Heat vision** to reveal the invisible cool flame (the FLEX discovery).
- **Click objects in 3D:** click the sample to light it and the red extinguisher to spray. Floating props drift in 0g and drop to the floor with gravity.
- **Guided lessons (6 steps)** or **Free play**, plus a live "What's happening?" card with a *Science word*, fire-triangle labels, convection arrows, and kid-friendly gauges (fire size, fuel left, smoke alarm, flame shape, fresh oxygen).
- Bloom and vignette post-processing, adaptive DPR, lazy-loaded 3D bundle, and a tap-to-rotate toggle on touch screens so the page still scrolls.

Physics lives in `src/utils/labPhysics.js` and the state machine in `src/hooks/useFlameLab.js`. Both are simplified for teaching and are not engineering models.

## Features

| Section | Spec feature | What it does (with dummy data) |
|---|---|---|
| Mission phase picker (top bar) | F2 | ISS · Gateway · Moon · Mars transit · Mars surface. It sets gravity, O₂ and pressure, and every panel recomputes. Arrow keys switch phases. |
| Mission overview | F4 | Animated live risk gauge, condition cards, top-risk materials, risk-by-phase chart |
| Material Risk Ranker | F5, F6 | Toggle materials, sortable ranked table, "burns above X% O₂", SHAP "why this rank" bar chart |
| Gravity Gap-Filler | F3, F7 | Gravity slider plus Moon/Mars presets, Gaussian-Process mean, 95% uncertainty band, observed test points |
| Invisible Flame Radar | F12 | Fuel × diluent picker, O₂ × pressure regime map (hot / cool / extinct), current cabin marker |
| FireGPT | F9 | Chat with streamed answers, PSI/NTRS citation chips, suggested questions, typing state |
| Research Gap Map | F18 | O₂ × gravity test-coverage heatmap, untested zones, ranked "test next" list |
| Data sources | F1 | Cards linking to the PSI repository and NTRS reports |

## Project structure

```
flameatlas/
├── public/favicon.svg
├── src/
│   ├── assets/logo.svg
│   ├── components/        # one .jsx + .module.css per component
│   │   ├── FlameLab (3D lab section)
│   │   ├── lab/           # R3F scene: LabScene, Flame (GLSL), CoolFlame, Smoke, Oxygen, Spray,
│   │   │                  # Habitat, FuelSample, Extinguisher, SmokeDetector, Outside, FloatingProps,
│   │   │                  # ConvectionArrows, SceneLabels, ResponsiveCamera + UI: LabControls,
│   │   │                  # LessonCard, ExplainCard, LabReadouts
│   │   ├── Sidebar, Topbar, PhaseSelector
│   │   ├── MissionOverview, RiskGauge, StatCard, RiskBadge, ChartTooltip
│   │   ├── MaterialRanker, ShapPanel
│   │   ├── GravityGapFiller, FlameRadar, FireGPT, GapMap
│   │   └── SourcesPanel, Footer, Panel (shared card shell)
│   ├── hooks/
│   │   ├── useMission.jsx        # mission-phase context shared by all features
│   │   ├── useFlameLab.js        # Flame Lab state machine (ignite, spray, burn, lessons)
│   │   ├── useMediaQuery.js
│   │   └── useAnimatedNumber.js  # tweened numbers (respects reduced motion)
│   ├── pages/Dashboard.jsx
│   ├── styles/global.css         # design tokens, base styles, slider
│   ├── utils/
│   │   ├── data.js               # phases, materials, fuels, sources, FireGPT answers
│   │   ├── models.js             # stand-ins for /risk /rank /gravity /regime /gaps
│   │   └── labPhysics.js         # kid-friendly flame physics, explanations, lessons
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── package.json
└── vite.config.js
```

## Connecting the real backend

Replace the functions in `src/utils/models.js` with `fetch` calls to the FastAPI service (`/risk`, `/rank`, `/gravity`, `/regime`, `/gaps`, `/ask`). Keep the return shapes the same so the components need no changes. Debounce slider-driven calls (about 250 ms).

## Stack and assets

- React 18 + Vite 5, CSS Modules
- Framer Motion (layout, entrance and micro-interaction animations)
- Recharts (charts)
- canvas-confetti (badge celebrations)
- three.js, @react-three/fiber, @react-three/drei, @react-three/postprocessing (3D Flame Lab)
- Icons: [Lucide](https://lucide.dev) (ISC license)
- Fonts: Space Grotesk and JetBrains Mono from [Google Fonts](https://fonts.google.com) (OFL)
- Data references: NASA PSI (psi.ndc.nasa.gov) and NTRS (ntrs.nasa.gov). All are public.
