/**
 * How a solar flare + CME affects Earth. Simplified, well-known space-physics relations:
 *  - Radio blackout (NOAA R-scale) from flare X-ray flux
 *  - Radiation storm (S-scale) from an estimated proton flux
 *  - Geomagnetic storm: Dst ≈ −0.01·v·Bs − 20 (Burton-style), Kp and G-scale from Dst
 *  - Magnetopause stand-off distance from the Shue et al. (1998) model
 *  - Auroral oval equatorward edge moves ~3.4° per Kp
 *  - CME transit time with simple drag toward the ambient 400 km/s solar wind
 * Educational model: real forecasts use much more data.
 */

const AU_KM = 1.496e8;
const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const lerpTable = (table, x) => {
  if (x <= table[0][0]) return table[0][1];
  for (let i = 1; i < table.length; i++) {
    const [x1, y1] = table[i];
    const [x0, y0] = table[i - 1];
    if (x <= x1) return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
  }
  return table[table.length - 1][1];
};

/** Flare "level" = log10(flux) + 8, so C1 = 2, M1 = 3, X1 = 4, X10 = 5. */
export const fluxFromLevel = (level) => 10 ** (level - 8);
export function classFromLevel(level) {
  const flux = fluxFromLevel(level);
  const letters = [
    ['X', 1e-4],
    ['M', 1e-5],
    ['C', 1e-6],
    ['B', 1e-7],
    ['A', 1e-8],
  ];
  const [letter, base] = letters.find(([, b]) => flux >= b) || letters[4];
  return `${letter}${(flux / base).toFixed(1)}`;
}

export const HIT = { direct: 1, glancing: 0.5, miss: 0 };

export const CITIES = [
  { name: 'Dhaka', lat: 23.8 },
  { name: 'Miami', lat: 25.8 },
  { name: 'Cairo', lat: 30 },
  { name: 'Tokyo', lat: 35.7 },
  { name: 'New York', lat: 40.7 },
  { name: 'London', lat: 51.5 },
  { name: 'Oslo', lat: 59.9 },
  { name: 'Reykjavík', lat: 64.1 },
  { name: 'Sydney', lat: -33.9 },
];

/** Scenario presets. Historic storms use approximate published values. */
export const PRESETS = [
  { id: 'quiet', name: 'Quiet day', level: 2.3, hit: 'miss', speed: 400, bz: 2, density: 5, blurb: 'A small C-flare and a calm solar wind.' },
  {
    id: 'm-flare',
    name: 'Strong M-flare',
    level: 3.5,
    hit: 'glancing',
    speed: 800,
    bz: -16,
    density: 12,
    blurb: 'A common storm that happens a few times a year.',
  },
  {
    id: 'gannon',
    name: 'May 2024 storm',
    level: 4.9,
    hit: 'direct',
    speed: 1300,
    bz: -45,
    density: 35,
    blurb: 'The "Gannon storm": auroras seen as far south as Mexico and India.',
  },
  {
    id: 'halloween',
    name: 'Halloween 2003',
    level: 5.45,
    hit: 'direct',
    speed: 2000,
    bz: -30,
    density: 20,
    blurb: 'An X28 flare, one of the biggest ever measured. Satellites were damaged.',
  },
  {
    id: 'carrington',
    name: 'Carrington 1859',
    level: 5.65,
    hit: 'direct',
    speed: 2400,
    bz: -60,
    density: 50,
    blurb: 'The biggest storm on record. Telegraph wires sparked and auroras reached Cuba.',
  },
];

export const DEFAULT_INPUTS = { level: 3.5, hit: 'glancing', speed: 800, bz: -10, density: 12, cityLat: 23.8, cityName: 'Dhaka' };

/** Quiet-time baseline, used before a storm is launched. */
export const QUIET = { rmp: 10.9, auroraLat: 66, kp: 1 };

const scaleFrom = (value, steps) => steps.reduce((lvl, s, i) => (value >= s ? i + 1 : lvl), 0);

