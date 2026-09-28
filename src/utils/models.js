/**
 * Lightweight client-side stand-ins for the FastAPI model endpoints
 * (/risk, /rank, /gravity, /regime, /gaps). Deterministic so the demo is stable.
 */
import { MATERIALS, FIREGPT_KB } from './data';

export const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

/** Deterministic pseudo-random from a string seed (for stable dummy noise). */
export function seeded(seed) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Gravity effect: 0g starves the flame of buoyant flow; partial g peaks spread, 1g slightly lower. */
const gravityFactor = (g) => 0.72 + 0.55 * Math.sin((Math.PI * clamp(g)) / 1.25);

/** SHAP-style additive contributions for one material under given conditions. */
export function shapFor(material, { o2, pressure, gravity }) {
  const o2Eff = (o2 - 21) * 0.018;
  const pEff = -(14.7 - pressure) * 0.006 + (o2 > 30 ? 0.02 : 0);
  const gEff = (gravityFactor(gravity) - 1) * 0.28;
  const matEff = (material.base - 0.5) * 0.7;
  const loiEff = -(material.loi - 21) * 0.004;
  return [
    { feature: 'Oxygen %', value: +o2Eff.toFixed(3) },
    { feature: 'Material chemistry', value: +matEff.toFixed(3) },
    { feature: 'Oxygen index (LOI)', value: +loiEff.toFixed(3) },
    { feature: 'Gravity level', value: +gEff.toFixed(3) },
    { feature: 'Pressure', value: +pEff.toFixed(3) },
  ];
}

export function materialRisk(material, cond) {
  const sum = shapFor(material, cond).reduce((a, s) => a + s.value, 0);
  return clamp(0.42 + sum);
}

/** /rank — materials sorted by predicted flammability. */
export function rankMaterials(cond, ids = MATERIALS.map((m) => m.id)) {
  return MATERIALS.filter((m) => ids.includes(m.id))
    .map((m) => {
      const risk = materialRisk(m, cond);
      const burnsAbove = Math.max(10, Math.round(m.loi - (cond.gravity > 0 ? 2 : 0) - (14.7 - cond.pressure) * 0.3));
      return { ...m, risk, burnsAbove, selfExtinguishes: cond.o2 < burnsAbove };
    })
    .sort((a, b) => b.risk - a.risk);
}

/** /risk — overall cabin fire risk (0–100) for a phase. */
export function cabinRisk(cond) {
  const ranked = rankMaterials(cond);
  const avg = ranked.reduce((a, m) => a + m.risk, 0) / ranked.length;
  return Math.round(clamp(avg * 1.15) * 100);
}

export const riskLevel = (r) =>
  r >= 0.7
    ? { label: 'Critical', tone: 'critical' }
    : r >= 0.5
      ? { label: 'High', tone: 'high' }
      : r >= 0.3
        ? { label: 'Moderate', tone: 'moderate' }
        : { label: 'Low', tone: 'low' };

/** /gravity — Gaussian Process mean + 95% band for flame spread (mm/s) from 0 to 1g. */
export function gravityCurve(material) {
  const scale = 0.6 + material.base * 3.2;
  const pts = [];
  for (let i = 0; i <= 50; i++) {
    const g = i / 50;
    const mean = scale * gravityFactor(g);
    // Distance from nearest observed gravity (0g flight data, 1g ground data).
    const dist = Math.min(g, 1 - g);
    const sd = 0.05 * scale + dist * 0.9 * scale * 0.55;
    pts.push({ g: +g.toFixed(2), mean: +mean.toFixed(3), band: [+(mean - sd).toFixed(3), +(mean + sd).toFixed(3)] });
  }
  return pts;
}

export function gravityObservations(material) {
  const rnd = seeded(material.id);
  const scale = 0.6 + material.base * 3.2;
  const obs = [];
  [0, 0, 0.01, 0.02, 0.05].forEach((g) => obs.push({ g, obs: +(scale * gravityFactor(g) * (0.92 + rnd() * 0.16)).toFixed(3) }));
  [0.95, 1, 1, 1].forEach((g) => obs.push({ g, obs: +(scale * gravityFactor(g) * (0.92 + rnd() * 0.16)).toFixed(3) }));
  return obs;
}

export function predictAt(material, g) {
  const curve = gravityCurve(material);
  const idx = Math.round(clamp(g) * 50);
  return curve[idx];
}

/** /regime — burning regime classifier over O₂ (%) × pressure (atm). */
const FUEL_SHIFT = { heptane: 0, decane: 1.5, dodecane: 3, methanol: -2.5 };
const DILUENT_SHIFT = { n2: 0, co2: 4, he: 2 };

export function regimeAt(o2, atm, fuelId, diluentId) {
  const shift = FUEL_SHIFT[fuelId] + DILUENT_SHIFT[diluentId];
  const extinctLimit = 13 + shift - (atm - 1) * 2.2;
  const coolWidth = 4.5 + (fuelId === 'methanol' ? -2.5 : 0) + (diluentId === 'co2' ? 1.8 : 0) + atm * 0.6;
  if (o2 < extinctLimit) return 'extinct';
  if (o2 < extinctLimit + coolWidth) return 'cool';
  return 'hot';
}

export const O2_AXIS = [10, 13, 16, 19, 22, 25, 28, 31, 34, 37, 40];
export const ATM_AXIS = [3.0, 2.5, 2.0, 1.5, 1.0, 0.75, 0.5];

/** /gaps — how many experiments tested each O₂ × gravity cell. */
export const GAP_O2 = [15, 18, 21, 24, 27, 30, 34, 38];
export const GAP_G = [1, 0.75, 0.5, 0.38, 0.16, 0.05, 0];

export function gapGrid() {
  const rnd = seeded('gaps');
  return GAP_G.map((g) =>
    GAP_O2.map((o2) => {
      let n = 0;
      if (g === 0) n = Math.round(4 + rnd() * 22 * (o2 <= 30 ? 1 : 0.25));
      else if (g === 1) n = Math.round(6 + rnd() * 30 * (o2 <= 34 ? 1 : 0.4));
      else if (g === 0.05) n = o2 <= 24 ? Math.round(rnd() * 4) : 0;
      else if (g === 0.16) n = o2 === 21 ? 1 : 0;
      else n = 0;
      return { g, o2, n };
    }),
  );
}

export const TEST_NEXT = [
  { cond: '34% O₂ · 8.2 psi · 0.16g', why: 'Artemis baseline habitat — zero solid-fuel tests', gain: 0.92 },
  { cond: '34% O₂ · 8.2 psi · 0.38g', why: 'Mars surface habitat — widest GP uncertainty', gain: 0.88 },
  { cond: '30% O₂ · 10.2 psi · 0g', why: 'Gateway/transit bridge between FLEX-2 and BASS', gain: 0.71 },
  { cond: '38% O₂ · 0.5g', why: 'Stress-case for enriched atmospheres', gain: 0.54 },
];

/** FireGPT stand-in: keyword retrieval over canned answers. */
export function askFireGPT(question) {
  const q = question.toLowerCase();
  let best = null;
  let bestScore = 0;
  FIREGPT_KB.forEach((entry) => {
    const score = entry.keys.filter((k) => q.includes(k)).length;
    if (score > bestScore) {
      best = entry;
      bestScore = score;
    }
  });
  return (
    best || {
      answer:
        'I could not find a NASA source that answers this directly. FireGPT only answers from indexed PSI and NTRS text — try asking about a specific material, oxygen level, gravity level, cool flames, smoke or suppressants.',
      citations: [],
      confidence: 0,
    }
  );
}
