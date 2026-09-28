import { CheckCircle2, Circle } from 'lucide-react';
import { useGame } from '../../hooks/useGame';
import { BADGES } from '../../utils/gameData';
import BadgeIcon from '../game/BadgeIcon';
import styles from './LabChallenges.module.css';

const LAB = BADGES.filter((b) => b.section === 'lab');

/** Checklist of Flame Lab challenges (each one is a badge). */
export default function LabChallenges() {
  const { badges } = useGame();
  const done = LAB.filter((b) => badges.has(b.id)).length;
  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <h3>Lab challenges</h3>
        <span className="mono">
          {done}/{LAB.length}
        </span>
      </div>
      <div className={styles.bar} aria-hidden="true">
        <span style={{ width: `${(done / LAB.length) * 100}%` }} />
      </div>
      <ul className={styles.list}>
        {LAB.map((b) => {
          const on = badges.has(b.id);
          return (
            <li key={b.id} className={on ? styles.on : ''}>
              <span className={styles.icon}>
                <BadgeIcon name={b.icon} size={16} />
              </span>
              <span className={styles.text}>
                <strong>{b.name}</strong>
                <small>{b.desc}</small>
              </span>
              {on ? <CheckCircle2 size={18} className={styles.check} aria-label="Done" /> : <Circle size={18} className={styles.todo} aria-label="Not yet" />}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
