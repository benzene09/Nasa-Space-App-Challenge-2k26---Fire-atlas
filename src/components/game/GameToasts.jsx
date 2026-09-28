import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowUpCircle } from 'lucide-react';
import { useGame } from '../../hooks/useGame';
import BadgeIcon from './BadgeIcon';
import styles from './GameToasts.module.css';

/** XP, badge and level-up popups. */
export default function GameToasts() {
  const { toasts, dismissToast } = useGame();
  return (
    <div className={styles.stack} aria-live="polite">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.button
            type="button"
            key={t.id}
            layout
            className={`${styles.toast} ${styles[t.kind]}`}
            initial={{ opacity: 0, x: 40, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, transition: { duration: 0.18 } }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            onClick={() => dismissToast(t.id)}
          >
            <span className={styles.icon} aria-hidden="true">
              {t.kind === 'badge' ? <BadgeIcon name={t.badge.icon} size={22} /> : t.kind === 'level' ? <ArrowUpCircle size={22} /> : <Sparkles size={18} />}
            </span>
            <span className={styles.text}>
              <strong>{t.title}</strong>
              <small>{t.text}</small>
            </span>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
