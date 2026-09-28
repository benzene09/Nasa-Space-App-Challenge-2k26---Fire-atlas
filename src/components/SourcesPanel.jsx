import { motion } from 'framer-motion';
import { Database, ExternalLink, Lock } from 'lucide-react';
import { SOURCES } from '../utils/data';
import { BADGES } from '../utils/gameData';
import { useGame } from '../hooks/useGame';
import Panel from './Panel';
import styles from './SourcesPanel.module.css';

const linkFor = (id) =>
  id === 'DONKI'
    ? 'https://kauai.ccmc.gsfc.nasa.gov/DONKI/'
    : id.startsWith('NTRS')
      ? `https://ntrs.nasa.gov/citations/${id.replace('NTRS ', '')}`
      : 'https://psi.ndc.nasa.gov/';

/** Collectible NASA data cards: each one unlocks when you earn a badge that uses it. */
export default function SourcesPanel() {
  const { badges } = useGame();
  const unlockedBy = (id) => BADGES.filter((b) => b.source === id);
  const collected = SOURCES.filter((s) => unlockedBy(s.id).some((b) => badges.has(b.id))).length;

  return (
    <Panel
      id="sources"
      icon={Database}
      eyebrow="Unified dataset (F1) · collectible cards"
      title="NASA data card collection"
      description="Every number on this dashboard comes from these public NASA sources. Earn badges to flip and collect each card. PSI downloads need a free account: search the PSI ID in its search box."
      actions={
        <span className={styles.count}>
          <span className="mono">
            {collected}/{SOURCES.length}
          </span>{' '}
          collected
        </span>
      }
    >
      <ul className={styles.grid}>
        {SOURCES.map((s, i) => {
          const by = unlockedBy(s.id);
          const open = by.some((b) => badges.has(b.id));
          return (
            <li key={s.id} className={styles.slot}>
              <motion.div
                className={styles.flip}
                initial={false}
                animate={{ rotateY: open ? 0 : 180 }}
                transition={{ duration: 0.7, delay: i * 0.03, type: 'spring', stiffness: 120, damping: 16 }}
              >
                <a
                  href={linkFor(s.id)}
                  target="_blank"
                  rel="noreferrer"
                  className={`${styles.face} ${styles.front}`}
                  tabIndex={open ? 0 : -1}
                  aria-hidden={!open}
                >
                  <span className={`${styles.id} mono`}>{s.id}</span>
                  <span className={styles.name}>{s.name}</span>
                  <span className={styles.use}>{s.use}</span>
                  <ExternalLink size={14} className={styles.ext} aria-hidden="true" />
                </a>
                <div className={`${styles.face} ${styles.back}`} aria-hidden={open}>
                  <Lock size={20} aria-hidden="true" />
                  <span className={`${styles.id} mono`}>{s.id}</span>
                  <span className={styles.hint}>Earn {by.map((b) => b.name).join(' or ')} to unlock</span>
                </div>
              </motion.div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
