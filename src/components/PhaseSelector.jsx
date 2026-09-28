import { motion } from 'framer-motion';
import { Satellite, Orbit, Moon, Rocket, Globe2 } from 'lucide-react';
import { useMission } from '../hooks/useMission';
import styles from './PhaseSelector.module.css';

const ICONS = { iss: Satellite, gateway: Orbit, moon: Moon, transit: Rocket, mars: Globe2 };

/** F2 — segmented mission-phase control. Arrow keys move between phases. */
export default function PhaseSelector() {
  const { phases, phase, setPhaseId } = useMission();

  const onKeyDown = (e) => {
    const i = phases.findIndex((p) => p.id === phase.id);
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const next = phases[(i + (e.key === 'ArrowRight' ? 1 : phases.length - 1)) % phases.length];
      setPhaseId(next.id);
      document.getElementById(`phase-${next.id}`)?.focus();
    }
  };

  return (
    <div className={styles.wrap} role="radiogroup" aria-label="Mission phase" onKeyDown={onKeyDown}>
      {phases.map((p) => {
        const Icon = ICONS[p.id];
        const selected = p.id === phase.id;
        return (
          <button
            key={p.id}
            id={`phase-${p.id}`}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            className={`${styles.option} ${selected ? styles.selected : ''}`}
            onClick={() => setPhaseId(p.id)}
          >
            {selected && <motion.span layoutId="phase-pill" className={styles.pill} transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
            <Icon size={16} aria-hidden="true" />
            <span className={styles.label}>{p.name}</span>
          </button>
        );
      })}
    </div>
  );
}
