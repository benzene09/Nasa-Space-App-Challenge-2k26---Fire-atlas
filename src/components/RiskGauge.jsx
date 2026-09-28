import { motion } from 'framer-motion';
import { useAnimatedNumber } from '../hooks/useAnimatedNumber';
import { riskLevel } from '../utils/models';
import styles from './RiskGauge.module.css';

const R = 88;
const ARC = Math.PI * R; // semicircle length

/** F4 — animated semicircular live risk gauge (0–100). */
export default function RiskGauge({ value, label: labelOverride, tone: toneOverride }) {
  const shown = useAnimatedNumber(value);
  const level = riskLevel(value / 100);
  const label = labelOverride || `${level.label} risk`;
  const tone = toneOverride || level.tone;

  return (
    <div className={styles.gauge} role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} aria-label={`Risk ${value} of 100, ${label}`}>
      <svg viewBox="0 0 220 128" className={styles.svg} aria-hidden="true">
        <defs>
          <linearGradient id="gauge-grad" x1="0" x2="1">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="45%" stopColor="#facc15" />
            <stop offset="75%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#f43f5e" />
          </linearGradient>
          <filter id="gauge-glow">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path d={`M 22 110 A ${R} ${R} 0 0 1 198 110`} fill="none" stroke="var(--surface-3)" strokeWidth="14" strokeLinecap="round" />
        <motion.path
          d={`M 22 110 A ${R} ${R} 0 0 1 198 110`}
          fill="none"
          stroke="url(#gauge-grad)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={ARC}
          initial={{ strokeDashoffset: ARC }}
          animate={{ strokeDashoffset: ARC * (1 - value / 100) }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          filter="url(#gauge-glow)"
        />
        {[0, 25, 50, 75, 100].map((t) => {
          const a = Math.PI * (1 - t / 100);
          return <circle key={t} cx={110 + (R + 16) * Math.cos(a)} cy={110 - (R + 16) * Math.sin(a)} r="1.6" fill="var(--text-dim)" />;
        })}
      </svg>
      <div className={styles.readout}>
        <span className={`${styles.value} mono`}>{Math.round(shown)}</span>
        <span className={`${styles.label} ${styles[tone]}`}>{label}</span>
      </div>
    </div>
  );
}
