import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle } from 'lucide-react';
import { useKids } from '../../hooks/useKids';
import { KID_SECTIONS } from '../../utils/kidText';
import Sparky from './Sparky';
import styles from './Guide.module.css';

const IDS = Object.keys(KID_SECTIONS);

/** Sparky floats in the corner and gives a tip for whichever section you are looking at. */
export default function Guide() {
  const { kids } = useKids();
  const [active, setActive] = useState('overview');
  const [open, setOpen] = useState(true);

  // Track the section nearest the upper-middle of the screen (reliable while scrolling fast).
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const mark = window.innerHeight * 0.4;
      let best = IDS[0];
      IDS.forEach((id) => {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= mark) best = id;
      });
      setActive((prev) => {
        if (prev !== best) setOpen(true);
        return best;
      });
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const id = setTimeout(() => setOpen(false), 9000);
    return () => clearTimeout(id);
  }, [open, active]);

  if (!kids) return null;
  const tip = KID_SECTIONS[active]?.tip;

  return (
    <div className={styles.guide}>
      <AnimatePresence mode="wait">
        {open && tip && (
          <motion.div
            key={active}
            className={styles.bubble}
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
            role="status"
          >
            <button type="button" className={styles.close} onClick={() => setOpen(false)} aria-label="Hide tip">
              <X size={14} />
            </button>
            <strong>Sparky says:</strong>
            <p>{tip}</p>
          </motion.div>
        )}
      </AnimatePresence>
      <button type="button" className={styles.bot} onClick={() => setOpen((o) => !o)} aria-label={open ? 'Hide Sparky’s tip' : 'Show Sparky’s tip'}>
        <Sparky size={72} wave={open} />
        {!open && (
          <span className={styles.ping}>
            <MessageCircle size={14} aria-hidden="true" />
          </span>
        )}
      </button>
    </div>
  );
}
