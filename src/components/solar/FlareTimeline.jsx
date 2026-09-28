import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer, LabelList, CartesianGrid } from 'recharts';
import { CLASS_COLORS, fmtTime } from '../../utils/spaceWeather';
import styles from './FlareTimeline.module.css';

const LETTERS = { 1: 'B', 2: 'C', 3: 'M', 4: 'X' };

function Tip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const f = payload[0].payload;
  return (
    <div className={styles.tip}>
      <strong className="mono">{f.classType}</strong> flare
      <span>{fmtTime(f.peak)}</span>
      <span>
        {f.location} · AR {f.region || '—'}
      </span>
      <span>
        {f.hasCME ? 'CME ' : ''}
        {f.hasSEP ? '· particle storm' : ''}
      </span>
      <em>Click to simulate</em>
    </div>
  );
}

/** 30-day flare timeline from DONKI. Bar height = X-ray class (log scale). */
export default function FlareTimeline({ flares, selectedId, onSelect }) {
  const data = flares.map((f) => ({ ...f, label: f.peak.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' }) }));
  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <p>Last 30 days of flares · tap a bar to replay it</p>
        <ul className={styles.legend} aria-label="Flare classes">
          {['C', 'M', 'X'].map((l) => (
            <li key={l}>
              <i style={{ background: CLASS_COLORS[l] }} /> {l}-class
            </li>
          ))}
          <li>
            <span className={styles.sep}>SEP</span> particle storm
          </li>
        </ul>
      </div>
      <div className={styles.chart}>
        {data.length === 0 ? (
          <p className={styles.empty}>No flares in this window. The Sun is quiet!</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 18, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={16} />
              <YAxis domain={[1.5, 5]} ticks={[2, 3, 4]} tickFormatter={(v) => LETTERS[v]} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} content={<Tip />} />
              <Bar dataKey="level" radius={[5, 5, 0, 0]} onClick={(d) => onSelect(d.id)} cursor="pointer" isAnimationActive animationDuration={700}>
                {data.map((f) => (
                  <Cell
                    key={f.id}
                    fill={CLASS_COLORS[f.letter] || '#34d399'}
                    stroke={f.id === selectedId ? '#fff' : 'none'}
                    strokeWidth={2}
                    fillOpacity={f.id === selectedId ? 1 : 0.75}
                  />
                ))}
                <LabelList
                  dataKey="hasSEP"
                  content={({ x, y, width, value }) =>
                    value ? (
                      <text x={x + width / 2} y={y - 5} textAnchor="middle" fontSize="9" fill="#8ff0ff" fontFamily="JetBrains Mono">
                        SEP
                      </text>
                    ) : null
                  }
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
