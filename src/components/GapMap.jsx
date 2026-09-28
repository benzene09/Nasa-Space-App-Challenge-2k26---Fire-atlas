import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Map as MapIcon, Target, FlaskConical } from 'lucide-react';
import { useMission } from '../hooks/useMission';
import { gapGrid, GAP_O2, GAP_G, TEST_NEXT } from '../utils/models';
import Panel from './Panel';
import { useKids } from '../hooks/useKids';
import ModeTabs from './game/ModeTabs';
import GapPlanner from './games/GapPlanner';
import styles from './GapMap.module.css';

const G_LABEL = { 1: 'Earth 1g', 0.75: '0.75g', 0.5: '0.5g', 0.38: 'Mars .38g', 0.16: 'Moon .16g', 0.05: 'Flight .05g', 0: 'Orbit 0g' };

const tone = (n) => (n === 0 ? 'gap' : n < 5 ? 'thin' : n < 15 ? 'some' : 'dense');

/** F18 — Research Gap Map: tested experiments per O₂ × gravity cell + "test next" list. */
export default function GapMap() {
  const { kids } = useKids();
  const [mode, setMode] = useState(kids ? 'play' : 'explore');
  useEffect(() => setMode(kids ? 'play' : 'explore'), [kids]);
  const { phase } = useMission();
  const grid = useMemo(() => gapGrid(), []);
  const [hover, setHover] = useState(null);

  const flat = grid.flat();
  const untested = flat.filter((c) => c.n === 0).length;
  const total = flat.reduce((a, c) => a + c.n, 0);
  const nearestO2 = GAP_O2.reduce((b, x) => (Math.abs(x - phase.o2) < Math.abs(b - phase.o2) ? x : b));

  return (
    <Panel
      id="gaps"
      icon={MapIcon}
      eyebrow="Coverage analysis + active learning · PSI repository"
      title="Research Gap Map"
      description="Each cell counts public experiments at that oxygen level and gravity. Empty cells are conditions no one has tested — the list on the right ranks what NASA should test next."
      actions={<ModeTabs id="gaps" mode={mode} onChange={setMode} playLabel="Plan" />}
    >
      {mode === 'play' ? (
        <GapPlanner />
      ) : (
        <>
          <div className={styles.summary}>
            <div>
              <span className="mono">{total}</span>
              <p>tests indexed</p>
            </div>
            <div>
              <span className={`mono ${styles.gapNum}`}>{untested}</span>
              <p>of {flat.length} zones untested</p>
            </div>
            <div>
              <span className="mono">{Math.round(((flat.length - untested) / flat.length) * 100)}%</span>
              <p>coverage</p>
            </div>
          </div>

          <div className={styles.layout}>
            <div className={styles.heat} onMouseLeave={() => setHover(null)}>
              {grid.map((row, ri) => (
                <div className={styles.row} key={GAP_G[ri]}>
                  <span className={`${styles.yTick} ${GAP_G[ri] === phase.gravity ? styles.tickOn : ''}`}>{G_LABEL[GAP_G[ri]]}</span>
                  {row.map((c, ci) => {
                    const isPhase = c.g === phase.gravity && c.o2 === nearestO2;
                    return (
                      <motion.div
                        key={`${c.g}-${c.o2}`}
                        className={`${styles.cell} ${styles[tone(c.n)]} ${isPhase ? styles.phase : ''}`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: (ri * 8 + ci) * 0.01, duration: 0.3 }}
                        tabIndex={0}
                        role="img"
                        aria-label={`${c.o2}% oxygen at ${c.g} g: ${c.n === 0 ? 'untested' : `${c.n} tests`}${isPhase ? ', current mission phase' : ''}`}
                        onMouseEnter={() => setHover(c)}
                        onFocus={() => setHover(c)}
                      >
                        <span className="mono">{c.n === 0 ? '—' : c.n}</span>
                      </motion.div>
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
              <p className={styles.hoverLine} aria-live="polite">
                {hover
                  ? `${hover.o2}% O₂ at ${hover.g}g — ${hover.n === 0 ? 'no experiment has tested this' : `${hover.n} experiments`}`
                  : `Outlined cell = ${phase.name} (${phase.o2}% O₂, ${phase.gravity}g)`}
              </p>
              <div className={styles.legend}>
                <span>
                  <i className={styles.gap} /> Untested
                </span>
                <span>
                  <i className={styles.thin} /> 1–4
                </span>
                <span>
                  <i className={styles.some} /> 5–14
                </span>
                <span>
                  <i className={styles.dense} /> 15+
                </span>
              </div>
            </div>

            <div className={styles.next}>
              <p className={styles.nextTitle}>
                <Target size={16} aria-hidden="true" /> Test next
              </p>
              <ol>
                {TEST_NEXT.map((t, i) => (
                  <motion.li
                    key={t.cond}
                    initial={{ opacity: 0, x: 16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 + i * 0.08 }}
                  >
                    <span className={`${styles.rank} mono`}>{i + 1}</span>
                    <div>
                      <p className={`${styles.cond} mono`}>{t.cond}</p>
                      <p className={styles.why}>{t.why}</p>
                      <div className={styles.gain}>
                        <FlaskConical size={12} aria-hidden="true" />
                        <span>Info gain</span>
                        <div className={styles.gainBar} aria-hidden="true">
                          <span style={{ width: `${t.gain * 100}%` }} />
                        </div>
                        <span className="mono">{t.gain.toFixed(2)}</span>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </ol>
            </div>
          </div>
        </>
      )}
    </Panel>
  );
}
