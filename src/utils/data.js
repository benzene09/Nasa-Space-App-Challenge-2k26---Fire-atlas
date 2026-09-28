/**
 * Dummy dataset for the FlameAtlas demo.
 * Values are illustrative placeholders shaped like the unified NASA dataset (F1):
 * FLEX (PSI-69), FLEX-2 (PSI-68), BASS (PSI-26), CFI-G (PSI-159), PSI-117, NTRS.
 */

export const MISSION_PHASES = [
  {
    id: 'iss',
    name: 'ISS',
    subtitle: 'Low Earth orbit',
    gravity: 0,
    o2: 21,
    pressure: 14.7,
    commDelay: '< 1 s',
    note: 'Sea-level air, reference baseline for most experiments.',
  },
  {
    id: 'gateway',
    name: 'Gateway',
    subtitle: 'Lunar orbit',
    gravity: 0,
    o2: 26.5,
    pressure: 10.2,
    commDelay: '1.3 s',
    note: 'Reduced-pressure, enriched-O₂ exploration atmosphere.',
  },
  {
    id: 'moon',
    name: 'Moon',
    subtitle: 'Artemis surface',
    gravity: 0.16,
    o2: 34,
    pressure: 8.2,
    commDelay: '1.3 s',
    note: 'Proposed 8.2 psi / 34% O₂ habitat — materials ignite more easily.',
  },
  {
    id: 'transit',
    name: 'Mars transit',
    subtitle: 'Deep space cruise',
    gravity: 0,
    o2: 26.5,
    pressure: 10.2,
    commDelay: '4–20 min',
    note: 'Long exposure, no resupply, growing comms delay.',
  },
  {
    id: 'mars',
    name: 'Mars surface',
    subtitle: 'Surface habitat',
    gravity: 0.38,
    o2: 34,
    pressure: 8.2,
    commDelay: 'up to 20 min',
    note: 'Partial gravity with almost no test data — the biggest unknown.',
  },
];

/** Cabin materials. `lol` = limiting oxygen index (%), `base` = normalized flammability. */
export const MATERIALS = [
  { id: 'nomex', name: 'Nomex HT90-40', type: 'Fabric', base: 0.34, loi: 28, source: 'PSI-26 BASS' },
  { id: 'kapton', name: 'Kapton film', type: 'Polyimide', base: 0.22, loi: 37, source: 'PSI-26 BASS' },
  { id: 'pmma', name: 'PMMA (acrylic)', type: 'Thermoplastic', base: 0.78, loi: 17, source: 'PSI-26 BASS' },
  { id: 'cotton', name: 'Cotton / fiberglass', type: 'Fabric blend', base: 0.71, loi: 19, source: 'PSI-26 BASS' },
  { id: 'ptfe', name: 'PTFE (Teflon)', type: 'Fluoropolymer', base: 0.08, loi: 95, source: 'PSI-62' },
  { id: 'silicone', name: 'Silicone rubber', type: 'Elastomer', base: 0.41, loi: 26, source: 'PSI-62' },
  { id: 'nylon', name: 'Nylon 6,6 (Velcro)', type: 'Thermoplastic', base: 0.63, loi: 22, source: 'PSI-26 BASS' },
  { id: 'delrin', name: 'Delrin (POM)', type: 'Thermoplastic', base: 0.82, loi: 15, source: 'PSI-26 BASS' },
  { id: 'ultem', name: 'Ultem 9085', type: 'Polyetherimide', base: 0.27, loi: 47, source: 'PSI-62' },
  { id: 'pe', name: 'Polyethylene bag', type: 'Polyolefin', base: 0.86, loi: 17, source: 'PSI-26 BASS' },
];

export const FUELS = [
  { id: 'heptane', name: 'n-Heptane', source: 'PSI-69 FLEX' },
  { id: 'decane', name: 'n-Decane', source: 'PSI-68 FLEX-2' },
  { id: 'dodecane', name: 'n-Dodecane', source: 'PSI-159 CFI-G' },
  { id: 'methanol', name: 'Methanol', source: 'PSI-69 FLEX' },
];

