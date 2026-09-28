/**
 * Kid-friendly flame physics for the 3D Flame Lab.
 * Qualitatively based on NASA microgravity fire findings (BASS PSI-26, FLEX PSI-69,
 * CFI-G PSI-159, DAFT PSI-47). Numbers are simplified for teaching, not engineering.
 */

export const PLACES = [
  { id: 'earth', name: 'Earth', gravity: 1, o2: 21, blurb: 'Strong gravity. Hot air rises fast.' },
  { id: 'orbit', name: 'Space station', gravity: 0, o2: 21, blurb: 'Everything floats. There is no "up".' },
  { id: 'moon', name: 'Moon base', gravity: 0.16, o2: 34, blurb: '1/6 of Earth gravity, extra oxygen.' },
  { id: 'mars', name: 'Mars base', gravity: 0.38, o2: 34, blurb: 'About 1/3 of Earth gravity.' },
];

/** Mission phases from the dashboard mapped onto lab places. */
export const PHASE_TO_PLACE = { iss: 'orbit', gateway: 'orbit', transit: 'orbit', moon: 'moon', mars: 'mars' };

export const LAB_MATERIALS = [
  { id: 'paper', name: 'Paper', loi: 18, flam: 1, color: '#efe3c4', kind: 'solid', fact: 'Paper is made of wood fibers, so it catches fire very easily.' },
  {
    id: 'cotton',
    name: 'Cotton shirt',
    loi: 19,
    flam: 0.85,
    color: '#8fb8ff',
    kind: 'solid',
    fact: 'Cotton comes from a plant. It burns easily, so astronauts wear special fabrics.',
  },
  {
    id: 'acrylic',
    name: 'Plastic (acrylic)',
    loi: 17,
    flam: 0.9,
    color: '#b9ecff',
    kind: 'solid',
    fact: 'Astronauts burned acrylic on the space station in the BASS experiment to watch flames spread.',
  },
  {
    id: 'nomex',
    name: 'Fire-safe fabric',
    loi: 28,
    flam: 0.6,
    color: '#e6bf45',
    kind: 'solid',
    fact: 'Nomex is used in firefighter and astronaut suits. In normal air it puts itself out!',
  },
  { id: 'teflon', name: 'Teflon', loi: 95, flam: 0.05, color: '#f3f3f3', kind: 'solid', fact: 'Teflon almost never burns, even with lots of extra oxygen.' },
  {
    id: 'droplet',
    name: 'Fuel droplet',
    loi: 14,
    flam: 0.8,
    color: '#ffcf6b',
    kind: 'droplet',
    fact: "NASA's FLEX experiment burned tiny fuel drops held on a thin thread to study space flames.",
  },
];

export const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

/** Piecewise-linear table lookup. */
function lerpTable(table, x) {
  if (x <= table[0][0]) return table[0][1];
  for (let i = 1; i < table.length; i++) {
    const [x1, y1] = table[i];
    const [x0, y0] = table[i - 1];
    if (x <= x1) return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
  }
  return table[table.length - 1][1];
}

// Partial gravity brings in fresh oxygen gently without cooling the flame much,
// so flames can be as big or bigger than on Earth. 0g flames are starved and small.
const GRAVITY_SIZE = [
  [0, 0.62],
  [0.16, 1.0],
  [0.38, 1.08],
  [1, 0.95],
];

export function computeFlame({ gravity, o2, materialId }) {
  const material = LAB_MATERIALS.find((m) => m.id === materialId);
  const g = clamp(gravity);
  const sg = Math.sqrt(g);
  const canBurn = o2 >= material.loi;
  const oxy = clamp((o2 - material.loi) / 14 + 0.35, 0.3, 1.4);
  const size = canBurn ? material.flam * oxy * lerpTable(GRAVITY_SIZE, g) : 0;

  const blueness = 1 - clamp(sg * 1.15);
  return {
    material,
    canBurn,
    size,
    radius: 0.22 + 0.33 * size,
    stretch: 1 + 1.3 * sg,
    taper: clamp(sg * 1.4),
    blueness,
    soot: 0.25 + 0.75 * (1 - blueness),
    flow: 0.18 + 0.82 * sg, // how quickly fresh oxygen reaches the flame
    smokeRise: 1.7 * g,
    shape: g < 0.02 ? 'Round ball' : g < 0.5 ? 'Short and wide' : 'Tall teardrop',
    colorName: blueness > 0.6 ? 'Blue and dim' : blueness > 0.25 ? 'Orange, blue base' : 'Bright yellow',
    oxygenSpeed: g < 0.02 ? 'Slow drift' : g < 0.5 ? 'Gentle breeze' : 'Fast breeze',
    smokeGoes: g < 0.02 ? 'Everywhere, slowly' : 'Up to the ceiling',
  };
}

export function dangerLevel(size, burning) {
  if (!burning || size <= 0) return { label: 'Safe', tone: 'low', pct: 0 };
  const pct = Math.round(clamp(size / 1.4) * 100);
  if (size > 0.9) return { label: 'Danger!', tone: 'critical', pct };
  if (size > 0.55) return { label: 'Watch out', tone: 'high', pct };
  return { label: 'Small', tone: 'moderate', pct };
}

