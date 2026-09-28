import { Baby, FlaskConical, Volume2, VolumeX } from 'lucide-react';
import { useKids } from '../../hooks/useKids';
import styles from './ModeSwitch.module.css';

/** Kids / Pro switch and sound toggle for the top bar. */
export default function ModeSwitch() {
  const { kids, setKids, sound, setSound } = useKids();
  return (
    <div className={styles.wrap}>
      <div className={styles.switch} role="radiogroup" aria-label="Dashboard mode">
        <button type="button" role="radio" aria-checked={kids} className={kids ? styles.on : ''} onClick={() => setKids(true)}>
          <Baby size={16} aria-hidden="true" /> <span>Kids</span>
        </button>
        <button type="button" role="radio" aria-checked={!kids} className={!kids ? styles.on : ''} onClick={() => setKids(false)}>
          <FlaskConical size={16} aria-hidden="true" /> <span>Pro</span>
        </button>
      </div>
      <button
        type="button"
        className={styles.sound}
        onClick={() => setSound(!sound)}
        aria-label={sound ? 'Turn sounds off' : 'Turn sounds on'}
        aria-pressed={sound}
      >
        {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
      </button>
    </div>
  );
}
