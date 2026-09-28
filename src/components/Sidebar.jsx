import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Gauge, FlaskConical, Sun, Globe2, Layers, Orbit, Radar, MessageSquareText, Map as MapIcon, Database } from 'lucide-react';
import logo from '../assets/logo.svg';
import { useKids } from '../hooks/useKids';
import { KID_SECTIONS } from '../utils/kidText';
import styles from './Sidebar.module.css';

export const NAV_ITEMS = [
  { id: 'overview', label: 'Mission overview', icon: Gauge },
  { id: 'lab', label: 'Flame Lab 3D', icon: FlaskConical },
  { id: 'solar', label: 'Solar Flare Watch', icon: Sun },
  { id: 'earth', label: 'Solar Storm vs Earth', icon: Globe2 },
  { id: 'ranker', label: 'Material Risk Ranker', icon: Layers },
  { id: 'gravity', label: 'Gravity Gap-Filler', icon: Orbit },
  { id: 'radar', label: 'Invisible Flame Radar', icon: Radar },
  { id: 'firegpt', label: 'FireGPT', icon: MessageSquareText },
  { id: 'gaps', label: 'Research Gap Map', icon: MapIcon },
  { id: 'sources', label: 'Data sources', icon: Database },
];

/** Tracks which section is in view to highlight the active nav item. */
function useActiveSection(ids) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-30% 0px -60% 0px' },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [ids]);
  return active;
}

const ids = NAV_ITEMS.map((n) => n.id);

export default function Sidebar() {
  const active = useActiveSection(ids);
  const { kids } = useKids();

  return (
    <aside className={styles.sidebar} aria-label="Primary">
      <a href="#overview" className={styles.brand}>
        <img src={logo} alt="" width="34" height="34" />
        <span>
          <strong>FlameAtlas</strong>
          <small>{kids ? 'Fire in space adventure' : 'Fire safety · Moon & Mars'}</small>
        </span>
      </a>

      <nav className={styles.nav}>
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <a key={id} href={`#${id}`} className={`${styles.link} ${active === id ? styles.active : ''}`} aria-current={active === id ? 'true' : undefined}>
            {active === id && <motion.span layoutId="nav-pill" className={styles.pill} transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
            <Icon size={18} aria-hidden="true" />
            <span>{kids ? KID_SECTIONS[id]?.nav || label : label}</span>
          </a>
        ))}
      </nav>

      <div className={styles.footer}>
        <span className={styles.status} aria-hidden="true" />
        <div>
          <p>{kids ? 'Space School' : 'Demo mode'}</p>
          <small>{kids ? 'Learn, play, earn badges' : 'Dummy data · models simulated'}</small>
        </div>
      </div>
    </aside>
  );
}
