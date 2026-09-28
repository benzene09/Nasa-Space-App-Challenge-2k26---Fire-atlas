import { lazy, Suspense, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flag, Play, RotateCcw, Trophy, Timer, ShieldCheck } from 'lucide-react';
import { useMission } from '../../hooks/useMission';
import { useGame } from '../../hooks/useGame';
import { useInView } from '../../hooks/useInView';
import { MATERIALS } from '../../utils/data';
import { rankMaterials, predictAt } from '../../utils/models';
import styles from './BurnRace.module.css';

const BurnRaceScene = lazy(() => import('./BurnRaceScene'));
const COLORS = ['#ffd27a', '#8fc8ff'];

const pickPair = () => {
  const a = Math.floor(Math.random() * MATERIALS.length);
  let b = Math.floor(Math.random() * MATERIALS.length);
  while (b === a) b = Math.floor(Math.random() * MATERIALS.length);
  return [MATERIALS[a].id, MATERIALS[b].id];
};

const freshRace = () => ({
  time: 0,
  finished: false,
  started: false,
  lanes: [0, 1].map(() => ({ progress: 0, burning: false, dying: 0, out: false, finishedAt: null })),
});

/** Burn Race: predict which cabin material burns faster, then watch the 3D test. */
export default function BurnRace() {
  const { phase, conditions } = useMission();
  const { addXp, bump, unlock, stats } = useGame();
  const [pair, setPair] = useState(pickPair);
  const [pick, setPick] = useState(null);
  const [stage, setStage] = useState('setup'); // setup | countdown | racing | done
  const [count, setCount] = useState(3);
  const [, force] = useState(0);
  const raceRef = useRef(freshRace());
  const [wrapRef, inView] = useInView();

  const lanes = useMemo(() => {
    const ranked = rankMaterials(conditions);
    return pair.map((id, i) => {
      const m = ranked.find((r) => r.id === id);
      const spread = predictAt(m, conditions.gravity).mean; // mm/s
      return {
        ...m,
        color: COLORS[i],
        spread,
        speed: spread * 0.11,
        stopAt: m.selfExtinguishes ? 0.12 + (m.risk % 0.1) * 1.5 : null,
      };
    });
  }, [pair, conditions]);

  const winner = useMemo(() => {
    const [a, b] = lanes;
    if (a.stopAt !== null && b.stopAt !== null) return a.risk >= b.risk ? 0 : 1;
    if (a.stopAt !== null) return 1;
    if (b.stopAt !== null) return 0;
    return a.speed >= b.speed ? 0 : 1;
  }, [lanes]);

  const start = () => {
    raceRef.current = freshRace();
    setStage('countdown');
    setCount(3);
    [2, 1, 0].forEach((n, i) =>
      setTimeout(
        () => {
          setCount(n);
          if (n === 0) {
            raceRef.current.started = true;
            raceRef.current.lanes.forEach((l) => {
              l.burning = true;
              l.dying = 1;
            });
            setStage('racing');
          }
        },
        (i + 1) * 650,
      ),
    );
  };

  const onDone = () => {
    setStage('done');
    if (pick === winner) {
      addXp(25, 'Great prediction!');
      if (bump('raceWins') >= 3) unlock('detective');
    } else addXp(5, 'Race complete');
  };

  const again = (newPair) => {
    raceRef.current = freshRace();
    if (newPair) setPair(pickPair());
    setPick(null);
    setStage('setup');
  };

  const r = raceRef.current;

  return (
    <div className={styles.wrap}>
      <div className={styles.setup}>
        <p className={styles.step}>
          <strong>1.</strong> Choose two materials · conditions:{' '}
          <span className="mono">
            {phase.name} · {phase.o2}% O₂ · {phase.gravity}g
          </span>
        </p>
        <div className={styles.pickers}>
          {[0, 1].map((i) => (
            <label key={i} className={styles.pickLabel} style={{ '--lane': COLORS[i] }}>
              <span className={styles.laneTag}>{i === 0 ? 'A' : 'B'}</span>
              <select
                value={pair[i]}
                disabled={stage !== 'setup'}
                onChange={(e) => setPair((p) => (i === 0 ? [e.target.value, p[1]] : [p[0], e.target.value]))}
                aria-label={`Lane ${i === 0 ? 'A' : 'B'} material`}
              >
                {MATERIALS.filter((m) => m.id !== pair[1 - i]).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
        <p className={styles.step}>
          <strong>2.</strong> Predict: which one burns faster?
        </p>
        <div className={styles.predict}>
          {lanes.map((l, i) => (
            <button
              key={l.id}
              type="button"
              disabled={stage !== 'setup'}
              aria-pressed={pick === i}
              className={`${styles.predictBtn} ${pick === i ? styles.predictOn : ''}`}
              style={{ '--lane': COLORS[i] }}
              onClick={() => setPick(i)}
            >
              <span className={styles.laneTag}>{i === 0 ? 'A' : 'B'}</span>
              {l.name}
            </button>
          ))}
        </div>
        <button type="button" className={styles.go} disabled={pick === null || stage !== 'setup'} onClick={start}>
          <Play size={18} aria-hidden="true" /> Start the burn test
        </button>
        <p className={styles.wins}>
          <Trophy size={14} aria-hidden="true" /> Correct predictions: <span className="mono">{stats.raceWins || 0}</span> · 3 earns <em>Fire Detective</em>
        </p>
      </div>

      <div className={styles.stage} ref={wrapRef}>
        {inView ? (
          <Suspense fallback={<div className={styles.loading}>Loading test chamber…</div>}>
            <BurnRaceScene
              lanes={lanes}
              gravity={phase.gravity}
              raceRef={raceRef}
              running={stage === 'racing'}
              onTick={() => force((x) => x + 1)}
              onDone={onDone}
            />
          </Suspense>
        ) : (
          <div className={styles.loading}>Test chamber paused</div>
        )}

        <div className={styles.hud}>
          {lanes.map((l, i) => {
            const st = r.lanes[i];
            return (
              <div key={l.id} className={styles.hudLane} style={{ '--lane': COLORS[i] }}>
                <span className={styles.laneTag}>{i === 0 ? 'A' : 'B'}</span>
                <span className={styles.hudName}>{l.name}</span>
                <div className={styles.track}>
                  <span style={{ width: `${st.progress * 100}%` }} />
                </div>
                <span className={`${styles.hudVal} mono`}>
                  {st.out ? 'OUT' : st.finishedAt ? `${st.finishedAt.toFixed(1)}s` : `${Math.round(st.progress * 100)}%`}
                </span>
              </div>
            );
          })}
          <span className={`${styles.clock} mono`}>
            <Timer size={12} aria-hidden="true" /> {r.time.toFixed(1)}s
          </span>
        </div>

        <AnimatePresence>
          {stage === 'countdown' && (
            <motion.div
              key={count}
              className={styles.count}
              initial={{ scale: 2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
            >
              {count === 0 ? 'GO!' : count}
            </motion.div>
          )}
          {stage === 'done' && (
            <motion.div className={styles.result} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} role="status">
              <Flag size={22} aria-hidden="true" />
              <h4>{pick === winner ? 'You called it!' : 'Surprise result!'}</h4>
              <p>
                <strong>{lanes[winner].name}</strong> spread fastest ({lanes[winner].spread.toFixed(2)} mm/s).{' '}
                {lanes.some((l) => l.stopAt !== null) && (
                  <>
                    <ShieldCheck size={14} aria-hidden="true" />{' '}
                    {lanes
                      .filter((l) => l.stopAt !== null)
                      .map((l) => l.name)
                      .join(' & ')}{' '}
                    put itself out: {phase.o2}% O₂ is below what it needs.
                  </>
                )}
              </p>
              <div className={styles.resultBtns}>
                <button type="button" onClick={() => again(false)}>
                  <RotateCcw size={14} aria-hidden="true" /> Rematch
                </button>
                <button type="button" className={styles.primary} onClick={() => again(true)}>
                  New pair
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