export const DILUENTS = [
  { id: 'n2', name: 'N₂ (air-like)' },
  { id: 'co2', name: 'CO₂ added' },
  { id: 'he', name: 'He diluent' },
];

export const SOURCES = [
  { id: 'DONKI', name: 'NASA DONKI space weather (flares, CMEs, SEPs)', use: 'Live solar flare catalog for Solar Flare Watch' },
  { id: 'PSI-69', name: 'Flame Extinguishment Experiment (FLEX)', use: 'Burning limits, suppressants, cool flames' },
  { id: 'PSI-68', name: 'FLEX-2', use: '0.5–3.0 atm, 10–40% O₂ conditions' },
  { id: 'PSI-26', name: 'Burning and Suppression of Solids (BASS)', use: 'Solid material flame spread' },
  { id: 'PSI-159', name: 'ACME Cool Flames Investigation (CFI-G)', use: 'Cool-flame conditions' },
  { id: 'PSI-117', name: 'FLEX cool-flame CFD analysis', use: 'Cool-flame model outputs' },
  { id: 'PSI-47', name: 'DAFT / DAFT-2', use: 'Smoke particle counts' },
  { id: 'NTRS 20150023456', name: 'FLEX detailed results (284 tests)', use: 'Tabulated test results' },
  { id: 'NTRS 20240002981', name: 'Saffire VI results', use: 'Large-scale fire, CO and CO₂' },
];

/** Canned FireGPT answers — stand-ins for the RAG endpoint. */
export const FIREGPT_KB = [
  {
    keys: ['nomex', '34'],
    answer:
      'Yes — in a 34% O₂ / 8.2 psi Moon habitat, Nomex HT90-40 is expected to sustain upward flame spread. BASS samples self-extinguished in ISS air but spread slowly once O₂ exceeded ~30%. At 0.16g buoyant flow adds oxygen supply at the flame front, so spread is likely faster than in 0g.',
    citations: ['PSI-26 BASS', 'NTRS 20150023456'],
    confidence: 0.78,
  },
  {
    keys: ['cool flame', 'invisible', 'cool'],
    answer:
      'Cool flames are low-temperature (~500–800 K) reactions that emit almost no visible light. FLEX observed n-heptane droplets continuing to burn in a cool-flame regime after the hot flame went out, especially with CO₂ or He diluents at reduced O₂.',
    citations: ['PSI-69 FLEX', 'PSI-117', 'PSI-159 CFI-G'],
    confidence: 0.84,
  },
  {
    keys: ['smoke', 'detector'],
    answer:
      'Microgravity smoke particles are larger and more varied than on Earth because soot residence time increases without buoyancy. DAFT and SAME-2 found ionization-style detectors underestimate these particles, so optical/multi-wavelength sensors are recommended.',
    citations: ['PSI-47 DAFT', 'NTRS 20130000422'],
    confidence: 0.81,
  },
  {
    keys: ['mars', 'gravity', '0.38'],
    answer:
      'No public experiment has burned solids at exactly 0.38g. FlameAtlas interpolates between 0g (BASS) and 1g ground data with a Gaussian Process; the uncertainty band is widest near Mars gravity, which is why the Research Gap Map flags it as a top test priority.',
    citations: ['PSI-26 BASS', 'PSI-69 FLEX'],
    confidence: 0.62,
  },
  {
    keys: ['suppress', 'extinguish', 'co2'],
    answer:
      'FLEX tested CO₂ and He as suppressants. CO₂ at ~15% concentration reliably extinguished heptane droplets at 1 atm, while He required higher concentrations. In enriched-O₂ habitats the required suppressant concentration increases roughly with O₂ fraction.',
    citations: ['PSI-69 FLEX', 'NTRS 20150023456'],
    confidence: 0.76,
  },
];

export const SUGGESTED_QUESTIONS = [
  'Will Nomex burn at 34% O₂ on the Moon?',
  'Why are cool flames hard to see?',
  'Can smoke detectors be trusted in microgravity?',
  'What do we know about fire at Mars gravity?',
];
