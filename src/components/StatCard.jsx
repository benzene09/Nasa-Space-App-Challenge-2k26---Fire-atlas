import { motion, AnimatePresence } from 'framer-motion';
import styles from './StatCard.module.css';

export default function StatCard({ icon: Icon, label, value, unit, hint, accent = 'cyan' }) {
  return (
    <div className={`${styles.card} ${styles[accent]}`}>
      <div className={styles.top}>
        <span className={styles.icon} aria-hidden="true">
          <Icon size={16} />
        </span>
        <span className={styles.label}>{label}</span>
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={String(value)}
          className={`${styles.value} ${String(value).length > 6 ? styles.long : ''}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
        >
          <span className="mono">{value}</span>
          {unit && <span className={styles.unit}>{unit}</span>}
        </motion.p>
      </AnimatePresence>
      {hint && <p className={styles.hint}>{hint}</p>}
    </div>
  );
}
