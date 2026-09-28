/** Shared positions for the 3D habitat (world units ≈ metres, scaled for display). */
export const MODULE = { radius: 3.4, floor: -1.1, ceiling: 3.5 };
export const DETECTOR_POS = [0, MODULE.ceiling - 0.06, 0];
export const NOZZLE_POS = [1.62, -0.02, 0.78];

export const anchorFor = (kind) => (kind === 'droplet' ? [0, 0.5, 0] : [0, 0.09, 0]);

export const PLACE_LOOK = {
  earth: { bg: '#0f2c52', ground: '#1f4a2c', sky: '#7fb6ff', stars: false },
  orbit: { bg: '#02040a', ground: null, sky: '#3a4a7a', stars: true },
  moon: { bg: '#03050b', ground: '#5d5e66', sky: '#8a8fa3', stars: true },
  mars: { bg: '#3a170c', ground: '#8a3a1c', sky: '#e08a5a', stars: false },
};
