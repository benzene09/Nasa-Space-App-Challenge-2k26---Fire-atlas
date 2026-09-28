import styles from './ChartTooltip.module.css';

/** Shared dark tooltip for Recharts. */
export default function ChartTooltip({ active, payload, label, unit = '', labelFormatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tip}>
      <p className={styles.label}>{labelFormatter ? labelFormatter(label) : label}</p>
      {payload.map((p) => {
        const v = Array.isArray(p.value) ? `${p.value[0]} – ${p.value[1]}` : p.value;
        return (
          <p key={p.dataKey} className={styles.row}>
            <span className={styles.swatch} style={{ background: p.color || p.fill }} aria-hidden="true" />
            <span>{p.name}</span>
            <strong className="mono">
              {v}
              {unit}
            </strong>
          </p>
        );
      })}
    </div>
  );
}
