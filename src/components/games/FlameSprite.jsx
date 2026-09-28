import { motion } from 'framer-motion';
import styles from './FlameSprite.module.css';

/**
 * Lightweight SVG flame that morphs with gravity: tall yellow teardrop at 1g,
 * round blue ball at 0g. Used in 2D mini-games.
 */
export default function FlameSprite({ gravity = 1, size = 1, lit = true, width = 90 }) {
  const g = Math.max(0, Math.min(1, gravity));
  const sg = Math.sqrt(g);
  const h = 38 + 52 * sg; // height
  const w = 34 - 6 * sg; // half-width
  const cy = 100 - h / 2;
  const tip = 100 - h;
  const blue = 1 - Math.min(1, sg * 1.15);
  const outer = blue > 0.6 ? '#4f7dff' : blue > 0.25 ? '#ff8a2a' : '#ff7a18';
  const inner = blue > 0.6 ? '#b8ccff' : '#ffe07a';
  const d = `M50 ${tip} C ${50 + w * 0.35} ${cy - h * 0.15}, ${50 + w} ${cy}, ${50 + w} ${cy + h * 0.2} A ${w} ${w * (0.7 + blue * 0.3)} 0 1 1 ${50 - w} ${cy + h * 0.2} C ${50 - w} ${cy}, ${50 - w * 0.35} ${cy - h * 0.15}, 50 ${tip} Z`;

  return (
    <svg viewBox="0 0 100 110" width={width} className={styles.svg} aria-hidden="true">
      <defs>
        <radialGradient id={`fg-${g}`} cx="50%" cy="75%" r="70%">
          <stop offset="0%" stopColor={inner} />
          <stop offset="55%" stopColor={outer} />
          <stop offset="100%" stopColor={outer} stopOpacity="0" />
        </radialGradient>
        <filter id="fs-glow">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      <ellipse cx="50" cy="104" rx="26" ry="4" fill="rgba(0,0,0,0.35)" />
      <motion.g
        style={{ originX: '50px', originY: '100px' }}
        animate={{ scale: lit ? size : 0, opacity: lit ? 1 : 0 }}
        transition={{ type: 'spring', stiffness: 160, damping: 16 }}
      >
        <path d={d} fill={outer} opacity="0.5" filter="url(#fs-glow)" className={styles.flicker} />
        <path d={d} fill={`url(#fg-${g})`} className={styles.flicker} />
      </motion.g>
    </svg>
  );
}
