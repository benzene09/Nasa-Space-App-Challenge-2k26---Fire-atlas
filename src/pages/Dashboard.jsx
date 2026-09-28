import MissionOverview from '../components/MissionOverview';
import FlameLab from '../components/FlameLab';
import SolarWatch from '../components/SolarWatch';
import EarthImpact from '../components/EarthImpact';
import MaterialRanker from '../components/MaterialRanker';
import GravityGapFiller from '../components/GravityGapFiller';
import FlameRadar from '../components/FlameRadar';
import FireGPT from '../components/FireGPT';
import GapMap from '../components/GapMap';
import SourcesPanel from '../components/SourcesPanel';
import Footer from '../components/Footer';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  return (
    <main id="main" className={styles.main}>
      <MissionOverview />
      <FlameLab />
      <SolarWatch />
      <EarthImpact />
      <MaterialRanker />
      <GravityGapFiller />
      <FlameRadar />
      <FireGPT />
      <GapMap />
      <SourcesPanel />
      <Footer />
    </main>
  );
}
