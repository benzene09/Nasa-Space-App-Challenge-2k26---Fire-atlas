import { motion } from 'framer-motion';
import { Compass, Gamepad2 } from 'lucide-react';
import { useKids } from '../../hooks/useKids';
import styles from './ModeTabs.module.css';

/** Explore / Play switch used by every section. */
export default function ModeTabs({ id, mode, onChange, playLabel = 'Play' }) {
  const { kids } = useKids();
  const tabs = [
    { key: 'explore', label: kids ? 'Learn' : 'Explore', icon: Compass },
    { key: 'play', label: playLabel, icon: Gamepad2 },
  ];
  return (
    <div className={styles.tabs} role="tablist" aria-label="Section mode">
      {tabs.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={mode === key}
          className={`${styles.tab} ${mode === key ? styles.on : ''}`}
          onClick={() => onChange(key)}
        >
          {mode === key && <motion.span layoutId={`mode-${id}`} className={styles.pill} transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
          <Icon size={16} aria-hidden="true" />
          <span>{label}</span>
          {key === 'play' && <span className={styles.xp}>XP</span>}
        </button>
      ))}
    </div>
  );
}
