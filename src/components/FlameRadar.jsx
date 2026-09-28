import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Radar, EyeOff, Flame, CircleSlash } from 'lucide-react';
import { useMission } from '../hooks/useMission';
import { FUELS, DILUENTS } from '../utils/data';
import { regimeAt, O2_AXIS, ATM_AXIS } from '../utils/models';
import Panel from './Panel';
import { useKids } from '../hooks/useKids';
import ModeTabs from './game/ModeTabs';
import RadarHunt from './games/RadarHunt';
import styles from './FlameRadar.module.css';

const REGIMES = {
  hot: { label: 'Visible hot flame', icon: Flame },
  cool: { label: 'Invisible cool flame', icon: EyeOff },
  extinct: { label: 'Extinguished', icon: CircleSlash },
};

const nearest = (arr, v) => arr.reduce((best, x) => (Math.abs(x - v) < Math.abs(best - v) ? x : best), arr[0]);

/** F12 — burning-regime map (random-forest classifier stand-in) over O₂ × pressure. */
export default function FlameRadar() {
  const { kids } = useKids();
  const [mode, setMode] = useState(kids ? 'play' : 'explore');
  useEffect(() => setMode(kids ? 'play' : 'explore'), [kids]);
  const { phase } = useMission();
  const [fuel, setFuel] = useState('heptane');
  const [diluent, setDiluent] = useState('n2');
  const [hover, setHover] = useState(null);

  const cabinAtm = phase.pressure / 14.7;
  const markO2 = nearest(O2_AXIS, phase.o2);
  const markAtm = nearest(ATM_AXIS, cabinAtm);

  const grid = useMemo(() => ATM_AXIS.map((atm) => O2_AXIS.map((o2) => ({ o2, atm, regime: regimeAt(o2, atm, fuel, diluent) }))), [fuel, diluent]);
  const cabinRegime = regimeAt(phase.o2, cabinAtm, fuel, diluent);
  const coolShare = Math.round((grid.flat().filter((c) => c.regime === 'cool').length / grid.flat().length) * 100);
  const info = hover || { o2: phase.o2, atm: +cabinAtm.toFixed(2), regime: cabinRegime, cabin: true };
  const InfoIcon = REGIMES[info.regime].icon;
  const fuelObj = FUELS.find((f) => f.id === fuel);

  return (
    <Panel
      id="radar"
      icon={Radar}
      eyebrow="Random-forest regime classifier · PSI-69, PSI-159, PSI-117"
      title="Invisible Flame Radar"
      description="Cool flames burn at low temperature and give off almost no light. Pick a fuel and atmosphere to see where they can persist unseen after the visible flame goes out."
      actions={<ModeTabs id="radar" mode={mode} onChange={setMode} playLabel="Hunt" />}
    >
      {mode === 'play' ? (
        <RadarHunt />
      ) : (
        <>
          <div className={styles.controls}>
            <div role="group" aria-label="Fuel" className={styles.group}>
              <span className={styles.groupLabel}>Fuel</span>
              {FUELS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={fuel === f.id}
                  className={`${styles.seg} ${fuel === f.id ? styles.segOn : ''}`}
                  onClick={() => setFuel(f.id)}
                >
                  {f.name}
                </button>
              ))}
            </div>
            <div role="group" aria-label="Atmosphere diluent" className={styles.group}>
              <span className={styles.groupLabel}>Atmosphere</span>
              {DILUENTS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  aria-pressed={diluent === d.id}
                  className={`${styles.seg} ${diluent === d.id ? styles.segOn : ''}`}
                  onClick={() => setDiluent(d.id)}
                >
                  {d.name}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.layout}>
            <div className={styles.mapWrap}>
              <span className={styles.yTitle}>Pressure (atm)</span>
              <div className={styles.map} onMouseLeave={() => setHover(null)}>
                {grid.map((row, ri) => (
                  <div className={styles.row} key={ATM_AXIS[ri]}>
                    <span className={`${styles.yTick} mono`}>{ATM_AXIS[ri].toFixed(2)}</span>
                    {row.map((c, ci) => {
                      const isCabin = c.o2 === markO2 && c.atm === markAtm;
                      return (
                        <motion.button
                          type="button"
                          key={`${c.o2}-${c.atm}`}
                          className={`${styles.cell} ${styles[c.regime]} ${isCabin ? styles.cabin : ''}`}
                          initial={false}
                          animate={{ opacity: 1 }}
                          transition={{ delay: (ri + ci) * 0.012 }}
                          onMouseEnter={() => setHover(c)}
                          onFocus={() => setHover(c)}
                          onBlur={() => setHover(null)}
                          aria-label={`${c.o2}% oxygen, ${c.atm} atm: ${REGIMES[c.regime].label}${isCabin ? ' (current cabin)' : ''}`}
                        >
                          {isCabin && <span className={styles.pulse} aria-hidden="true" />}
                        </motion.button>
                      );
                    })}
                  </div>
                ))}
                <div className={styles.row}>
                  <span className={styles.yTick} />
                  {O2_AXIS.map((o2) => (
                    <span key={o2} className={`${styles.xTick} mono`}>
                      {o2}
                    </span>
                  ))}
                </div>
                <p className={styles.xTitle}>Oxygen (%)</p>
              </div>
            </div>

            <div className={styles.side}>
              <div className={`${styles.info} ${styles[`info_${info.regime}`]}`} aria-live="polite">
                <p className={styles.infoEyebrow}>{info.cabin ? `Current cabin · ${phase.name}` : 'Hovered condition'}</p>
                <p className={styles.infoRegime}>
                  <InfoIcon size={20} aria-hidden="true" /> {REGIMES[info.regime].label}
                </p>
                <p className={`${styles.infoCond} mono`}>
                  {info.o2}% O₂ · {info.atm} atm · {fuelObj.name}
                </p>
                {info.regime === 'cool' && <p className={styles.warn}>Crew may think the fire is out. Keep suppression active and monitor CO/aldehydes.</p>}
              </div>

              <ul className={styles.legend}>
                {Object.entries(REGIMES).map(([k, r]) => {
                  const Icon = r.icon;
                  return (
                    <li key={k}>
                      <span className={`${styles.swatch} ${styles[k]}`} aria-hidden="true" />
                      <Icon size={14} aria-hidden="true" />
                      {r.label}
                    </li>
                  );
                })}
              </ul>

              <div className={styles.metric}>
                <span className="mono">{coolShare}%</span>
                <p>of mapped conditions support a hidden cool flame for {fuelObj.name}.</p>
              </div>
              <p className={styles.source}>Training data: {fuelObj.source}</p>
            </div>
          </div>
        </>
      )}
    </Panel>
  );
}
