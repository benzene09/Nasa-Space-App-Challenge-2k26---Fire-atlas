import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FlaskConical, Rocket, RotateCcw, Coins } from 'lucide-react';
import { useGame } from '../../hooks/useGame';
import { gapGrid, GAP_O2, GAP_G } from '../../utils/models';
import Stars from '../game/Stars';
import styles from './GapPlanner.module.css';

const BUDGET = 3;
const G_LABEL = { 1: 'Earth', 0.75: '0.75g', 0.5: '0.5g', 0.38: 'Mars', 0.16: 'Moon', 0.05: 'Flight', 0: 'Orbit' };

/** Science value of testing a cell: untested + close to real mission conditions = most valuable. */
function valueOf(cell) {
  const untested = cell.n === 0 ? 1 : cell.n < 5 ? 0.35 : 0.05;
  const mission = cell.g === 0.16 || cell.g === 0.38 ? 1 : cell.g === 0 || cell.g === 0.5 ? 0.5 : 0.25;
  const o2 = cell.o2 >= 30 && cell.o2 <= 34 ? 1 : cell.o2 >= 24 ? 0.6 : 0.3;
  return Math.round(untested * (mission * 0.6 + o2 * 0.4) * 100);
}

/** Gap Planner: spend a small budget on experiments that teach NASA the most. */
export default function GapPlanner() {
  const { addXp, unlock } = useGame();
  const grid = useMemo(() => gapGrid(), []);
  const [picks, setPicks] = useState([]);
  const [launched, setLaunched] = useState(false);

  const best = useMemo(() => {
    const all = grid.flat().map((c) => ({ ...c, v: valueOf(c) }));
    return all.sort((a, b) => b.v - a.v).slice(0, BUDGET);
  }, [grid]);
  const bestSum = best.reduce((a, c) => a + c.v, 0);
  const key = (c) => `${c.g}-${c.o2}`;
  const bestKeys = new Set(best.map(key));
  const sum = picks.reduce((a, c) => a + valueOf(c), 0);
  const ratio = bestSum ? sum / bestSum : 0;
  const stars = ratio >= 0.95 ? 3 : ratio >= 0.7 ? 2 : ratio >= 0.4 ? 1 : 0;

  const toggle = (cell) => {
    if (launched) return;
    const k = key(cell);
    setPicks((p) => (p.some((x) => key(x) === k) ? p.filter((x) => key(x) !== k) : p.length < BUDGET ? [...p, cell] : p));
  };

  const launch = () => {
    setLaunched(true);
    addXp(10 + stars * 12, `${stars}★ mission plan`);
    if (stars === 3) unlock('planner');
  };

  const reset = () => {
    setPicks([]);
    setLaunched(false);
  };

  return (
    <div className={styles.wrap}>
      <div>
        <div className={styles.budget}>
          <Coins size={16} aria-hidden="true" /> Experiment budget:
          {Array.from({ length: BUDGET }, (_, i) => (
            <span key={i} className={`${styles.token} ${i < picks.length ? styles.tokenUsed : ''}`}>
              <FlaskConical size={14} aria-hidden="true" />
            </span>
          ))}
          <span className={styles.value}>
            Science value <strong className="mono">{sum}</strong>
          </span>
        </div>

        <div className={styles.heat}>
          {grid.map((row, ri) => (
            <div className={styles.row} key={GAP_G[ri]}>
              <span className={styles.yTick}>{G_LABEL[GAP_G[ri]]}</span>
              {row.map((c) => {
                const k = key(c);
                const picked = picks.some((p) => key(p) === k);
                const isBest = launched && bestKeys.has(k);
                return (
                  <motion.button
                    key={k}
                    type="button"
                    whileTap={{ scale: 0.9 }}
                    className={`${styles.cell} ${c.n === 0 ? styles.gap : c.n < 5 ? styles.thin : styles.dense} ${picked ? styles.picked : ''} ${isBest ? styles.best : ''}`}
                    onClick={() => toggle(c)}
                    disabled={launched}
                    aria-pressed={picked}
                    aria-label={`${c.o2}% O₂ at ${c.g} g, ${c.n} tests so far${picked ? ', planned' : ''}`}
                  >
                    {picked ? (
                      <motion.span initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }}>
                        <FlaskConical size={16} aria-hidden="true" />
                      </motion.span>
                    ) : (
                      <span className="mono">{c.n || ''}</span>
                    )}
                    {launched && picked && <span className={`${styles.pts} mono`}>+{valueOf(c)}</span>}
                  </motion.button>
                );
              })}
            </div>
          ))}
          <div className={styles.row}>
            <span className={styles.yTick} />
            {GAP_O2.map((o) => (
              <span key={o} className={`${styles.xTick} mono`}>
                {o}%
              </span>
            ))}
          </div>
        </div>
      </div>

      <aside className={styles.side} aria-live="polite">
        <h3>You are NASA's test planner!</h3>
        <p>
          You can fund only <strong>{BUDGET} experiments</strong>. Tap cells to plan them. Tests teach the most when they fill <em>empty</em> zones that match
          real missions: Moon and Mars gravity with habitat oxygen (30–34%).
        </p>
        {!launched ? (
          <button type="button" className={styles.launch} disabled={picks.length < BUDGET} onClick={launch}>
            <Rocket size={18} aria-hidden="true" /> Launch experiments ({picks.length}/{BUDGET})
          </button>
        ) : (
          <motion.div className={styles.result} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Stars value={stars} />
            <p>
              Your plan scored <strong className="mono">{sum}</strong> of a possible <strong className="mono">{bestSum}</strong>. Gold cells show the best
              possible plan.
            </p>
            <button type="button" className={styles.launch} onClick={reset}>
              <RotateCcw size={16} aria-hidden="true" /> Plan again
            </button>
          </motion.div>
        )}
      </aside>
    </div>
  );
}
