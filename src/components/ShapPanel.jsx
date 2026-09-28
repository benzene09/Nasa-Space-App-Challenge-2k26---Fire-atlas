import { BarChart, Bar, XAxis, YAxis, Cell, ReferenceLine, ResponsiveContainer, Tooltip } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { shapFor } from '../utils/models';
import RiskBadge from './RiskBadge';
import ChartTooltip from './ChartTooltip';
import styles from './ShapPanel.module.css';

/** F6 — "Why this rank": signed SHAP contributions as a horizontal bar chart. */
export default function ShapPanel({ material, conditions, rank }) {
  const shap = shapFor(material, conditions).sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  const topUp = shap.find((s) => s.value > 0);
  const topDown = shap.find((s) => s.value < 0);

  return (
    <aside className={styles.panel} aria-live="polite">
      <AnimatePresence mode="wait">
        <motion.div
          key={material.id}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.25 }}
        >
          <p className={styles.eyebrow}>
            <Sparkles size={14} aria-hidden="true" /> Why rank #{rank}
          </p>
          <div className={styles.head}>
            <h3>{material.name}</h3>
            <RiskBadge value={material.risk} />
          </div>

          <div className={styles.chart}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shap} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 4 }}>
                <XAxis type="number" domain={[-0.35, 0.35]} tickLine={false} axisLine={false} tickFormatter={(v) => (v > 0 ? `+${v}` : v)} />
                <YAxis type="category" dataKey="feature" width={118} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <ReferenceLine x={0} stroke="var(--border-strong)" />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} content={<ChartTooltip />} />
                <Bar dataKey="value" name="SHAP" radius={4} barSize={14} animationDuration={500}>
                  {shap.map((s) => (
                    <Cell key={s.feature} fill={s.value >= 0 ? '#ff6a2b' : '#3fd4ff'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className={styles.legend}>
            <span>
              <i className={styles.up} aria-hidden="true" /> Raises risk
            </span>
            <span>
              <i className={styles.down} aria-hidden="true" /> Lowers risk
            </span>
          </div>

          <p className={styles.summary}>
            {topUp && (
              <>
                <strong>{topUp.feature}</strong> pushes risk up the most (+{topUp.value.toFixed(2)}).{' '}
              </>
            )}
            {topDown && (
              <>
                <strong>{topDown.feature}</strong> pulls it down ({topDown.value.toFixed(2)}).{' '}
              </>
            )}
            {material.selfExtinguishes
              ? `Expected to self-extinguish below ${material.burnsAbove}% O₂.`
              : `Sustains flame spread above ${material.burnsAbove}% O₂ — current cabin is ${conditions.o2}%.`}
          </p>
          <p className={styles.source}>Evidence: {material.source}</p>
        </motion.div>
      </AnimatePresence>
    </aside>
  );
}
