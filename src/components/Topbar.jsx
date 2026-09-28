import { Flame } from 'lucide-react';
import PhaseSelector from './PhaseSelector';
import GameHUD from './game/GameHUD';
import ModeSwitch from './kids/ModeSwitch';
import { useKids } from '../hooks/useKids';
import logo from '../assets/logo.svg';
import styles from './Topbar.module.css';

export default function Topbar() {
  const { kids } = useKids();
  return (
    <header className={styles.topbar}>
      <a href="#overview" className={styles.mobileBrand} aria-label="FlameAtlas home">
        <img src={logo} alt="" width="30" height="30" />
        <strong className={styles.brandText}>FlameAtlas</strong>
      </a>
      <div className={styles.title}>
        <Flame size={16} aria-hidden="true" />
        <span>{kids ? 'Where are we?' : 'Mission phase'}</span>
      </div>
      <PhaseSelector />
      <GameHUD />
      <ModeSwitch />
    </header>
  );
}
