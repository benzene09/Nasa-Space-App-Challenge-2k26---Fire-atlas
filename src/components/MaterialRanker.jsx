import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, ArrowUpDown, Check, ShieldCheck, Flame } from 'lucide-react';
import { useMission } from '../hooks/useMission';
import { MATERIALS } from '../utils/data';
import { rankMaterials } from '../utils/models';
import Panel from './Panel';
import { useKids } from '../hooks/useKids';
import ModeTabs from './game/ModeTabs';
import BurnRace from './games/BurnRace';
import RiskBadge from './RiskBadge';
import ShapPanel from './ShapPanel';
import styles from './MaterialRanker.module.css';

const SORTS = {
  risk: { label: 'Risk', fn: (a, b) => b.risk - a.risk },
  loi: { label: 'Oxygen index', fn: (a, b) => a.loi - b.loi },
  name: { label: 'Name', fn: (a, b) => a.name.localeCompare(b.name) },
};

/** F5 + F6 — ranked material table with a SHAP "why this rank" panel. */
export default function MaterialRanker() {
  const { kids } = useKids();
  const [mode, setMode] = useState(kids ? 'play' : 'explore');
  useEffect(() => setMode(kids ? 'play' : 'explore'), [kids]);
  const { conditions, phase } = useMission();
  const [selectedIds, setSelectedIds] = useState(MATERIALS.map((m) => m.id));
  const [sortKey, setSortKey] = useState('risk');
  const [focusId, setFocusId] = useState(null);

  const ranked = useMemo(() => rankMaterials(conditions, selectedIds), [conditions, selectedIds]);
  const rows = useMemo(() => [...ranked].sort(SORTS[sortKey].fn), [ranked, sortKey]);
  const focused = ranked.find((m) => m.id === focusId) || ranked[0];

  const toggle = (id) => setSelectedIds((ids) => (ids.includes(id) ? (ids.length > 1 ? ids.filter((x) => x !== id) : ids) : [...ids, id]));

  return (
    <Panel
      id="ranker"
      icon={Layers}
      eyebrow="XGBoost + SHAP · PSI-26 BASS, PSI-62"
      title="Material Risk Ranker"
      description={`Choose the cabin materials you plan to fly. They are ranked by predicted flammability at ${phase.o2}% O₂, ${phase.pressure} psi and ${phase.gravity}g, and each rank is explained.`}
      actions={<ModeTabs id="ranker" mode={mode} onChange={setMode} playLabel="Burn Race" />}
    >
      {mode === 'play' ? (
        <BurnRace />
      ) : (
        <>
          <fieldset className={styles.chips}>
            <legend className="sr-only">Materials to compare</legend>
            {MATERIALS.map((m) => {
              const on = selectedIds.includes(m.id);
              return (
                <button key={m.id} type="button" aria-pressed={on} className={`${styles.chip} ${on ? styles.chipOn : ''}`} onClick={() => toggle(m.id)}>
                  {on && <Check size={14} aria-hidden="true" />}
                  {m.name}
                </button>
              );
            })}
          </fieldset>

          <div className={styles.layout}>
            <div className={styles.tableWrap}>
              <div className={styles.sortBar}>
                <ArrowUpDown size={14} aria-hidden="true" />
                <span>Sort by</span>
                {Object.entries(SORTS).map(([key, s]) => (
                  <button
                    key={key}
                    type="button"
                    className={`${styles.sortBtn} ${sortKey === key ? styles.sortOn : ''}`}
                    onClick={() => setSortKey(key)}
                    aria-pressed={sortKey === key}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">Material</th>
                    <th scope="col" className={styles.hideSm}>
                      Burns above
                    </th>
                    <th scope="col">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence initial={false}>
                    {rows.map((m) => {
                      const rank = ranked.findIndex((r) => r.id === m.id) + 1;
                      const isFocus = focused?.id === m.id;
                      return (
                        <motion.tr
                          key={m.id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ layout: { type: 'spring', stiffness: 500, damping: 40 }, duration: 0.2 }}
                          className={`${styles.row} ${isFocus ? styles.rowFocus : ''}`}
                          onClick={() => setFocusId(m.id)}
                        >
                          <td className="mono">{String(rank).padStart(2, '0')}</td>
                          <td>
                            <button type="button" className={styles.nameBtn} onClick={() => setFocusId(m.id)} aria-label={`Explain rank for ${m.name}`}>
                              <span className={styles.name}>{m.name}</span>
                              <span className={styles.meta}>
                                {m.type} · {m.source}
                              </span>
                            </button>
                          </td>
                          <td className={styles.hideSm}>
                            <span className={styles.threshold}>
                              {m.selfExtinguishes ? <ShieldCheck size={14} aria-hidden="true" /> : <Flame size={14} aria-hidden="true" />}
                              <span className="mono">{m.burnsAbove}% O₂</span>
                            </span>
                          </td>
                          <td>
                            <RiskBadge value={m.risk} />
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {focused && <ShapPanel material={focused} conditions={conditions} rank={ranked.findIndex((r) => r.id === focused.id) + 1} />}
          </div>
        </>
      )}
    </Panel>
  );
}
