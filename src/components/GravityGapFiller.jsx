import { useEffect, useMemo, useState } from 'react';
import { ComposedChart, Area, Line, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ReferenceArea, ResponsiveContainer } from 'recharts';
import { Orbit } from 'lucide-react';
import { useMission } from '../hooks/useMission';
import { MATERIALS } from '../utils/data';
import { gravityCurve, gravityObservations, predictAt } from '../utils/models';
import Panel from './Panel';
import { useKids } from '../hooks/useKids';
import ModeTabs from './game/ModeTabs';
import GravityGuess from './games/GravityGuess';
import ChartTooltip from './ChartTooltip';
import styles from './GravityGapFiller.module.css';

const PRESETS = [
  { label: 'Orbit', g: 0 },
  { label: 'Moon', g: 0.16 },
  { label: 'Mars', g: 0.38 },
  { label: 'Earth', g: 1 },
];

/** F3 + F7 — gravity slider with Gaussian-Process mean and uncertainty band. */
export default function GravityGapFiller() {
  const { kids } = useKids();
  const [mode, setMode] = useState(kids ? 'play' : 'explore');
  useEffect(() => setMode(kids ? 'play' : 'explore'), [kids]);
  const { phase } = useMission();
  const [materialId, setMaterialId] = useState('nomex');
  const [g, setG] = useState(phase.gravity);

  // Follow the mission phase's gravity when the phase changes.
  useEffect(() => setG(phase.gravity), [phase.gravity]);

  const material = MATERIALS.find((m) => m.id === materialId);
  const curve = useMemo(() => gravityCurve(material), [material]);
  const obs = useMemo(() => gravityObservations(material), [material]);
  const yMax = useMemo(() => Math.ceil(Math.max(...curve.map((c) => c.band[1]), ...obs.map((o) => o.obs)) * 1.1 * 2) / 2, [curve, obs]);
  const pred = predictAt(material, g);
  const halfBand = (pred.band[1] - pred.band[0]) / 2;
  const confidence = Math.max(0, Math.round(100 - (halfBand / pred.mean) * 100));

  return (
    <Panel
      id="gravity"
      icon={Orbit}
      eyebrow="Gaussian Process · PSI-26 BASS, PSI-69 FLEX"
      title="Gravity Gap-Filler"
      description="Experiments exist near 0g and at 1g, almost none at Moon (0.16g) or Mars (0.38g). Slide gravity to see the predicted flame-spread rate and how uncertain it is."
      actions={
        <div className="panel-actions">
          <ModeTabs id="gravity" mode={mode} onChange={setMode} playLabel="Guess" />
          {mode === 'explore' && (
            <label className={styles.select}>
              <span className="sr-only">Material</span>
              <select value={materialId} onChange={(e) => setMaterialId(e.target.value)}>
                {MATERIALS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      }
    >
      {mode === 'play' ? (
        <GravityGuess />
      ) : (
        <>
          <div className={styles.layout}>
            <div className={styles.controls}>
              <label htmlFor="g-slider" className={styles.sliderLabel}>
                <span>Gravity level</span>
                <span className="mono">{g.toFixed(2)} g</span>
              </label>
              <input
                id="g-slider"
                type="range"
                className="range"
                min="0"
                max="1"
                step="0.01"
                value={g}
                onChange={(e) => setG(Number(e.target.value))}
                style={{ '--fill': `${g * 100}%` }}
                aria-valuetext={`${g.toFixed(2)} g`}
              />
              <div className={styles.presets}>
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    className={`${styles.preset} ${Math.abs(g - p.g) < 0.005 ? styles.presetOn : ''}`}
                    onClick={() => setG(p.g)}
                  >
                    {p.label}
                    <span className="mono">{p.g}g</span>
                  </button>
                ))}
              </div>

              <dl className={styles.readout}>
                <div>
                  <dt>Predicted spread</dt>
                  <dd className="mono">
                    {pred.mean.toFixed(2)}
                    <small> mm/s</small>
                  </dd>
                </div>
                <div>
                  <dt>95% band</dt>
                  <dd className="mono">
                    ±{halfBand.toFixed(2)}
                    <small> mm/s</small>
                  </dd>
                </div>
                <div>
                  <dt>Confidence</dt>
                  <dd className="mono">
                    {confidence}
                    <small>%</small>
                  </dd>
                  <div className={styles.bar} aria-hidden="true">
                    <span style={{ width: `${confidence}%` }} />
                  </div>
                </div>
              </dl>
            </div>

            <div className={styles.chart} role="img" aria-label={`Flame spread prediction curve for ${material.name} from 0 to 1 g with uncertainty band`}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={curve} margin={{ top: 12, right: 12, left: 0, bottom: 8 }}>
                  <defs>
                    <linearGradient id="band-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3fd4ff" stopOpacity="0.32" />
                      <stop offset="100%" stopColor="#3fd4ff" stopOpacity="0.08" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
                  <ReferenceArea
                    x1={0.1}
                    x2={0.9}
                    fill="rgba(167,139,250,0.05)"
                    label={{ value: 'no test data', position: 'insideTop', fill: '#6b7690', fontSize: 11 }}
                  />
                  <XAxis
                    dataKey="g"
                    type="number"
                    domain={[0, 1]}
                    ticks={[0, 0.16, 0.38, 0.5, 0.75, 1]}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}g`}
                  />
                  <YAxis type="number" domain={[0, yMax]} allowDataOverflow tickLine={false} axisLine={false} width={48} tickFormatter={(v) => v.toFixed(1)} />
                  <Tooltip content={<ChartTooltip unit=" mm/s" labelFormatter={(l) => `${l} g`} />} />
                  <Area dataKey="band" name="95% band" stroke="none" fill="url(#band-grad)" isAnimationActive animationDuration={600} />
                  <Line dataKey="mean" name="GP mean" stroke="#3fd4ff" strokeWidth={2.5} dot={false} animationDuration={600} />
                  <Scatter data={obs} dataKey="obs" name="Observed" fill="#ffb23f" isAnimationActive={false} />
                  <ReferenceLine x={0.16} stroke="rgba(255,255,255,0.18)" strokeDasharray="3 4" />
                  <ReferenceLine x={0.38} stroke="rgba(255,255,255,0.18)" strokeDasharray="3 4" />
                  <ReferenceLine x={g} stroke="#ff6a2b" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
              <div className={styles.legend}>
                <span>
                  <i className={styles.lMean} aria-hidden="true" /> GP mean
                </span>
                <span>
                  <i className={styles.lBand} aria-hidden="true" /> 95% uncertainty
                </span>
                <span>
                  <i className={styles.lObs} aria-hidden="true" /> Observed tests
                </span>
                <span>
                  <i className={styles.lCur} aria-hidden="true" /> Selected gravity
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </Panel>
  );
}
