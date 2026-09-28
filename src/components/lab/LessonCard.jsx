import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, RotateCw, GraduationCap } from 'lucide-react';
import { LESSONS } from '../../utils/labPhysics';
import styles from './LessonCard.module.css';

/** Step-by-step guided lessons shown over the 3D scene. */
export default function LessonCard({ lesson, started, onGo }) {
  const l = LESSONS[lesson];
  const last = lesson === LESSONS.length - 1;

  return (
    <div className={styles.card} role="region" aria-label="Guided lesson">
      <div className={styles.top}>
        <span className={styles.badge}>
          <GraduationCap size={14} aria-hidden="true" /> Lesson {lesson + 1} of {LESSONS.length}
        </span>
        {started && (
          <button type="button" className={styles.icon} onClick={() => onGo(lesson)} aria-label="Replay this lesson">
            <RotateCw size={16} />
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={lesson} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
          <h3 className={styles.title}>{l.title}</h3>
          <p className={styles.text}>{l.text}</p>
        </motion.div>
      </AnimatePresence>

      <div className={styles.nav}>
        <button type="button" className={styles.icon} onClick={() => onGo(lesson - 1)} disabled={!started || lesson === 0} aria-label="Previous lesson">
          <ChevronLeft size={18} />
        </button>
        <div className={styles.dots} role="tablist" aria-label="Lessons">
          {LESSONS.map((x, i) => (
            <button
              key={x.title}
              type="button"
              role="tab"
              aria-selected={i === lesson}
              aria-label={`Lesson ${i + 1}: ${x.title}`}
              className={`${styles.dot} ${i === lesson ? styles.dotOn : ''} ${i < lesson ? styles.dotDone : ''}`}
              onClick={() => onGo(i)}
            />
          ))}
        </div>
        {!started ? (
          <button type="button" className={styles.primary} onClick={() => onGo(0)}>
            <Play size={16} aria-hidden="true" /> Start
          </button>
        ) : (
          <button type="button" className={styles.primary} onClick={() => onGo(last ? 0 : lesson + 1)}>
            {last ? 'Restart' : 'Next'} <ChevronRight size={16} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
