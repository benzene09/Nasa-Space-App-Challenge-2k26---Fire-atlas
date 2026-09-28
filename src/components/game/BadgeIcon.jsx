import {
  Rocket,
  Gauge,
  Flame,
  Orbit,
  BellRing,
  SprayCan,
  ScanEye,
  Wind,
  Moon,
  Search,
  Target,
  Radar,
  GraduationCap,
  Map as MapIcon,
  Lock,
  Sun,
  Sparkles,
} from 'lucide-react';

const ICONS = { Rocket, Gauge, Flame, Orbit, BellRing, SprayCan, ScanEye, Wind, Moon, Search, Target, Radar, GraduationCap, Map: MapIcon, Lock, Sun, Sparkles };

export default function BadgeIcon({ name, size = 20 }) {
  const Icon = ICONS[name] || Flame;
  return <Icon size={size} aria-hidden="true" />;
}
