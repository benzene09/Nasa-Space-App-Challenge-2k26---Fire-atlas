import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Radar, RotateCcw, EyeOff, Flame, CircleSlash, Crosshair } from 'lucide-react';
import { useGame } from '../../hooks/useGame';
import { FUELS, DILUENTS } from '../../utils/data';
import { regimeAt, O2_AXIS, ATM_AXIS } from '../../utils/models';
import Stars from '../game/Stars';
import styles from './RadarHunt.module.css';

const GOAL = 5;
const SCANS = 14;
const ICON = { hot: Flame, cool: EyeOff, extinct: CircleSlash };

const coolCount = (fuel, dil) => ATM_AXIS.reduce((n, atm) => n + O2_AXIS.filter((o2) => regimeAt(o2, atm, fuel, dil) === 'cool').length, 0);

function newMission() {
  // Pick a fuel/atmosphere combo that actually hides enough ghost flames to win.
  for (let tries = 0; tries < 20; tries++) {
    const fuel = FUELS[Math.floor(Math.random() * FUELS.length)];
    const dil = DILUENTS[Math.floor(Math.random() * DILUENTS.length)];
    if (coolCount(fuel.id, dil.id) >= GOAL + 2) return { fuel, dil, key: Math.random() };
  }
  return { fuel: FUELS[0], dil: DILUENTS[1], key: Math.random() };
}

/** Cool Flame Hunter: scan a hidden O₂ × pressure map and find invisible cool flames. */
export default function RadarHunt() {
  const { addXp, unlock } = useGame();
  const [mission, setMission] = useState(newMission);
  const [scanned, setScanned] = useState(() => new Set());
  const [last, setLast] = useState(null);

  const grid = useMemo(() => ATM_AXIS.map((atm) => O2_AXIS.map((o2) => ({ o2, atm, regime: regimeAt(o2, atm, mission.fuel.id, mission.dil.id) }))), [mission]);
  const totalCool = grid.flat().filter((c) => c.regime === 'cool').length;
  const found = [...scanned].filter((k) => {
    const [r, c] = k.split('-').map(Number);
    return grid[r][c].regime === 'cool';
  }).length;
  const left = SCANS - scanned.size;
  const goal = Math.min(GOAL, totalCool);
  const won = found >= goal;
  const lost = !won && left <= 0;
  const over = won || lost;
  const stars = won ? (left >= 6 ? 3 : left >= 3 ? 2 : 1) : 0;

  const scan = (r, c) => {
    const k = `${r}-${c}`;
    if (over || scanned.has(k)) return;
    const next = new Set(scanned).add(k);
    setScanned(next);
    setLast(grid[r][c]);
    const cell = grid[r][c];
    if (cell.regime === 'cool') {
      const f = found + 1;
      if (f >= goal) {
        addXp(20 + (SCANS - next.size) * 4, 'Hunt complete!');
        unlock('ghost-hunter');
      } else addXp(5, 'Cool flame found!');
    } else if (next.size >= SCANS) addXp(5, 'Hunt over');
  };

  const restart = () => {
    setMission(newMission());
    setScanned(new Set());
    setLast(null);
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.board}>
        <div className={styles.status}>
          <span>
            <Crosshair size={14} aria-hidden="true" /> Scans left <strong className="mono">{left}</strong>
          </span>
          <span>
            <EyeOff size={14} aria-hidden="true" /> Cool flames{' '}
            <strong className="mono">
              {found}/{goal}
            </strong>
          </span>
          <span className={styles.mission}>
            {mission.fuel.name} · {mission.dil.name}
          </span>
        </div>

        <div className={styles.radar}>
          {!over && <span className={styles.sweep} aria-hidden="true" />}
          <div className={styles.grid} role="grid" aria-label="Hidden burning regime map. Click a cell to scan it.">
            {grid.map((row, r) => (
              <div className={styles.row} role="row" key={r}>
                <span className={`${styles.y} mono`}>{ATM_AXIS[r]}</span>
                {row.map((cell, c) => {
                  const k = `${r}-${c}`;
                  const shown = scanned.has(k) || over;
                  const Icon = ICON[cell.regime];
                  return (
                    <motion.button
                      key={`${mission.key}-${k}`}
                      type="button"
                      role="gridcell"
                      className={`${styles.cell} ${shown ? styles[cell.regime] : styles.fog} ${!scanned.has(k) && over ? styles.ghost : ''}`}
                      onClick={() => scan(r, c)}
                      disabled={over || scanned.has(k)}
                      initial={false}
                      animate={shown ? { rotateY: 0 } : { rotateY: 180 }}
                      transition={{ duration: 0.35 }}
                      aria-label={shown ? `${cell.o2}% O₂, ${cell.atm} atm: ${cell.regime}` : `Scan ${cell.o2}% O₂ at ${cell.atm} atm`}
                    >
                      {shown && <Icon size={14} aria-hidden="true" />}
                    </motion.button>
                  );
                })}
              </div>
            ))}
            <div className={styles.row}>
              <span className={styles.y} />
              {O2_AXIS.map((o) => (
                <span key={o} className={`${styles.x} mono`}>
                  {o}
                </span>
              ))}
            </div>
          </div>
          <p className={styles.axis}>Oxygen % → · Pressure (atm) ↑</p>
        </div>
      </div>

      <aside className={styles.side} aria-live="polite">
        <h3 className={styles.h}>
          <Radar size={18} aria-hidden="true" /> Mission briefing
        </h3>
        <p className={styles.brief}>
          Cool flames are invisible! Use your {SCANS} radar scans to find <strong>{goal}</strong> of them. Each scan reveals whether that spot has a visible hot
          flame, an invisible cool flame, or no fire.
        </p>
        <p className={styles.tip}>
          <strong>Science tip:</strong> cool flames hide on the <em>border</em> between "no fire" and "hot flame". Found a dark cell? Try moving toward more
          oxygen!
        </p>
        {last && !over && (
          <p className={`${styles.last} ${styles[`last_${last.regime}`]}`}>
            Last scan: {last.o2}% O₂ at {last.atm} atm →{' '}
            <strong>{last.regime === 'cool' ? 'COOL FLAME!' : last.regime === 'hot' ? 'hot flame' : 'no fire'}</strong>
          </p>
        )}
        {over && (
          <motion.div className={styles.end} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Stars value={stars} />
            <h4>{won ? 'Ghost flames captured!' : 'Out of scans'}</h4>
            <p>
              {won ? `You found ${found} cool flames with ${left} scans to spare.` : `You found ${found}. The faded cells show where the rest were hiding.`}
            </p>
            <button type="button" onClick={restart}>
              <RotateCcw size={14} aria-hidden="true" /> New hunt
            </button>
          </motion.div>
        )}
        <ul className={styles.legend}>
          <li>
            <i className={styles.hot} /> Visible hot flame
          </li>
          <li>
            <i className={styles.cool} /> Invisible cool flame
          </li>
          <li>
            <i className={styles.extinct} /> No fire
          </li>
        </ul>
      </aside>
    </div>
  );
}
