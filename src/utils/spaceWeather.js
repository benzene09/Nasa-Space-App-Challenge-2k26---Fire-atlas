/**
 * Solar flare data from NASA DONKI (Space Weather Database Of Notifications, Knowledge, Information)
 * and a mission-aware space-weather risk score.
 *
 * Sources tried in order:
 *   1. https://api.nasa.gov/DONKI/FLR   (needs VITE_NASA_API_KEY, falls back to DEMO_KEY)
 *   2. https://kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get/FLR   (CCMC mirror, no key)
 *   3. Bundled offline snapshot of real DONKI flares (26 Aug – 19 Sep 2026)
 */

const API_KEY = import.meta.env.VITE_NASA_API_KEY || 'DEMO_KEY';
const DAY = 86400000;

/** Real DONKI flares captured 26 Sep 2026, used when the API is unreachable or rate-limited. */
export const SNAPSHOT = [
  {
    flrID: '2026-08-26T06:29:00-FLR-001',
    classType: 'M2.2',
    beginTime: '2026-08-26T06:29Z',
    peakTime: '2026-08-26T06:34Z',
    endTime: '2026-08-26T06:38Z',
    sourceLocation: 'N03W02',
    activeRegionNum: 14513,
    linkedEvents: ['2026-08-26T07:38:00-CME-001'],
  },
  {
    flrID: '2026-08-26T12:06:00-FLR-001',
    classType: 'M1.0',
    beginTime: '2026-08-26T12:06Z',
    peakTime: '2026-08-26T12:14Z',
    endTime: '2026-08-26T12:22Z',
    sourceLocation: 'N04W05',
    activeRegionNum: 14513,
    linkedEvents: null,
  },
  {
    flrID: '2026-08-26T21:29:00-FLR-001',
    classType: 'C3.4',
    beginTime: '2026-08-26T21:29Z',
    peakTime: '2026-08-26T21:40Z',
    endTime: '2026-08-26T21:45Z',
    sourceLocation: 'N07E45',
    activeRegionNum: 14518,
    linkedEvents: ['2026-08-26T22:24:00-CME-001'],
  },
  {
    flrID: '2026-08-30T01:10:00-FLR-001',
    classType: 'C3.0',
    beginTime: '2026-08-30T01:10Z',
    peakTime: '2026-08-30T01:20Z',
    endTime: '2026-08-30T01:25Z',
    sourceLocation: 'N12E90',
    activeRegionNum: 14521,
    linkedEvents: ['2026-08-30T01:48:00-CME-001'],
  },
  {
    flrID: '2026-08-31T03:31:00-FLR-001',
    classType: 'C1.0',
    beginTime: '2026-08-31T03:31Z',
    peakTime: '2026-08-31T03:33Z',
    endTime: '2026-08-31T03:35Z',
    sourceLocation: 'N12E80',
    activeRegionNum: 14521,
    linkedEvents: ['2026-08-31T04:12:00-CME-001'],
  },
  {
    flrID: '2026-09-01T21:04:00-FLR-001',
    classType: 'C5.7',
    beginTime: '2026-09-01T21:04Z',
    peakTime: '2026-09-01T21:10Z',
    endTime: '2026-09-01T21:12Z',
    sourceLocation: 'N15E90',
    activeRegionNum: 14524,
    linkedEvents: ['2026-09-01T23:00:00-CME-001'],
  },
  {
    flrID: '2026-09-02T18:57:00-FLR-001',
    classType: 'M3.0',
    beginTime: '2026-09-02T18:57Z',
    peakTime: '2026-09-02T19:20Z',
    endTime: '2026-09-02T19:48Z',
    sourceLocation: 'N12E90',
    activeRegionNum: 14524,
    linkedEvents: ['2026-09-02T19:36:00-CME-001'],
  },
  {
    flrID: '2026-09-03T09:35:00-FLR-001',
    classType: 'C2.2',
    beginTime: '2026-09-03T09:35Z',
    peakTime: '2026-09-03T09:42Z',
    endTime: '2026-09-03T09:48Z',
    sourceLocation: 'N11E44',
    activeRegionNum: 14523,
    linkedEvents: ['2026-09-03T11:01:00-CME-001'],
  },
  {
    flrID: '2026-09-04T07:45:00-FLR-001',
    classType: 'M1.2',
    beginTime: '2026-09-04T07:45Z',
    peakTime: '2026-09-04T07:53Z',
    endTime: '2026-09-04T08:00Z',
    sourceLocation: 'N14E71',
    activeRegionNum: 14524,
    linkedEvents: null,
  },
  {
    flrID: '2026-09-04T19:02:00-FLR-001',
    classType: 'C6.7',
    beginTime: '2026-09-04T19:02Z',
    peakTime: '2026-09-04T19:30Z',
    endTime: '2026-09-04T19:41Z',
    sourceLocation: 'N12E55',
    activeRegionNum: 14524,
    linkedEvents: ['2026-09-04T20:15:00-CME-001'],
  },
  {
    flrID: '2026-09-05T10:24:00-FLR-001',
    classType: 'C6.4',
    beginTime: '2026-09-05T10:24Z',
    peakTime: '2026-09-05T10:45Z',
    endTime: '2026-09-05T10:56Z',
    sourceLocation: 'N12E45',
    activeRegionNum: 14524,
    linkedEvents: ['2026-09-05T11:09:00-CME-001'],
  },
  {
    flrID: '2026-09-05T15:04:00-FLR-001',
    classType: 'M1.0',
    beginTime: '2026-09-05T15:04Z',
    peakTime: '2026-09-05T15:18Z',
    endTime: '2026-09-05T15:27Z',
    sourceLocation: 'S12W68',
    activeRegionNum: 14520,
    linkedEvents: ['2026-09-05T15:36:00-CME-001', '2026-09-05T15:45:00-SEP-001', '2026-09-05T16:15:00-SEP-001', '2026-09-05T16:30:00-SEP-001'],
  },
  {
    flrID: '2026-09-05T17:32:00-FLR-001',
    classType: 'C8.5',
    beginTime: '2026-09-05T17:32Z',
    peakTime: '2026-09-05T17:46Z',
    endTime: '2026-09-05T17:53Z',
    sourceLocation: 'N12E42',
    activeRegionNum: 14524,
    linkedEvents: ['2026-09-05T18:09:00-CME-001'],
  },
  {
    flrID: '2026-09-06T10:31:00-FLR-001',
    classType: 'C5.0',
    beginTime: '2026-09-06T10:31Z',
    peakTime: '2026-09-06T10:42Z',
    endTime: '2026-09-06T10:48Z',
    sourceLocation: 'N12E32',
    activeRegionNum: 14524,
    linkedEvents: ['2026-09-06T10:53:00-CME-001'],
  },
  {
    flrID: '2026-09-08T12:19:00-FLR-001',
    classType: 'C2.4',
    beginTime: '2026-09-08T12:19Z',
    peakTime: '2026-09-08T12:24Z',
    endTime: '2026-09-08T12:27Z',
    sourceLocation: 'N10W35',
    activeRegionNum: 14521,
    linkedEvents: ['2026-09-08T13:59:00-CME-001'],
  },
  {
    flrID: '2026-09-09T08:48:00-FLR-001',
    classType: 'C3.4',
    beginTime: '2026-09-09T08:48Z',
    peakTime: '2026-09-09T09:08Z',
    endTime: '2026-09-09T09:23Z',
    sourceLocation: 'N15W05',
    activeRegionNum: 14524,
    linkedEvents: ['2026-09-09T10:23:00-CME-001'],
  },
  {
    flrID: '2026-09-19T17:57:00-FLR-001',
    classType: 'C3.3',
    beginTime: '2026-09-19T17:57Z',
    peakTime: '2026-09-19T18:17Z',
    endTime: '2026-09-19T18:32Z',
    sourceLocation: 'N14E90',
    activeRegionNum: 14535,
    linkedEvents: ['2026-09-19T18:48:00-CME-001'],
  },
];
export const SNAPSHOT_END = '2026-09-26T00:00Z';

