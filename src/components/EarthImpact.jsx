import { lazy, Suspense, useCallback, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe2,
  Rocket,
  RotateCcw,
  Radio,
  Navigation,
  Satellite,
  Zap,
  User,
  Plane,
  Sparkles,
  Shield,
  Timer,
  Sun,
  Atom,
  Cloud,
  Info,
  MapPin,
  Move3d,
  Download,
} from 'lucide-react';
import { useGame } from '../hooks/useGame';
import { useKids } from '../hooks/useKids';
import { useInView } from '../hooks/useInView';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useSpaceWeather } from '../hooks/useSpaceWeather';
import { earthImpact, classFromLevel, PRESETS, CITIES, DEFAULT_INPUTS, SCALE_TEXT, inputsFromFlare, QUIET } from '../utils/earthImpact';
import { riskBand } from '../utils/spaceWeather';
import Panel from './Panel';
import RiskGauge from './RiskGauge';
import styles from './EarthImpact.module.css';

const EarthScene = lazy(() => import('./earth/EarthScene'));

const IMPACT_META = [
  { key: 'radio', label: 'Radio', icon: Radio },
  { key: 'gps', label: 'GPS', icon: Navigation },
  { key: 'satellites', label: 'Satellites', icon: Satellite },
  { key: 'power', label: 'Power grids', icon: Zap },
  { key: 'astronauts', label: 'Astronauts', icon: User },
  { key: 'flights', label: 'Flights', icon: Plane },
];

const EVENTS = {
  flare: () => ({ icon: Sun, time: 'T+0', text: 'A solar flare flashes on the Sun!' }),
  xray: (r) => ({
    icon: Radio,
    time: 'T+8 min',
    text: r.R ? `X-rays hit the sunny side of Earth. Radio blackout level R${r.R}.` : 'X-rays arrive, but they are too weak to disturb radios.',
  }),
  protons: (r) => ({
    icon: Atom,
    time: 'T+30 min',
    text: r.S ? `Fast protons rain into the poles. Radiation storm S${r.S}.` : 'Only a few energetic protons arrive.',
  }),
  cme: (r) => ({ icon: Cloud, time: 'Launch', text: `A CME cloud leaves the Sun. It will take about ${Math.round(r.arrivalHours)} hours to reach Earth.` }),
  impact: (r) => ({
    icon: Shield,
    time: `T+${Math.round(r.arrivalHours)} h`,
    text: `CME impact! Earth's magnetic shield is squeezed from 10.9 to ${r.rmp.toFixed(1)} Earth-widths.`,
  }),
  miss: () => ({ icon: Shield, time: 'Arrival', text: 'The CME misses Earth. Only a gentle breeze of solar wind.' }),
  peak: (r) => ({
    icon: Sparkles,
    time: 'Storm peak',
    text: r.G
      ? `Geomagnetic storm G${r.G} (Kp ${r.kp.toFixed(0)}). Auroras reach ${r.auroraLat.toFixed(0)}° latitude!`
      : 'Earth stays calm. Only polar auroras.',
  }),
};

function Slider({ id, label, value, min, max, step, onChange, display, left, right, fill }) {
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.fieldHead}>
        <span>{label}</span>
        <span className="mono">{display}</span>
      </label>
      <input
        id={id}
        type="range"
        className="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ '--fill': `${fill}%` }}
      />
      {(left || right) && (
        <div className={styles.ends} aria-hidden="true">
          <span>{left}</span>
          <span>{right}</span>
        </div>
      )}
    </div>
  );
}

