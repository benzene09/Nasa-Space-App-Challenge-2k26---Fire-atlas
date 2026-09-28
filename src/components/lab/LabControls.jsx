import { Globe2, Satellite, Moon, Mountain, Flame, SprayCan, RotateCcw, ScanEye, Tags } from 'lucide-react';
import { PLACES, LAB_MATERIALS } from '../../utils/labPhysics';
import styles from './LabControls.module.css';

const PLACE_ICONS = { earth: Globe2, orbit: Satellite, moon: Moon, mars: Mountain };

function Switch({ label, icon: Icon, checked, onChange, hint }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`${styles.switch} ${checked ? styles.switchOn : ''}`}
      onClick={() => onChange(!checked)}
    >
      <Icon size={18} aria-hidden="true" />
      <span className={styles.switchText}>
        <strong>{label}</strong>
        {hint && <small>{hint}</small>}
      </span>
      <span className={styles.track} aria-hidden="true">
        <span className={styles.thumb} />
      </span>
    </button>
  );
}

/** Big, friendly controls for the Flame Lab. */
export default function LabControls({ state, flame, actions }) {
  const burning = state.status === 'burning';

  return (
    <div className={styles.controls}>
      <section aria-labelledby="lab-place">
        <h3 id="lab-place" className={styles.h}>
          <span className={styles.step}>1</span> Where is the fire?
        </h3>
        <div className={styles.places}>
          {PLACES.map((p) => {
            const Icon = PLACE_ICONS[p.id];
            const on = state.placeId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={on}
                className={`${styles.place} ${styles[`place_${p.id}`]} ${on ? styles.placeOn : ''}`}
                onClick={() => actions.setPlace(p.id)}
              >
                <Icon size={22} aria-hidden="true" />
                <span className={styles.placeName}>{p.name}</span>
                <span className={`${styles.placeMeta} mono`}>
                  {p.gravity}g · {p.o2}% O₂
                </span>
              </button>
            );
          })}
        </div>

        <label className={styles.sliderRow} htmlFor="lab-gravity">
          <span>Gravity strength</span>
          <span className="mono">{state.gravity.toFixed(2)} g</span>
        </label>
        <input
          id="lab-gravity"
          type="range"
          className="range"
          min="0"
          max="1"
          step="0.01"
          value={state.gravity}
          onChange={(e) => actions.setGravity(Number(e.target.value))}
          style={{ '--fill': `${state.gravity * 100}%` }}
          aria-valuetext={`${state.gravity.toFixed(2)} g`}
        />
        <div className={styles.ticks} aria-hidden="true">
          <span>Space 0</span>
          <span style={{ left: '16%' }}>Moon</span>
          <span style={{ left: '38%' }}>Mars</span>
          <span>Earth 1</span>
        </div>
      </section>

      <section aria-labelledby="lab-o2">
        <label id="lab-o2" htmlFor="lab-o2-range" className={styles.h}>
          <span className={styles.step}>2</span> How much oxygen?
          <span className={`${styles.big} mono`}>{state.o2}%</span>
        </label>
        <input
          id="lab-o2-range"
          type="range"
          className={`range ${styles.o2range}`}
          min="10"
          max="40"
          step="1"
          value={state.o2}
          onChange={(e) => actions.setO2(Number(e.target.value))}
          style={{ '--fill': `${((state.o2 - 10) / 30) * 100}%` }}
          aria-valuetext={`${state.o2} percent oxygen`}
        />
        <div className={styles.o2marks} aria-hidden="true">
          <span style={{ left: `${((21 - 10) / 30) * 100}%` }}>Earth air 21%</span>
          <span style={{ left: `${((34 - 10) / 30) * 100}%` }}>Moon base 34%</span>
        </div>
        <p className={styles.hint}>More oxygen = a hungrier fire. Too little and the fire can't breathe.</p>
      </section>

      <section aria-labelledby="lab-mat">
        <h3 id="lab-mat" className={styles.h}>
          <span className={styles.step}>3</span> What's burning?
        </h3>
        <div className={styles.materials}>
          {LAB_MATERIALS.map((m) => (
            <button
              key={m.id}
              type="button"
              aria-pressed={state.materialId === m.id}
              className={`${styles.mat} ${state.materialId === m.id ? styles.matOn : ''}`}
              onClick={() => actions.setMaterial(m.id)}
            >
              <span className={styles.swatch} style={{ background: m.color, borderRadius: m.kind === 'droplet' ? '50%' : 4 }} aria-hidden="true" />
              {m.name}
            </button>
          ))}
        </div>
        <p className={styles.fact}>{flame.material.fact}</p>
      </section>

      <section aria-labelledby="lab-go">
        <h3 id="lab-go" className={styles.h}>
          <span className={styles.step}>4</span> Experiment!
        </h3>
        <div className={styles.actions}>
          <button type="button" className={`${styles.btn} ${styles.ignite}`} onClick={actions.ignite} disabled={burning || state.status === 'extinguishing'}>
            <Flame size={20} aria-hidden="true" /> Light it!
          </button>
          <button type="button" className={`${styles.btn} ${styles.sprayBtn}`} onClick={actions.spray} disabled={state.spraying}>
            <SprayCan size={20} aria-hidden="true" /> Spray
          </button>
          <button type="button" className={`${styles.btn} ${styles.ghost}`} onClick={actions.reset} aria-label="Reset sample">
            <RotateCcw size={18} aria-hidden="true" />
          </button>
        </div>
        <div className={styles.switches}>
          <Switch label="Heat vision" hint="See invisible heat" icon={ScanEye} checked={state.heatVision} onChange={(v) => actions.toggle('heatVision', v)} />
          <Switch label="Labels & arrows" hint="Explain the scene" icon={Tags} checked={state.labels} onChange={(v) => actions.toggle('labels', v)} />
        </div>
      </section>
    </div>
  );
}
