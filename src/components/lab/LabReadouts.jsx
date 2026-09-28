import { Flame, Fuel, BellRing, Bell, Shapes, Wind } from 'lucide-react';
import { dangerLevel } from '../../utils/labPhysics';
import styles from './LabReadouts.module.css';

/** Kid-readable live gauges under the 3D scene. */
export default function LabReadouts({ state, flame }) {
  const burning = state.status === 'burning';
  const danger = dangerLevel(flame.size, burning);

  return (
    <div className={styles.row}>
      <div className={styles.card}>
        <p className={styles.label}>
          <Flame size={14} aria-hidden="true" /> Fire size
        </p>
        <p className={`${styles.value} ${styles[danger.tone]}`}>{danger.label}</p>
        <div className={styles.meter} role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={danger.pct} aria-label="Fire size">
          <span className={styles[`bar_${danger.tone}`]} style={{ width: `${danger.pct}%` }} />
        </div>
      </div>

      <div className={styles.card}>
        <p className={styles.label}>
          <Fuel size={14} aria-hidden="true" /> Fuel left
        </p>
        <p className={`${styles.value} mono`}>{Math.round(state.fuel * 100)}%</p>
        <div className={styles.meter} role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(state.fuel * 100)} aria-label="Fuel left">
          <span className={styles.bar_fuel} style={{ width: `${state.fuel * 100}%` }} />
        </div>
      </div>

      <div className={`${styles.card} ${state.alarm ? styles.alarmOn : ''}`}>
        <p className={styles.label}>{state.alarm ? <BellRing size={14} aria-hidden="true" /> : <Bell size={14} aria-hidden="true" />} Smoke alarm</p>
        <p className={styles.value}>{state.alarm ? 'BEEPING!' : 'Quiet'}</p>
        <p className={styles.sub}>
          {burning && !state.alarm && state.gravity < 0.02 ? "Smoke isn't rising to it!" : state.alarm ? 'Smoke reached the ceiling' : 'Watching the ceiling'}
        </p>
      </div>

      <div className={styles.card}>
        <p className={styles.label}>
          <Shapes size={14} aria-hidden="true" /> Flame shape
        </p>
        <p className={styles.value}>{flame.shape}</p>
        <p className={styles.sub}>{flame.colorName}</p>
      </div>

      <div className={styles.card}>
        <p className={styles.label}>
          <Wind size={14} aria-hidden="true" /> Fresh oxygen
        </p>
        <p className={styles.value}>{flame.oxygenSpeed}</p>
        <p className={styles.sub}>Smoke goes: {flame.smokeGoes.toLowerCase()}</p>
      </div>
    </div>
  );
}