/** Solar Storm vs Earth: an interactive "what if" simulator of how flares and CMEs affect our planet. */
export default function EarthImpact() {
  const { unlock, addXp } = useGame();
  const { kids } = useKids();
  const sw = useSpaceWeather(30);
  const coarse = useMediaQuery('(pointer: coarse)');
  const [stageRef, inView] = useInView('300px');
  const [inputs, setInputs] = useState(DEFAULT_INPUTS);
  const [preset, setPreset] = useState('m-flare');
  const [launched, setLaunched] = useState(false);
  const [playId, setPlayId] = useState(0);
  const [feed, setFeed] = useState([]);
  const [rotateOn, setRotateOn] = useState(false);

  const impact = useMemo(() => earthImpact(inputs), [inputs]);
  const band = riskBand(impact.overall);
  const set = (patch) => {
    setPreset(null);
    setInputs((s) => ({ ...s, ...patch }));
  };

  const applyPreset = (p) => {
    setPreset(p.id);
    setInputs((s) => ({ ...s, level: p.level, hit: p.hit, speed: p.speed, bz: p.bz, density: p.density }));
  };

  const strongest = useMemo(() => [...sw.flares].sort((a, b) => b.flux - a.flux)[0], [sw.flares]);
  const applyNasa = () => {
    if (!strongest) return;
    setPreset('nasa');
    setInputs((s) => ({ ...s, ...inputsFromFlare(strongest) }));
  };

  const launch = () => {
    setFeed([]);
    setLaunched(true);
    setPlayId((p) => p + 1);
  };

  const onEvent = useCallback(
    (name) => {
      const e = EVENTS[name](impact);
      setFeed((f) => [{ id: `${name}-${Date.now()}`, ...e }, ...f].slice(0, 4));
      if (name === 'peak') {
        addXp(10, 'Storm simulated');
        if (impact.aurora !== 'no' && Math.abs(inputs.cityLat) <= 45) unlock('aurora-hunter');
      }
    },
    [impact, inputs.cityLat, addXp, unlock],
  );

  const aurText =
    impact.aurora === 'overhead'
      ? 'Yes! Look straight up.'
      : impact.aurora === 'horizon'
        ? 'Maybe, low on the horizon.'
        : `No, it only reaches ${impact.auroraLat.toFixed(0)}°.`;

  return (
    <Panel
      id="earth"
      icon={Globe2}
      eyebrow="Interactive what-if simulator · NASA DONKI + NOAA space-weather scales"
      title="Solar Storm vs Earth"
      description="What happens to Earth when the Sun erupts? Set up your own solar storm, or load a real NASA flare or a famous historic storm. Then launch it and watch Earth's magnetic shield, auroras, satellites and city lights react."
      actions={
        <button type="button" className={styles.launchTop} onClick={launch}>
          <Rocket size={16} aria-hidden="true" /> Launch storm
        </button>
      }
    >
      <div className={styles.presets} role="group" aria-label="Scenarios">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            aria-pressed={preset === p.id}
            className={`${styles.preset} ${preset === p.id ? styles.presetOn : ''}`}
            onClick={() => applyPreset(p)}
            title={p.blurb}
          >
            {p.name}
          </button>
        ))}
        <button
          type="button"
          aria-pressed={preset === 'nasa'}
          className={`${styles.preset} ${styles.nasa} ${preset === 'nasa' ? styles.presetOn : ''}`}
          onClick={applyNasa}
          disabled={!strongest}
        >
          <Download size={14} aria-hidden="true" />{' '}
          {strongest
            ? `NASA: ${strongest.classType} (${strongest.peak.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })})`
            : 'Loading NASA…'}
        </button>
      </div>
      <p className={styles.blurb}>
        {preset === 'nasa'
          ? `Strongest flare in the last 30 days from NASA DONKI (${sw.live ? 'live' : 'snapshot'}): ${strongest?.classType} at ${strongest?.location}${strongest?.hasCME ? ', with a CME' : ', no CME'}.`
          : PRESETS.find((p) => p.id === preset)?.blurb || 'Custom storm: you are the Sun!'}
      </p>

      <div className={styles.layout}>
        <div className={styles.inputs}>
          <h3 className={styles.h}>{kids ? 'Make your own Sun storm' : 'Build your storm'}</h3>
          <Slider
            id="ei-level"
            label={kids ? 'How big is the Sun blast?' : 'Flare strength'}
            value={inputs.level}
            min={2}
            max={5.7}
            step={0.01}
            onChange={(v) => set({ level: v })}
            display={classFromLevel(inputs.level)}
            left="C (small)"
            right="X45 (monster)"
            fill={((inputs.level - 2) / 3.7) * 100}
          />
          <div className={styles.field}>
            <span className={styles.fieldHead}>
              <span>{kids ? 'Does the cloud hit Earth?' : 'CME direction'}</span>
            </span>
            <div className={styles.seg} role="radiogroup" aria-label="CME direction">
              {[
                ['direct', 'Direct hit'],
                ['glancing', 'Glancing'],
                ['miss', 'Miss'],
              ].map(([k, l]) => (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={inputs.hit === k}
                  className={inputs.hit === k ? styles.segOn : ''}
                  onClick={() => set({ hit: k })}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <Slider
            id="ei-speed"
            label={kids ? 'How fast is the storm cloud?' : 'CME speed'}
            value={inputs.speed}
            min={300}
            max={3000}
            step={10}
            onChange={(v) => set({ speed: v })}
            display={`${inputs.speed} km/s`}
            left="Slow"
            right="Super fast"
            fill={((inputs.speed - 300) / 2700) * 100}
          />
          <Slider
            id="ei-bz"
            label={kids ? 'Storm magnet: opens Earth’s shield door?' : 'CME magnet direction (Bz)'}
            value={inputs.bz}
            min={-60}
            max={20}
            step={1}
            onChange={(v) => set({ bz: v })}
            display={`${inputs.bz > 0 ? '+' : ''}${inputs.bz} nT`}
            left="South: door OPEN"
            right="North: door shut"
            fill={((inputs.bz + 60) / 80) * 100}
          />
          {!kids && (
            <Slider
              id="ei-density"
              label="Cloud density"
              value={inputs.density}
              min={2}
              max={60}
              step={1}
              onChange={(v) => set({ density: v })}
              display={`${inputs.density} /cm³`}
              fill={((inputs.density - 2) / 58) * 100}
            />
          )}
          <div className={styles.field}>
            <label htmlFor="ei-city" className={styles.fieldHead}>
              <span>
                <MapPin size={14} aria-hidden="true" /> Your city
              </span>
              <span className="mono">{inputs.cityLat.toFixed(1)}°</span>
            </label>
            <select
              id="ei-city"
              className={styles.select}
              value={inputs.cityName}
              onChange={(e) => {
                const c = CITIES.find((x) => x.name === e.target.value);
                setInputs((s) => ({ ...s, cityName: c.name, cityLat: c.lat }));
              }}
            >
              {CITIES.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
              {!CITIES.some((c) => c.name === inputs.cityName) && <option value={inputs.cityName}>{inputs.cityName}</option>}
            </select>
            <input
              type="range"
              className="range"
              min={-70}
              max={70}
              step={0.5}
              value={inputs.cityLat}
              aria-label="Latitude"
              onChange={(e) => setInputs((s) => ({ ...s, cityLat: Number(e.target.value), cityName: 'My place' }))}
              style={{ '--fill': `${((inputs.cityLat + 70) / 140) * 100}%` }}
            />
          </div>
          <div className={styles.btns}>
            <button type="button" className={styles.launch} onClick={launch}>
              <Rocket size={18} aria-hidden="true" /> Launch storm
            </button>
            <button
              type="button"
              className={styles.reset}
              onClick={() => {
                setLaunched(false);
                setFeed([]);
              }}
              aria-label="Reset to a calm Earth"
            >
              <RotateCcw size={18} />
            </button>
          </div>
        </div>

        <div className={styles.stage} ref={stageRef}>
          {inView ? (
            <Suspense fallback={<div className={styles.loading}>Spinning up Earth…</div>}>
              <EarthScene impact={impact} inputs={inputs} launched={launched} playId={playId} onEvent={onEvent} controlsEnabled={!coarse || rotateOn} />
            </Suspense>
          ) : (
            <div className={styles.loading}>Simulation paused</div>
          )}
          <div className={styles.feed} aria-live="polite">
            <AnimatePresence initial={false}>
              {feed.map((e, i) => {
                const Icon = e.icon;
                return (
                  <motion.div
                    key={e.id}
                    className={styles.event}
                    layout
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: i === 0 ? 1 : 0.55, x: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <Icon size={16} aria-hidden="true" />
                    <span className="mono">{e.time}</span>
                    <p>{e.text}</p>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
          {!launched && (
            <div className={styles.calm}>
              <Info size={14} aria-hidden="true" />{' '}
              <span>
                Calm Earth. Set up a storm and press <strong>Launch</strong>. After it hits, move the sliders to change the storm live!
              </span>
            </div>
          )}
          {launched && playId > 0 && (
            <div className={styles.liveTag}>
              <span className={styles.dot} /> Live: sliders change the storm
            </div>
          )}
          <ul className={styles.legend} aria-label="Legend">
            <li>
              <i style={{ background: '#3fd4ff' }} /> Magnetic shield
            </li>
            <li>
              <i style={{ background: '#ffd27a' }} /> Solar wind
            </li>
            <li>
              <i style={{ background: '#ff7a45' }} /> CME
            </li>
            <li>
              <i style={{ background: '#34f59a' }} /> Aurora
            </li>
          </ul>
          {coarse && (
            <button type="button" className={`${styles.rotate} ${rotateOn ? styles.rotateOn : ''}`} onClick={() => setRotateOn((v) => !v)}>
              <Move3d size={16} aria-hidden="true" /> {rotateOn ? 'Rotate on' : 'Tap to rotate'}
            </button>
          )}
        </div>

        <aside className={styles.results} aria-live="polite">
          <div className={styles.scoreCard}>
            <p className={styles.label}>{kids ? 'How much Earth feels it' : 'Earth impact score'}</p>
            <RiskGauge value={impact.overall} label={band.label} tone={band.tone} />
          </div>
          <div className={styles.scales}>
            {['R', 'S', 'G'].map((k) => (
              <div key={k} className={`${styles.scale} ${styles[`lvl${impact[k]}`]}`}>
                <span className="mono">
                  {k}
                  {impact[k]}
                </span>
                <small>{k === 'R' ? 'Radio' : k === 'S' ? 'Radiation' : 'Geomagnetic'}</small>
                <em>{SCALE_TEXT[k][impact[k]]}</em>
              </div>
            ))}
          </div>
          <div className={styles.quick}>
            <div>
              <Timer size={14} aria-hidden="true" />
              <span>CME arrives in</span>
              <strong className="mono">{impact.hit ? `${Math.round(impact.arrivalHours)} h` : 'misses'}</strong>
            </div>
            <div>
              <Shield size={14} aria-hidden="true" />
              <span>Shield squeezed to</span>
              <strong className={`mono ${impact.geoExposed ? styles.bad : ''}`}>
                {impact.rmp.toFixed(1)} R⊕ <small>(normal {QUIET.rmp})</small>
              </strong>
            </div>
            <div>
              <Sparkles size={14} aria-hidden="true" />
              <span>Aurora in {inputs.cityName}?</span>
              <strong className={impact.aurora !== 'no' ? styles.good : ''}>{aurText}</strong>
            </div>
          </div>
          <ul className={styles.impacts}>
            {IMPACT_META.map(({ key, label, icon: Icon }) => {
              const it = impact.impacts[key];
              const tone = riskBand(it.score).tone;
              return (
                <li key={key}>
                  <span className={`${styles.iIcon} ${styles[tone]}`}>
                    <Icon size={16} aria-hidden="true" />
                  </span>
                  <div>
                    <div className={styles.iHead}>
                      <strong>{label}</strong>
                      <span className="mono">{Math.round(it.score)}</span>
                    </div>
                    <div className={styles.iBar}>
                      <motion.span className={styles[`bar_${tone}`]} initial={false} animate={{ width: `${it.score}%` }} transition={{ duration: 0.4 }} />
                    </div>
                    <small>{it.detail}</small>
                  </div>
                </li>
              );
            })}
          </ul>
        </aside>
      </div>
      {!kids && (
        <p className={styles.credit}>
          Model: flare X-ray class → NOAA R-scale; estimated proton flux → S-scale; Dst ≈ −0.01·v·Bs → Kp/G-scale; Shue (1998) magnetopause; auroral oval ≈ 66°
          − 3.4°·Kp. Historic storms use approximate published values. Educational simulation, not a forecast.
        </p>
      )}
    </Panel>
  );
}