const CLASS_FLUX = { A: 1e-8, B: 1e-7, C: 1e-6, M: 1e-5, X: 1e-4 };
export const CLASS_COLORS = { A: '#6b7690', B: '#3fd4ff', C: '#34d399', M: '#ffb23f', X: '#f43f5e' };

const iso = (d) => d.toISOString().slice(0, 10);

async function getJSON(url, ms = 9000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    return text.trim() ? JSON.parse(text) : [];
  } finally {
    clearTimeout(timer);
  }
}

/** Parse "N12E90" → { lat: 12, lon: -90 } (east = negative, west = positive, as seen from Earth). */
export function parseLocation(loc) {
  const m = /([NS])(\d+)([EW])(\d+)/.exec(loc || '');
  if (!m) return { lat: 0, lon: 0 };
  return { lat: (m[1] === 'N' ? 1 : -1) * Number(m[2]), lon: (m[3] === 'W' ? 1 : -1) * Number(m[4]) };
}

export function normalizeFlare(f) {
  const cls = (f.classType || 'C1.0').trim();
  const letter = cls[0].toUpperCase();
  const mag = parseFloat(cls.slice(1)) || 1;
  const flux = (CLASS_FLUX[letter] || 1e-6) * mag;
  const linked = (f.linkedEvents || []).map((e) => (typeof e === 'string' ? e : e.activityID));
  const { lat, lon } = parseLocation(f.sourceLocation);
  const begin = new Date(f.beginTime);
  const end = f.endTime ? new Date(f.endTime) : begin;
  return {
    id: f.flrID,
    classType: cls,
    letter,
    flux,
    level: Math.log10(flux) + 8, // A1 = 0, B = 1, C = 2, M = 3, X = 4
    begin,
    peak: new Date(f.peakTime || f.beginTime),
    durationMin: Math.max(1, Math.round((end - begin) / 60000)),
    location: f.sourceLocation || 'unknown',
    lat,
    lon,
    region: f.activeRegionNum,
    hasCME: linked.some((id) => id.includes('CME')),
    hasSEP: linked.some((id) => id.includes('SEP')),
    link: f.link,
  };
}

