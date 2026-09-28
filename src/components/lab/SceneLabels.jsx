import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { anchorFor } from './sceneConfig';
import styles from './SceneLabels.module.css';

/** Fire-triangle labels floating in the 3D scene. */
export default function SceneLabels({ state, flame, liveRef }) {
  const heat = useRef();
  const air = useRef();
  const anchor = anchorFor(flame.material.kind);
  const burning = state.status === 'burning';

  useFrame(() => {
    const live = liveRef.current;
    if (heat.current) heat.current.position.set(live.radius + 0.55, live.center[1] + 0.2, 0);
    if (air.current) air.current.position.set(0, live.top + 1.9, 0);
  });

  if (!state.labels) return null;

  return (
    <>
      <Html position={[-0.95, anchor[1] - 0.05, 0.2]} center distanceFactor={8} className={styles.anchor} zIndexRange={[16, 0]}>
        <span className={`${styles.label} ${styles.fuel}`}>
          <i /> Fuel: {flame.material.name}
        </span>
      </Html>
      <Html position={[-2.2, 1.9, 0.6]} center distanceFactor={8} className={styles.anchor} zIndexRange={[16, 0]}>
        <span className={`${styles.label} ${styles.oxygen}`}>
          <i /> Oxygen (O₂) · {state.o2}%
        </span>
      </Html>
      {burning && (
        <group ref={heat}>
          <Html center distanceFactor={8} className={styles.anchor} zIndexRange={[16, 0]}>
            <span className={`${styles.label} ${styles.heat}`}>
              <i /> Heat
            </span>
          </Html>
        </group>
      )}
      {burning && (
        <group ref={air}>
          <Html center distanceFactor={8} className={styles.anchor} zIndexRange={[16, 0]}>
            <span className={`${styles.label} ${styles.neutral}`}>{state.gravity > 0.02 ? 'Hot air rises ↑' : 'No "up" in space'}</span>
          </Html>
        </group>
      )}
    </>
  );
}
