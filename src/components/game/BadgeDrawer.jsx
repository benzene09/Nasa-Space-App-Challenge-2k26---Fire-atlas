import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, RotateCcw } from 'lucide-react';
import { useGame } from '../../hooks/useGame';
import { BADGES, MISSIONS, LEVELS } from '../../utils/gameData';
import BadgeIcon from './BadgeIcon';
import styles from './BadgeDrawer.module.css';

const SECTIONS = ['overview', 'lab', 'solar', 'earth', 'ranker', 'gravity', 'radar', 'firegpt', 'gaps'];

function missionProgress(m, badges) {
  if (m.lab) {
    const lab = BADGES.filter((b) => b.section === 'lab');
    return [lab.filter((b) => badges.has(b.id)).length, lab.length];
  }
  if (m.everySection) return [SECTIONS.filter((s) => BADGES.some((b) => b.section === s && badges.has(b.id))).length, SECTIONS.length];
  return [Math.min(badges.size, m.need), m.need];
}

/** Trophy room: level track, missions and every badge (locked/unlocked). */
export default function BadgeDrawer() {
  const { drawerOpen, setDrawerOpen, badges, level, xp, reset } = useGame();
  const closeRef = useRef(null);

  useEffect(() => {
    if (!drawerOpen) return undefined;
    closeRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && setDrawerOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen, setDrawerOpen]);

  return (
    <AnimatePresence>
      {drawerOpen && (
        <motion.div className={styles.backdrop} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawerOpen(false)}>
          <motion.aside
            className={styles.drawer}
            role="dialog"
            aria-modal="true"
            aria-labelledby="drawer-title"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            onClick={(e) => e.stopPropagation()}
          >
            <header className={styles.head}>
              <div>
                <p className={styles.eyebrow}>Trophy room</p>
                <h2 id="drawer-title">
                  Level {level.level} · {level.title}
                </h2>
              </div>
              <button ref={closeRef} type="button" className={styles.close} onClick={() => setDrawerOpen(false)} aria-label="Close">
                <X size={20} />
              </button>
            </header>

            <div className={styles.levels}>
              {LEVELS.map((l) => (
                <div key={l.level} className={`${styles.lvl} ${xp >= l.xp ? styles.lvlOn : ''}`}>
                  <span className="mono">{l.level}</span>
                  <small>{l.title}</small>
                </div>
              ))}
            </div>
            <p className={`${styles.xpLine} mono`}>
              {xp} XP {level.next ? `· ${level.next.xp - xp} XP to ${level.next.title}` : '· Max level!'}
            </p>

            <h3 className={styles.h3}>Missions</h3>
            <ul className={styles.missions}>
              {MISSIONS.map((m) => {
                const [have, need] = missionProgress(m, badges);
                const done = have >= need;
                return (
                  <li key={m.id} className={done ? styles.missionDone : ''}>
                    <CheckCircle2 size={18} aria-hidden="true" />
                    <div>
                      <strong>{m.title}</strong>
                      <small>{m.desc}</small>
                      <div className={styles.bar} aria-hidden="true">
                        <span style={{ width: `${(have / need) * 100}%` }} />
                      </div>
                    </div>
                    <span className="mono">
                      {have}/{need}
                    </span>
                  </li>
                );
              })}
            </ul>

            <h3 className={styles.h3}>
              Badges{' '}
              <span className="mono">
                {badges.size}/{BADGES.length}
              </span>
            </h3>
            <ul className={styles.grid}>
              {BADGES.map((b) => {
                const on = badges.has(b.id);
                return (
                  <li key={b.id} className={`${styles.badge} ${on ? styles.badgeOn : ''}`}>
                    <span className={styles.medal}>
                      <BadgeIcon name={on ? b.icon : 'Lock'} size={20} />
                    </span>
                    <strong>{b.name}</strong>
                    <small>{b.desc}</small>
                    {!on && (
                      <a href={`#${b.section}`} className={styles.go} onClick={() => setDrawerOpen(false)}>
                        Go play
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>

            <button type="button" className={styles.reset} onClick={reset}>
              <RotateCcw size={14} aria-hidden="true" /> Reset progress
            </button>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
