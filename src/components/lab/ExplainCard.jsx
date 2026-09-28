import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, BookOpen } from 'lucide-react';
import styles from './ExplainCard.module.css';

/** "What's happening?" — live, plain-language explanation of the simulation. */
export default function ExplainCard({ info }) {
  return (
    <div className={styles.card} aria-live="polite">
      <p className={styles.eyebrow}>
        <Lightbulb size={14} aria-hidden="true" /> What's happening?
      </p>
      <AnimatePresence mode="wait">
        <motion.div key={info.title} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
          <h3 className={styles.title}>{info.title}</h3>
          <p className={styles.text}>{info.text}</p>
          <div className={styles.word}>
            <BookOpen size={16} aria-hidden="true" />
            <p>
              <strong>Science word: {info.word.term}.</strong> {info.word.meaning}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
