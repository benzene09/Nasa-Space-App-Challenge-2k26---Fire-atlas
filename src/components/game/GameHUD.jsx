import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { useGame } from '../../hooks/useGame';
import { BADGES } from '../../utils/gameData';
import styles from './GameHUD.module.css';

/** Level, XP bar and badge counter in the top bar. Opens the badge drawer. */
export default function GameHUD() {
  const { xp, level, badges, setDrawerOpen } = useGame();
  const R = 16;
  const C = 2 * Math.PI * R;

  return (
    <button
      type="button"
      className={styles.hud}
      onClick={() => setDrawerOpen(true)}
      aria-label={`Level ${level.level} ${level.title}, ${xp} XP, ${badges.size} of ${BADGES.length} badges. Open badges.`}
    >
      <span className={styles.ring} aria-hidden="true">
        <svg viewBox="0 0 40 40">
          <circle cx="20" cy="20" r={R} className={styles.track} />
          <motion.circle
            cx="20"
            cy="20"
            r={R}
            className={styles.fill}
            strokeDasharray={C}
            animate={{ strokeDashoffset: C * (1 - level.progress) }}
            transition={{ duration: 0.6 }}
          />
        </svg>
        <span className="mono">{level.level}</span>
      </span>
      <span className={styles.text}>
        <strong>{level.title}</strong>
        <small className="mono">
          {xp} XP{level.next ? ` / ${level.next.xp}` : ' · MAX'}
        </small>
      </span>
      <span className={styles.badges}>
        <Trophy size={16} aria-hidden="true" />
        <span className="mono">
          {badges.size}/{BADGES.length}
        </span>
      </span>
    </button>
  );
}
