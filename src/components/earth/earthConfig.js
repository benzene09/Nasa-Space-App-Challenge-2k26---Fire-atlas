/** Visual scale: Earth radius = 1. Distances in Earth radii (Re) are compressed so everything fits. */
export const vis = (re) => 1 + (re - 1) * 0.38;
export const SUN_POS = [-34, 0, 0];
export const GEO_RE = 6.6;
export const GPS_RE = 4.2;
export const TL = { XRAY: 0.5, PROTON: 1.8, CME_LAUNCH: 2.5, ARRIVE: 7, PEAK: 8.5, END: 9.5 };
export const lerp = (a, b, t) => a + (b - a) * t;
