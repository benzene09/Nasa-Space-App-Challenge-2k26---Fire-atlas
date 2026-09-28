import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, FileText, CheckCircle2, XCircle, ChevronRight, RotateCcw, Zap } from 'lucide-react';
import { useGame } from '../../hooks/useGame';
import { QUIZ } from '../../utils/gameData';
import Stars from '../game/Stars';
import styles from './FireQuiz.module.css';

/** FireGPT Quiz: FireGPT asks, the player answers, FireGPT explains with a NASA citation. */
export default function FireQuiz() {
  const { addXp, unlock } = useGame();
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [done, setDone] = useState(false);

  const q = QUIZ[i];
  const answer = (idx) => {
    if (picked !== null) return;
    setPicked(idx);
    if (idx === q.answer) {
      const s = streak + 1;
      setStreak(s);
      setScore((v) => v + 1);
      addXp(10 + (s >= 3 ? 5 : 0), s >= 3 ? `Streak x${s}!` : 'Correct!');
    } else setStreak(0);
  };

  const next = () => {
    if (i === QUIZ.length - 1) {
      setDone(true);
      if (score >= 5) unlock('scholar');
      return;
    }
    setI(i + 1);
    setPicked(null);
  };

  const restart = () => {
    setI(0);
    setPicked(null);
    setScore(0);
    setStreak(0);
    setDone(false);
  };

  const stars = score >= 6 ? 3 : score >= 5 ? 2 : score >= 3 ? 1 : 0;

  return (
    <div className={styles.quiz}>
      <div className={styles.progress} aria-hidden="true">
        {QUIZ.map((_, k) => (
          <span key={k} className={k < i || done ? styles.pDone : k === i ? styles.pNow : ''} />
        ))}
      </div>
      <div className={styles.meta}>
        <span>
          Question{' '}
          <strong className="mono">
            {Math.min(i + 1, QUIZ.length)}/{QUIZ.length}
          </strong>
        </span>
        <span>
          Score <strong className="mono">{score}</strong>
        </span>
        {streak >= 2 && (
          <motion.span className={styles.streak} initial={{ scale: 0 }} animate={{ scale: 1 }}>
            <Zap size={14} aria-hidden="true" /> {streak} streak
          </motion.span>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!done ? (
          <motion.div key={i} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
            <div className={styles.ask}>
              <span className={styles.bot} aria-hidden="true">
                <Bot size={18} />
              </span>
              <p>{q.q}</p>
            </div>
            <div className={styles.options}>
              {q.options.map((o, k) => {
                const state = picked === null ? '' : k === q.answer ? styles.right : k === picked ? styles.wrong : styles.dim;
                return (
                  <button key={o} type="button" className={`${styles.opt} ${state}`} onClick={() => answer(k)} disabled={picked !== null}>
                    <span className={`${styles.letter} mono`}>{'ABCD'[k]}</span>
                    {o}
                    {picked !== null && k === q.answer && <CheckCircle2 size={18} className={styles.icon} aria-hidden="true" />}
                    {picked === k && k !== q.answer && <XCircle size={18} className={styles.icon} aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
            {picked !== null && (
              <motion.div className={styles.explain} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} role="status">
                <span className={styles.bot} aria-hidden="true">
                  <Bot size={18} />
                </span>
                <div>
                  <p>
                    <strong>{picked === q.answer ? 'Nice!' : 'Good try!'}</strong> {q.why}
                  </p>
                  <span className={styles.cite}>
                    <FileText size={12} aria-hidden="true" /> {q.cite}
                  </span>
                </div>
                <button type="button" className={styles.next} onClick={next}>
                  {i === QUIZ.length - 1 ? 'Finish' : 'Next'} <ChevronRight size={16} aria-hidden="true" />
                </button>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div key="done" className={styles.end} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Stars value={stars} size={36} />
            <h3>
              {score}/{QUIZ.length} correct
            </h3>
            <p>{score >= 5 ? 'You earned the Space Scholar badge!' : 'Score 5 or more to earn the Space Scholar badge.'}</p>
            <button type="button" className={styles.next} onClick={restart}>
              <RotateCcw size={14} aria-hidden="true" /> Play again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
