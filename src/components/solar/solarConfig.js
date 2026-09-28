/** Compressed (not to scale!) solar system layout for the flare simulation. */
export const SUN = [-7.5, 0, 0];
export const SUN_R = 2.6;
export const EARTH = [3.2, 0, 0.5];
export const MOON = [4.3, 0.45, 1.3];
export const MARS = [9.5, -0.2, -2.2];
export const TRANSIT = [6.3, 0.2, -0.8];

export const CRAFT = {
  iss: [EARTH[0] + 0.72, EARTH[1] + 0.22, EARTH[2]],
  gateway: [MOON[0] + 0.32, MOON[1] + 0.26, MOON[2]],
  moon: [MOON[0] - 0.13, MOON[1] + 0.1, MOON[2] + 0.06],
  transit: TRANSIT,
  mars: [MARS[0] - 0.27, MARS[1] + 0.12, MARS[2] + 0.06],
};

/** Simulation clock (seconds) → real-world timing, for the event feed. */
export const T = { XRAY: 0.9, SEP: 3.4, CME: 7.8, END: 10 };

/** Point on the Sun's surface for a flare at heliographic lat/lon (lon 0 faces Earth). */
export function regionPoint(lat, lon, r = SUN_R) {
  const la = (lat * Math.PI) / 180;
  const lo = (lon * Math.PI) / 180;
  return [SUN[0] + r * Math.cos(la) * Math.cos(lo), SUN[1] + r * Math.sin(la), SUN[2] - r * Math.cos(la) * Math.sin(lo)];
}