export function earthImpact(inp) {
  const hit = HIT[inp.hit] ?? 0;
  const flux = fluxFromLevel(inp.level);

  // Radio blackout: X-rays arrive in 8 minutes, only the sunlit side.
  const R = scaleFrom(flux, [1e-5, 5e-5, 1e-4, 1e-3, 2e-3]);

  // Radiation storm: estimated ≥10 MeV proton flux (pfu).
  const pfu = 10 ** (1.5 * (inp.level - 2.6)) * (0.3 + 0.7 * hit) * (inp.speed / 1000);
  const S = scaleFrom(pfu, [10, 100, 1e3, 1e4, 1e5]);

  // Solar wind at Earth (blend CME with ambient wind by how squarely it hits).
  const v = inp.speed * hit + 400 * (1 - hit);
  const n = inp.density * hit + 5 * (1 - hit);
  const bz = inp.bz * hit;
  const bs = Math.max(0, -bz); // southward field opens the "door" into the magnetosphere
  const dst = hit > 0 ? -(0.01 * v * bs + 20 * hit) : -8;
  const kp = Math.min(
    9,
    lerpTable(
      [
        [0, 1],
        [-30, 3],
        [-50, 5],
        [-100, 6],
        [-150, 7],
        [-250, 8],
        [-350, 9],
      ].map(([d, k]) => [-d, k]),
      -dst,
    ),
  );
  const G = kp >= 9 ? 5 : kp >= 8 ? 4 : kp >= 7 ? 3 : kp >= 6 ? 2 : kp >= 5 ? 1 : 0;

  // Magnetopause (Shue 1998): dynamic pressure in nPa.
  const P = 1.6726e-6 * n * v * v;
  const rmp = (10.22 + 1.29 * Math.tanh(0.184 * (bz + 8.14))) * P ** (-1 / 6.6);

  const auroraLat = clamp(66.5 - 3.4 * kp - Math.max(0, (-dst - 400) / 80), 18, 70);
  const cityAbs = Math.abs(inp.cityLat);
  const aurora = cityAbs >= auroraLat ? 'overhead' : cityAbs >= auroraLat - 5 ? 'horizon' : 'no';

  const vAvg = 400 + (inp.speed - 400) * 0.8;
  const arrivalHours = AU_KM / vAvg / 3600;

  // Impacts (0–100) and plain-language details.
  const gpsErr = Math.round(1 + kp * kp * 0.55 + S * 2);
  const drag = Math.round(8 * kp ** 1.6);
  const geoExposed = rmp < 6.6;
  const impacts = {
    radio: { score: R * 20, detail: R ? `Shortwave radio fades on the sunny side for ~${[0, 10, 30, 60, 120, 180][R]} min` : 'Radios work normally' },
    gps: { score: clamp(gpsErr / 45) * 100, detail: `GPS can be off by about ${gpsErr} m` },
    satellites: {
      score: clamp(drag / 250 + (geoExposed ? 0.4 : 0) + S * 0.06) * 100,
      detail: geoExposed ? `Shield squeezed inside GEO orbit! Satellites exposed. Drag +${drag}%` : `Air drag on low satellites +${drag}%`,
    },
    power: {
      score: clamp(-dst / 700) * 100,
      detail: -dst > 500 ? 'Big risk of blackouts from induced currents' : -dst > 200 ? 'Power grid operators on alert' : 'Power grids are fine',
    },
    astronauts: {
      score: S * 20,
      detail: S >= 3 ? 'Astronauts must shelter in shielded areas' : S >= 1 ? 'Extra radiation: spacewalks postponed' : 'Normal radiation levels',
    },
    flights: { score: (S >= 2 || R >= 3 ? 55 : 0) + S * 9, detail: S >= 2 || R >= 3 ? 'Polar flights rerouted to lower routes' : 'Flights normal' },
  };
  const overall = Math.round(
    clamp(
      (impacts.radio.score * 0.12 +
        impacts.gps.score * 0.12 +
        impacts.satellites.score * 0.2 +
        impacts.power.score * 0.26 +
        impacts.astronauts.score * 0.18 +
        impacts.flights.score * 0.12) /
        100,
    ) * 100,
  );

  return {
    R,
    S,
    G,
    kp,
    dst: Math.round(dst),
    pfu,
    rmp,
    auroraLat,
    aurora,
    arrivalHours,
    impacts,
    overall,
    geoExposed,
    classType: classFromLevel(inp.level),
    hit,
  };
}

export const SCALE_TEXT = {
  R: ['None', 'Minor', 'Moderate', 'Strong', 'Severe', 'Extreme'],
  S: ['None', 'Minor', 'Moderate', 'Strong', 'Severe', 'Extreme'],
  G: ['None', 'Minor', 'Moderate', 'Strong', 'Severe', 'Extreme'],
};

/** Presets from a real DONKI flare (used by the "Latest NASA flare" button). */
export function inputsFromFlare(flare) {
  const abs = Math.abs(flare.lon);
  return {
    level: Math.log10(flare.flux) + 8,
    hit: !flare.hasCME ? 'miss' : abs < 35 ? 'direct' : abs < 70 ? 'glancing' : 'miss',
    speed: flare.hasCME ? Math.round(500 + (Math.log10(flare.flux) + 6) * 400) : 420,
    bz: flare.hasCME ? -12 : 0,
    density: flare.hasCME ? 15 : 6,
  };
}
