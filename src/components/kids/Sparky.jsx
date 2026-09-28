import { motion } from 'framer-motion';

/** Sparky: FlameAtlas's original robot-firefighter mascot, drawn in SVG. */
export default function Sparky({ size = 96, mood = 'happy', wave = false }) {
  return (
    <motion.svg
      viewBox="0 0 120 130"
      width={size}
      height={(size * 130) / 120}
      aria-hidden="true"
      animate={{ y: [0, -5, 0] }}
      transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
    >
      <defs>
        <linearGradient id="sp-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#cfd8ee" />
        </linearGradient>
        <linearGradient id="sp-flame" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#ff6a2b" />
          <stop offset="1" stopColor="#ffd23f" />
        </linearGradient>
        <radialGradient id="sp-visor" cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor="#4fe0ff" />
          <stop offset="1" stopColor="#1a3f8f" />
        </radialGradient>
      </defs>
      {/* Antenna flame */}
      <motion.path
        d="M60 6 C66 14 70 18 66 26 C64 30 56 30 54 26 C50 18 56 14 60 6 Z"
        fill="url(#sp-flame)"
        animate={{ scaleY: [1, 1.15, 1] }}
        style={{ originX: '60px', originY: '28px' }}
        transition={{ duration: 0.5, repeat: Infinity }}
      />
      <rect x="57" y="26" width="6" height="10" rx="3" fill="#8a96b8" />
      {/* Head */}
      <rect x="22" y="34" width="76" height="56" rx="26" fill="url(#sp-body)" stroke="#8a96b8" strokeWidth="2" />
      <rect x="31" y="44" width="58" height="36" rx="18" fill="url(#sp-visor)" />
      {/* Eyes */}
      {mood === 'happy' ? (
        <>
          <path d="M44 62 q6 -8 12 0" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M64 62 q6 -8 12 0" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="50" cy="61" r="5" fill="#fff" />
          <circle cx="70" cy="61" r="5" fill="#fff" />
        </>
      )}
      <path d="M52 71 q8 6 16 0" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="36" cy="72" r="4" fill="#ff8fa3" opacity="0.7" />
      <circle cx="84" cy="72" r="4" fill="#ff8fa3" opacity="0.7" />
      {/* Body */}
      <rect x="36" y="92" width="48" height="30" rx="14" fill="url(#sp-body)" stroke="#8a96b8" strokeWidth="2" />
      <circle cx="60" cy="106" r="7" fill="#ff6a2b" />
      <path d="M57 106 l3 -5 l3 5 l-3 3 z" fill="#ffd23f" />
      {/* Arms */}
      <rect x="20" y="96" width="16" height="9" rx="4.5" fill="#cfd8ee" stroke="#8a96b8" strokeWidth="2" />
      <motion.g
        style={{ originX: '86px', originY: '100px' }}
        animate={wave ? { rotate: [0, -35, 0, -35, 0] } : { rotate: 0 }}
        transition={{ duration: 1.2, repeat: wave ? Infinity : 0, repeatDelay: 1 }}
      >
        <rect x="84" y="96" width="16" height="9" rx="4.5" fill="#cfd8ee" stroke="#8a96b8" strokeWidth="2" />
      </motion.g>
    </motion.svg>
  );
}
