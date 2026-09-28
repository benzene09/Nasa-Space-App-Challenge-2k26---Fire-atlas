/**
 * Gamification content: levels, badges, missions and quiz questions.
 * Every section of FlameAtlas has a mini-game that awards XP and badges here.
 */

export const LEVELS = [
  { level: 1, title: 'Cadet', xp: 0 },
  { level: 2, title: 'Spark Spotter', xp: 60 },
  { level: 3, title: 'Flame Tracker', xp: 150 },
  { level: 4, title: 'Fire Scientist', xp: 280 },
  { level: 5, title: 'Habitat Guardian', xp: 450 },
  { level: 6, title: 'Mission Fire Chief', xp: 680 },
];

export function levelFor(xp) {
  let current = LEVELS[0];
  for (const l of LEVELS) if (xp >= l.xp) current = l;
  const next = LEVELS.find((l) => l.xp > xp);
  const progress = next ? (xp - current.xp) / (next.xp - current.xp) : 1;
  return { ...current, next, progress };
}

/** Each badge also unlocks a NASA data card in the Sources section. */
export const BADGES = [
  { id: 'explorer', name: 'Solar Explorer', desc: 'Visit all 5 mission phases', section: 'overview', icon: 'Rocket', source: 'PSI-68' },
  { id: 'risk-reader', name: 'Risk Reader', desc: 'Guess the riskiest mission phase', section: 'overview', icon: 'Gauge', source: 'PSI-68' },
  { id: 'first-light', name: 'First Light', desc: 'Light your first fire in the Flame Lab', section: 'lab', icon: 'Flame', source: 'PSI-26' },
  { id: 'space-ball', name: 'Space Ball', desc: 'Make a round flame in microgravity', section: 'lab', icon: 'Orbit', source: 'PSI-69' },
  { id: 'alarm-raiser', name: 'Alarm Raiser', desc: 'Set off the ceiling smoke alarm', section: 'lab', icon: 'BellRing', source: 'PSI-47' },
  { id: 'firefighter', name: 'Firefighter', desc: 'Put out a fire with the extinguisher', section: 'lab', icon: 'SprayCan', source: 'NTRS 20240002981' },
  { id: 'ghost-buster', name: 'Ghost Buster', desc: 'Reveal a hidden cool flame with heat vision', section: 'lab', icon: 'ScanEye', source: 'PSI-117' },
  { id: 'starver', name: 'Oxygen Starver', desc: 'Make a fire go out by lowering oxygen', section: 'lab', icon: 'Wind', source: 'PSI-68' },
  { id: 'moon-fire', name: 'Moon Fire', desc: 'Burn fire-safe fabric at a Moon base', section: 'lab', icon: 'Moon', source: 'PSI-26' },
  {
    id: 'storm-watcher',
    name: 'Storm Watcher',
    desc: 'Make 3 correct shelter calls in Solar Flare Watch',
    section: 'solar',
    icon: 'Sun',
    source: 'DONKI',
  },
  {
    id: 'aurora-hunter',
    name: 'Aurora Hunter',
    desc: 'Make the aurora visible from a city below 45° latitude',
    section: 'earth',
    icon: 'Sparkles',
    source: 'DONKI',
  },
  { id: 'detective', name: 'Fire Detective', desc: 'Win 3 Burn Race predictions', section: 'ranker', icon: 'Search', source: 'PSI-26' },
  { id: 'gap-filler', name: 'Gap Filler', desc: 'Score 3 stars in Gravity Guess', section: 'gravity', icon: 'Target', source: 'PSI-69' },
  { id: 'ghost-hunter', name: 'Ghost Flame Hunter', desc: 'Find 5 cool flames in the radar hunt', section: 'radar', icon: 'Radar', source: 'PSI-159' },
  { id: 'scholar', name: 'Space Scholar', desc: 'Score 5+ in the FireGPT quiz', section: 'firegpt', icon: 'GraduationCap', source: 'NTRS 20150023456' },
  { id: 'planner', name: 'Mission Planner', desc: 'Earn 3 stars planning NASA’s next tests', section: 'gaps', icon: 'Map', source: 'PSI-47' },
];

export const MISSIONS = [
  { id: 'm1', title: 'Liftoff', desc: 'Earn your first 3 badges', need: 3 },
  { id: 'm2', title: 'Lab rat', desc: 'Collect all 7 Flame Lab badges', lab: true },
  { id: 'm3', title: 'All-rounder', desc: 'Earn a badge in every section', everySection: true },
  { id: 'm4', title: 'Fire Chief', desc: 'Unlock every badge', need: BADGES.length },
];

export const QUIZ = [
  {
    q: 'What shape is a candle flame on the space station?',
    options: ['A tall teardrop', 'A round ball', 'A flat square', 'It cannot burn'],
    answer: 1,
    why: 'Without gravity, hot gas does not rise, so the flame spreads evenly into a ball.',
    cite: 'PSI-69 FLEX',
  },
  {
    q: 'Why are space flames often blue?',
    options: ['Space is cold', 'Less soot is made, so less yellow glow', 'Astronauts add dye', 'Oxygen is blue'],
    answer: 1,
    why: 'Yellow comes from glowing soot. Slow-moving 0g flames make much less soot.',
    cite: 'PSI-26 BASS',
  },
  {
    q: 'A proposed Moon habitat has about how much oxygen?',
    options: ['10%', '21% like Earth', '34%', '80%'],
    answer: 2,
    why: 'Artemis designs use about 34% O₂ at 8.2 psi, so materials burn more easily.',
    cite: 'PSI-68 FLEX-2',
  },
  {
    q: 'What is a "cool flame"?',
    options: ['A flame in a fridge', 'A nearly invisible low-temperature flame', 'A blue candle', 'Smoke'],
    answer: 1,
    why: 'Cool flames burn around 500–800 K and give off almost no light.',
    cite: 'PSI-159 CFI-G',
  },
  {
    q: 'Why can ceiling smoke alarms struggle in space?',
    options: ['No batteries', 'Smoke does not rise to the ceiling', 'Too much noise', 'They melt'],
    answer: 1,
    why: 'With no buoyancy, smoke drifts slowly in every direction instead of rising.',
    cite: 'PSI-47 DAFT',
  },
  {
    q: 'How long can a message to Earth take from Mars?',
    options: ['1 second', '1 minute', 'Up to about 20 minutes', '1 week'],
    answer: 2,
    why: 'Mars can be up to ~20 light-minutes away, so crews must act on their own.',
    cite: 'NTRS API',
  },
  {
    q: 'Which gravity level has the LEAST fire test data?',
    options: ['Earth (1g)', 'Space station (0g)', 'Mars (0.38g)', 'They are equal'],
    answer: 2,
    why: 'Almost no experiments exist at Moon or Mars gravity. That is the research gap.',
    cite: 'PSI-26 BASS',
  },
];