/** Plain-language explanation of what is on screen right now. */
export function explain(state, flame) {
  const { status, gravity: g, o2, coolFlame, heatVision, fizzled, burnedOut } = state;
  const m = flame.material;

  if (status === 'extinguishing') {
    return {
      title: 'Whoosh! Carbon dioxide',
      text: 'The extinguisher sprays CO₂, a heavy gas that pushes oxygen away from the fuel. No oxygen means the fire triangle is broken.',
      word: { term: 'Suppressant', meaning: 'Anything that puts out a fire, like CO₂, water mist or foam.' },
    };
  }
  if (status === 'out' && coolFlame && !heatVision) {
    return {
      title: 'Is it really out?',
      text: 'It looks like the fire is gone… but in space some fuel drops keep burning as an invisible "cool flame". Switch on Heat vision to check!',
      word: { term: 'Cool flame', meaning: 'A flame at about 500 °C instead of 1,500 °C. It gives off almost no light.' },
    };
  }
  if (status === 'out' && coolFlame && heatVision) {
    return {
      title: 'Found it: a hidden cool flame!',
      text: 'Heat vision shows the flame our eyes miss. NASA discovered these on the space station in the FLEX experiment. Astronauts need special sensors to spot them.',
      word: { term: 'Infrared', meaning: 'A kind of light we feel as heat but cannot see. Heat cameras can see it.' },
    };
  }
  if ((status === 'out' || status === 'fizzle') && fizzled) {
    return {
      title: "It won't stay lit!",
      text: `${m.name} needs at least ${m.loi}% oxygen to keep burning. This air has only ${o2}%. ${m.loi > 25 ? 'That is why fire-safe materials protect astronauts.' : 'Try adding more oxygen.'}`,
      word: { term: 'Oxygen index', meaning: 'The smallest amount of oxygen a material needs to keep burning.' },
    };
  }
  if (status === 'out' && burnedOut) {
    return {
      title: 'All burned up',
      text: 'The fire used up all of its fuel, so it stopped. Remove the fuel and a fire cannot keep going. Press Reset for a new sample.',
      word: { term: 'Fuel', meaning: 'Anything that can burn: paper, cloth, plastic or liquid fuel.' },
    };
  }
  if (status === 'out') {
    return {
      title: 'Fire is out. Great job!',
      text: 'You stopped the fire. On a real spacecraft, astronauts would also switch off fans so fresh air stops feeding any leftover flames.',
      word: { term: 'Ventilation', meaning: 'Fans that move air around. In space, fans are the only "wind".' },
    };
  }
  if (status === 'burning' && g < 0.02) {
    return {
      title: 'A floating fire ball!',
      text: 'In space, hot air does not rise because there is no "up". The flame spreads evenly in every direction and becomes a ball. Fresh oxygen only drifts in slowly, so the flame is small, cool and blue.',
      word: { term: 'Microgravity', meaning: 'When things feel almost weightless, like on the space station.' },
    };
  }
  if (status === 'burning' && g < 0.5) {
    return {
      title: 'A wide, hungry flame',
      text: `Gravity here is weak, so hot air rises gently. That soft breeze feeds the fire with oxygen without cooling it much, so some materials burn even better than on Earth!${o2 > 25 ? ' The extra oxygen in the base makes it hungrier still.' : ''}`,
      word: { term: 'Buoyancy', meaning: 'Hot air is lighter than cold air, so gravity lets it float upward.' },
    };
  }
  if (status === 'burning') {
    return {
      title: 'Hot air rises!',
      text: 'On Earth, gravity pulls heavy cold air down, and the light hot air from the fire rises up. This pulls the flame into a pointy teardrop. Tiny glowing bits of soot make it yellow.',
      word: { term: 'Convection', meaning: 'Heat moving around because warm air or water rises and cool air sinks.' },
    };
  }
  return {
    title: 'Ready for an experiment',
    text: 'Pick a place and something to burn, then press "Light it!" or click the sample. Every fire needs fuel, heat and oxygen. Together they make the fire triangle.',
    word: { term: 'Fire triangle', meaning: 'Fuel + heat + oxygen. Take away any one and the fire goes out.' },
  };
}

/** Guided lessons: each step sets up the lab and tells a short story. */
export const LESSONS = [
  {
    title: 'Fire needs three friends',
    text: 'Every fire needs FUEL (something to burn), HEAT (a spark) and OXYGEN (from the air). Find all three labels in the lab. The little blue pairs are oxygen molecules!',
    setup: { placeId: 'earth', materialId: 'paper', labels: true, heatVision: false },
    action: 'ignite',
  },
  {
    title: 'Hot air rises',
    text: 'Watch the grey smoke float straight up and set off the smoke alarm on the ceiling. Gravity lets hot, light air rise, and that pulls the flame into a teardrop.',
    setup: { placeId: 'earth', materialId: 'paper', labels: true, heatVision: false },
    action: 'ignite',
  },
  {
    title: 'Fire in space',
    text: 'Now we are on the space station. Nothing is "up" anymore, so the flame turns into a blue ball and the smoke spreads slowly. Does the smoke alarm beep this time?',
    setup: { placeId: 'orbit', materialId: 'droplet', labels: true, heatVision: false },
    action: 'ignite',
  },
  {
    title: 'Moon base: extra oxygen',
    text: 'On Earth, fire-safe fabric puts itself out. A Moon base may have 34% oxygen, and now it burns! This is why NASA tests materials in the real air astronauts will breathe.',
    setup: { placeId: 'moon', materialId: 'nomex', labels: true, heatVision: false },
    action: 'ignite',
  },
  {
    title: 'Sneaky invisible flames',
    text: 'Let us put out this space fire with the red extinguisher. Watch closely… then switch on Heat vision. Is it really out?',
    setup: { placeId: 'orbit', materialId: 'droplet', labels: false, heatVision: false },
    action: 'ignite-then-spray',
  },
  {
    title: 'Your turn, fire scientist!',
    text: 'Try Mars with plastic, or lower the oxygen until the fire goes out by itself. Can you find the material that never burns?',
    setup: { labels: true },
    action: null,
  },
];