/** Fetch the last `days` of flares, trying the NASA API, the CCMC mirror, then the snapshot. */
const cache = new Map();

/** Cached wrapper so several sections share one request (DEMO_KEY is rate-limited). */
export function fetchFlares(days = 30, force = false) {
  if (force || !cache.has(days)) cache.set(days, fetchFlaresUncached(days));
  return cache.get(days);
}

async function fetchFlaresUncached(days) {
  const end = new Date();
  const start = new Date(end.getTime() - days * DAY);
  const qs = `startDate=${iso(start)}&endDate=${iso(end)}`;
  const attempts = [
    { source: 'api.nasa.gov', url: `https://api.nasa.gov/DONKI/FLR?${qs}&api_key=${API_KEY}` },
    { source: 'CCMC DONKI', url: `https://kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get/FLR?${qs}` },
  ];
  const errors = [];
  for (const a of attempts) {
    try {
      const data = await getJSON(a.url);
      if (!Array.isArray(data)) throw new Error('Unexpected response');
      return { flares: data.map(normalizeFlare).sort((x, y) => x.peak - y.peak), source: a.source, live: true, asOf: end, errors };
    } catch (e) {
      errors.push(`${a.source}: ${e.message}`);
    }
  }
  return { flares: SNAPSHOT.map(normalizeFlare), source: 'offline snapshot', live: false, asOf: new Date(SNAPSHOT_END), errors };
}

/** How exposed each mission phase is to solar particles (1 = no protection). */
export const EXPOSURE = {
  iss: { value: 0.25, why: "Earth's magnetic field shields the ISS from most particles." },
  gateway: { value: 0.85, why: 'Gateway orbits the Moon, outside Earth’s magnetic shield.' },
  moon: { value: 0.75, why: 'No magnetic field or air, though the Moon itself blocks half the sky.' },
  transit: { value: 1, why: 'Deep space: nothing between the crew and the Sun.' },
  mars: { value: 0.55, why: 'Mars’ thin air gives a little protection, and help is 20 minutes away.' },
};

const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

/**
 * Space-weather risk score (0–100) for a flare at a mission phase, plus sub-scores.
 * Strength (X-ray class), particle storm (SEP), CME, magnetic connection (western flares
 * send particles along the Parker spiral toward Earth) and the phase's shielding all count.
 */
export function flareRisk(flare, phaseId, o2 = 21) {
  const strength = clamp((Math.log10(flare.flux) + 6.3) / 2.3); // C1 ≈ 0.13, M1 ≈ 0.57, X1 ≈ 1
  const connected = flare.lon >= 15 && flare.lon <= 90 ? 1 : Math.abs(flare.lon) < 60 ? 0.55 : 0.25;
  const facing = Math.abs(flare.lon) < 60 ? 1 : 0.4;
  const sep = flare.hasSEP ? 1 : clamp(strength * connected * 0.7);
  const cme = flare.hasCME ? facing : 0;
  const exposure = EXPOSURE[phaseId]?.value ?? 1;

  const radiation = clamp((0.45 * strength + 0.4 * sep + 0.15 * cme) * exposure * 1.25);
  const electronics = clamp((0.35 * strength + 0.35 * sep + 0.3 * cme) * (0.4 + 0.6 * exposure) * 1.15);
  // Energetic particles can upset electronics → short circuits → overheating: the top spacecraft ignition source.
  const ignition = clamp(electronics * Math.pow(o2 / 21, 0.9) * 0.9);
  const score = Math.round(clamp(0.45 * radiation + 0.3 * electronics + 0.25 * ignition) * 100);

  return {
    score,
    radiation: Math.round(radiation * 100),
    electronics: Math.round(electronics * 100),
    ignition: Math.round(ignition * 100),
    strength,
    connected,
    exposure,
    shouldShelter: score >= 45,
  };
}

export function riskBand(score) {
  if (score >= 70) return { label: 'Storm', tone: 'critical', advice: 'Crew to storm shelter. Power down non-critical electronics.' };
  if (score >= 45) return { label: 'Warning', tone: 'high', advice: 'Prepare shelter, delay spacewalks, watch for electrical faults.' };
  if (score >= 20) return { label: 'Watch', tone: 'moderate', advice: 'Keep monitoring. No action needed yet.' };
  return { label: 'Calm', tone: 'low', advice: 'Normal operations. Enjoy the view!' };
}

/** "Right now" risk: recent flares count most, fading over ~2 days. */
export function currentRisk(flares, phaseId, o2, asOf) {
  let best = { score: 0, flare: null };
  flares.forEach((f) => {
    const hours = (asOf - f.peak) / 3600000;
    if (hours < 0) return;
    const decayed = flareRisk(f, phaseId, o2).score * Math.exp(-hours / 48);
    if (decayed > best.score) best = { score: Math.round(decayed), flare: f };
  });
  return best;
}

export const fmtTime = (d) =>
  d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC', hour12: false }) + ' UTC';
