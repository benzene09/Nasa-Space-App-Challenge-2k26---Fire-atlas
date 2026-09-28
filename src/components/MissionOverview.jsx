import { motion } from 'framer-motion';
import { Wind, Gauge as GaugeIcon, ArrowDownToLine, RadioTower } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useMission } from '../hooks/useMission';
import { cabinRisk, rankMaterials } from '../utils/models';
import RiskGauge from './RiskGauge';
import StatCard from './StatCard';
import RiskBadge from './RiskBadge';
import ChartTooltip from './ChartTooltip';
import MissionMap from './games/MissionMap';
import { useKids } from '../hooks/useKids';
import styles from './MissionOverview.module.css';

export default function MissionOverview() {
  const { phase, phases, conditions } = useMission();
  const { kids } = useKids();
  const floaty = phase.gravity === 0 ? 'Everything floats!' : phase.gravity < 0.2 ? 'Super bouncy jumps' : 'Light and bouncy';
  const risk = cabinRisk(conditions);
  const top = rankMaterials(conditions).slice(0, 3);

  const byPhase = phases.map((p) => ({
    name: p.name,
    id: p.id,
    risk: cabinRisk({ o2: p.o2, pressure: p.pressure, gravity: p.gravity }),
  }));

  return (
    <section id="overview" className={styles.overview} aria-labelledby="overview-title">
      <motion.div
        className={styles.hero}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className={styles.kicker}>{kids ? 'A space science adventure' : 'NASA Space Apps 2026 · Flame in Freefall'}</p>
        {kids ? (
          <h1 id="overview-title" className={styles.h1}>
            Can fire burn in space? Let’s find out on <span className={styles.accent}>{phase.name}</span>!
          </h1>
        ) : (
          <h1 id="overview-title" className={styles.h1}>
            Fire risk for <span className={styles.accent}>{phase.name}</span>, ranked and explained.
          </h1>
        )}
        <p className={styles.lede}>
          {kids
            ? 'Pick a place at the top of the screen. Everything on this page changes to match it. Scroll down to play games and earn badges!'
            : `${phase.note} Every panel below re-ranks when you change the mission phase.`}
        </p>
      </motion.div>

      <div className={styles.grid}>
        <div className={styles.gaugeCard}>
          <p className={styles.cardLabel}>{kids ? 'Fire danger meter' : 'Live cabin fire risk'}</p>
          <RiskGauge value={risk} />
          <div className={styles.topList}>
            <p className={styles.cardLabel}>{kids ? 'Burns the easiest here' : 'Top risk materials'}</p>
            <ul>
              {top.map((m) => (
                <li key={m.id}>
                  <span>{m.name}</span>
                  <RiskBadge value={m.risk} />
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className={styles.stats}>
          <StatCard
            icon={ArrowDownToLine}
            label={kids ? 'How heavy you feel' : 'Gravity'}
            value={kids ? (phase.gravity === 0 ? 'Weightless' : `${Math.round(phase.gravity * 100)}%`) : phase.gravity === 0 ? '0' : phase.gravity.toFixed(2)}
            unit={kids ? '' : 'g'}
            hint={kids ? (phase.gravity === 0 ? floaty : `${floaty} (Earth = 100%)`) : phase.gravity === 0 ? 'Microgravity' : 'Partial gravity'}
          />
          <StatCard
            icon={Wind}
            label={kids ? 'Oxygen in the air' : 'Oxygen'}
            value={phase.o2}
            unit="%"
            hint={
              kids
                ? phase.o2 > 21
                  ? 'Extra oxygen: fires get hungry!'
                  : 'Same as Earth air'
                : phase.o2 > 21
                  ? `${(phase.o2 - 21).toFixed(1)} pts above ISS`
                  : 'Sea-level air'
            }
            accent="flame"
          />
          <StatCard
            icon={GaugeIcon}
            label={kids ? 'Air squeeze' : 'Cabin pressure'}
            value={kids ? `${Math.round((phase.pressure / 14.7) * 100)}%` : phase.pressure}
            unit={kids ? '' : 'psi'}
            hint={kids ? 'Compared with air on Earth' : `${(phase.pressure / 14.7).toFixed(2)} atm`}
          />
          <StatCard
            icon={RadioTower}
            label={kids ? 'Message to Earth takes' : 'Earth comm delay'}
            value={phase.commDelay}
            hint={
              phase.id === 'mars' || phase.id === 'transit'
                ? kids
                  ? 'Astronauts must solve problems alone!'
                  : 'Crew must act alone'
                : kids
                  ? 'Mission Control can help fast'
                  : 'Ground support available'
            }
            accent="violet"
          />

          {!kids && (
            <div className={styles.phaseChart}>
              <p className={styles.cardLabel}>Risk across mission phases</p>
              <div className={styles.chartBox}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byPhase} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tickLine={false} axisLine={false} interval={0} tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} content={<ChartTooltip unit="/100" />} />
                    <Bar dataKey="risk" name="Risk" radius={[6, 6, 0, 0]} animationDuration={700}>
                      {byPhase.map((p) => (
                        <Cell key={p.id} fill={p.id === phase.id ? 'url(#bar-flame)' : '#1e2944'} />
                      ))}
                    </Bar>
                    <defs>
                      <linearGradient id="bar-flame" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ffb23f" />
                        <stop offset="100%" stopColor="#ff6a2b" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>

      <MissionMap />
    </section>
  );
}
