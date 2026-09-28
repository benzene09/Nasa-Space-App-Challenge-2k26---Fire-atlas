import { riskLevel } from '../utils/models';
import styles from './RiskBadge.module.css';

/** Color-coded risk badge — always pairs color with a text label. */
export default function RiskBadge({ value, showValue = true }) {
  const { label, tone } = riskLevel(value);
  return (
    <span className={`${styles.badge} ${styles[tone]}`}>
      <span className={styles.dot} aria-hidden="true" />
      {label}
      {showValue && <span className={`${styles.value} mono`}>{Math.round(value * 100)}</span>}
    </span>
  );
}
