import { useEffect } from 'react';
import { MissionProvider } from './hooks/useMission';
import { GameProvider } from './hooks/useGame';
import { KidsProvider } from './hooks/useKids';
import Guide from './components/kids/Guide';
import Welcome from './components/kids/Welcome';
import GameToasts from './components/game/GameToasts';
import BadgeDrawer from './components/game/BadgeDrawer';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './pages/Dashboard';
import styles from './App.module.css';

export default function App() {
  // Warm up the 3D scenes in the background so games open instantly.
  useEffect(() => {
    const id = setTimeout(() => {
      import('./components/lab/LabScene');
      import('./components/solar/SolarScene');
      import('./components/earth/EarthScene');
      import('./components/games/BurnRaceScene');
    }, 2500);
    return () => clearTimeout(id);
  }, []);

  return (
    <KidsProvider>
      <GameProvider>
        <MissionProvider>
          <a href="#main" className={styles.skip}>
            Skip to content
          </a>
          <div className="starfield" aria-hidden="true" />
          <Sidebar />
          <div className={styles.shell}>
            <Topbar />
            <Dashboard />
          </div>
          <GameToasts />
          <BadgeDrawer />
          <Guide />
          <Welcome />
        </MissionProvider>
      </GameProvider>
    </KidsProvider>
  );
}
