import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Rocket } from 'lucide-react';
import { useKids } from '../../hooks/useKids';
import { WELCOME_STEPS } from '../../utils/kidText';
import Sparky from './Sparky';
import styles from './Welcome.module.css';

/** First-visit welcome for kids: Sparky explains the adventure in 3 tiny steps. */
export default function Welcome() {
  const { kids, welcomed, setWelcomed, setKids } = useKids();
  const [step, setStep] = useState(0);
  const btn = useRef(null);
  const open = kids && !welcomed;

  useEffect(() => {
    if (open) btn.current?.focus();
  }, [open, step]);

  const finish = () => {
    setWelcomed(true);
    setTimeout(() => document.getElementById('lab')?.scrollIntoView({ behavior: 'smooth' }), 150);
  };
  const last = step === WELCOME_STEPS.length - 1;

  return (
    <AnimatePresence>
      {open && (
        <motion.div className={styles.backdrop} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div
            className={styles.card}
            role="dialog"
            aria-modal="true"
            aria-labelledby="welcome-title"
            initial={{ scale: 0.85, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          >
            <Sparky size={130} wave />
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <h2 id="welcome-title">{WELCOME_STEPS[step].title}</h2>
                <p>{WELCOME_STEPS[step].text}</p>
              </motion.div>
            </AnimatePresence>
            <div className={styles.dots} aria-hidden="true">
              {WELCOME_STEPS.map((_, i) => (
                <span key={i} className={i === step ? styles.on : ''} />
              ))}
            </div>
            <button ref={btn} type="button" className={styles.go} onClick={() => (last ? finish() : setStep(step + 1))}>
              {last ? (
                <>
                  <Rocket size={20} aria-hidden="true" /> Let’s go!
                </>
              ) : (
                <>
                  Next <ChevronRight size={20} aria-hidden="true" />
                </>
              )}
            </button>
            <button
              type="button"
              className={styles.pro}
              onClick={() => {
                setKids(false);
                setWelcomed(true);
              }}
            >
              I’m a grown-up scientist: show the Pro dashboard
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
