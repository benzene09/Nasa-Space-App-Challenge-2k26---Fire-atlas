import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import styles from './Stars.module.css';

/** 0–3 star rating with a pop-in animation. */
export default function Stars({ value, size = 28 }) {
  return (
    <div className={styles.stars} role="img" aria-label={`${value} of 3 stars`}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          initial={{ scale: 0, rotate: -40 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.15 + i * 0.15, type: 'spring', stiffness: 400, damping: 14 }}
          className={i < value ? styles.on : styles.off}
        >
          <Star size={size} fill="currentColor" aria-hidden="true" />
        </motion.span>
      ))}
    </div>
  );
}
