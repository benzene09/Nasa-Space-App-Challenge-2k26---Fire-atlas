import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, RotateCcw, CheckCircle2, XCircle } from 'lucide-react';
import { useMission } from '../../hooks/useMission';
import { useGame } from '../../hooks/useGame';
import { cabinRisk, riskLevel } from '../../utils/models';
import ModeTabs from '../game/ModeTabs';
import styles from './MissionMap.module.css';

const NODES = {
  iss: { x: 90, y: 150 },
  gateway: { x: 250, y: 70 },
  moon: { x: 400, y: 140 },
  transit: { x: 560, y: 70 },
  mars: { x: 715, y: 140 },
};
const PATH = 'M90 150 C 160 60, 200 60, 250 70 S 350 150, 400 140 S 500 60, 560 70 S 680 150, 715 140';

/** Animated mission journey (simulation) + "guess the riskiest phase" game. */
export default function MissionMap() {
  const { phase, phases, setPhaseId } = useMission();
  const { unlock, addXp, stats, setStat } = useGame();
  const [mode, setMode] = useState('explore');
  const [guess, setGuess] = useState(null);

  const risks = phases.map((p) => ({ ...p, risk: cabinRisk({ o2: p.o2, pressure: p.pressure, gravity: p.gravity }) }));
  const top = [...risks].sort((a, b) => b.risk - a.risk)[0];
  const revealed = mode === 'explore' || guess;

  // Explorer badge: visit every phase.
  useEffect(() => {
    const visited = new Set(stats.visited || []);
    if (visited.has(phase.id)) return;
    visited.add(phase.id);
    setStat('visited', [...visited]);
    if (visited.size >= phases.length) unlock('explorer');
  }, [phase.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const onNode = (id) => {
    if (mode === 'explore') return setPhaseId(id);
    if (guess) return undefined;
    setGuess(id);
    setPhaseId(id);
    if (id === top.id) {
      addXp(30, 'Correct guess!');
      unlock('risk-reader');
    } else addXp(10, 'Nice try');
    return undefined;
  };

  const ship = NODES[phase.id];
  const visited = new Set(stats.visited || []);

  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <div>
          <p className={styles.eyebrow}>Mission journey simulator</p>
          <h2 className={styles.title}>{mode === 'explore' ? 'Fly the mission: tap a stop' : 'Which stop has the highest fire risk?'}</h2>
        </div>
        <ModeTabs
          id="overview"
          mode={mode}
          onChange={(m) => {
            setMode(m);
            setGuess(null);
          }}
          playLabel="Guess"
        />
      </div>

      <div className={styles.mapWrap}>
        <svg viewBox="0 0 800 220" className={styles.map} role="group" aria-label="Mission journey map">
          <defs>
            <radialGradient id="mm-earth">
              <stop offset="0%" stopColor="#6fb6ff" />
              <stop offset="100%" stopColor="#1d4fb8" />
            </radialGradient>
            <radialGradient id="mm-moon">
              <stop offset="0%" stopColor="#e3e6ee" />
              <stop offset="100%" stopColor="#7c8190" />
            </radialGradient>
            <radialGradient id="mm-mars">
              <stop offset="0%" stopColor="#ff9a66" />
              <stop offset="100%" stopColor="#a8391a" />
            </radialGradient>
          </defs>
          <circle cx="60" cy="190" r="46" fill="url(#mm-earth)" opacity="0.9" />
          <circle cx="420" cy="182" r="26" fill="url(#mm-moon)" opacity="0.9" />
          <circle cx="745" cy="186" r="34" fill="url(#mm-mars)" opacity="0.9" />
          <path d={PATH} className={styles.path} />
          <motion.path
            d={PATH}
            className={styles.pathGlow}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, ease: 'easeInOut' }}
          />

          {risks.map((p) => {
            const n = NODES[p.id];
            const tone = riskLevel(p.risk / 100).tone;
            const isGuess = guess === p.id;
            return (
              <g
                key={p.id}
                role="button"
                tabIndex={0}
                aria-label={`${p.name}${revealed ? `, fire risk ${p.risk}` : ''}`}
                className={`${styles.node} ${phase.id === p.id ? styles.nodeOn : ''}`}
                onClick={() => onNode(p.id)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onNode(p.id))}
              >
                <circle cx={n.x} cy={n.y} r="22" className={styles.hit} />
                <circle cx={n.x} cy={n.y} r="11" className={`${styles.dot} ${styles[tone]} ${!revealed ? styles.hidden : ''}`} />
                {visited.has(p.id) && <circle cx={n.x} cy={n.y} r="16" className={styles.visited} />}
                <text x={n.x} y={n.y + (n.y < 100 ? -26 : 36)} className={styles.label}>
                  {p.name}
                </text>
                <AnimatePresence>
                  {revealed && (
                    <motion.g initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <rect x={n.x + 16} y={n.y - 30} width="36" height="20" rx="6" className={`${styles.pill} ${styles[`pill_${tone}`]}`} />
                      <text x={n.x + 34} y={n.y - 16} className={styles.pillText}>
                        {p.risk}
                      </text>
                    </motion.g>
                  )}
                </AnimatePresence>
                {isGuess && <circle cx={n.x} cy={n.y} r="20" className={p.id === top.id ? styles.right : styles.wrong} />}
              </g>
            );
          })}

          <motion.g animate={{ x: ship.x, y: ship.y - 2 }} transition={{ type: 'spring', stiffness: 60, damping: 14 }} initial={false}>
            <g className={styles.ship}>
              <path d="M0 -14 L7 4 L0 1 L-7 4 Z" fill="#fff" />
              <path d="M-3 3 L0 12 L3 3 Z" fill="#ffb23f" className={styles.thrust} />
            </g>
          </motion.g>
        </svg>
      </div>

      <div className={styles.foot} aria-live="polite">
        {mode === 'explore' && (
          <p>
            <HelpCircle size={16} aria-hidden="true" /> Stops visited: <strong className="mono">{visited.size}/5</strong>. Visit all five to earn the{' '}
            <em>Solar Explorer</em> badge.
          </p>
        )}
        {mode === 'play' && !guess && <p>Think about gravity and oxygen. Tap the stop you think is most dangerous!</p>}
        {mode === 'play' && guess && (
          <div className={styles.result}>
            {guess === top.id ? (
              <CheckCircle2 size={20} className={styles.ok} aria-hidden="true" />
            ) : (
              <XCircle size={20} className={styles.no} aria-hidden="true" />
            )}
            <p>
              {guess === top.id ? 'Correct! ' : `Not quite. It's ${top.name}. `}
              {top.name} combines {top.o2}% oxygen with {top.gravity}g, and partial gravity gently feeds flames with fresh oxygen.
            </p>
            <button type="button" className={styles.again} onClick={() => setGuess(null)}>
              <RotateCcw size={14} aria-hidden="true" /> Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
