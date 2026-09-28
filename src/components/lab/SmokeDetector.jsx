import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { DETECTOR_POS } from './sceneConfig';
import styles from './SceneLabels.module.css';

/** Ceiling smoke alarm: blinks red and shows BEEP! when smoke reaches it. */
export default function SmokeDetector({ alarm, showLabel }) {
  const led = useRef();
  const ring = useRef();

  useFrame(() => {
    const t = performance.now() / 1000;
    const on = alarm && Math.sin(t * 12) > 0;
    if (led.current) {
      led.current.color.set(alarm ? (on ? '#ff2d4a' : '#551018') : '#34d399');
      led.current.emissive.set(alarm ? '#ff2d4a' : '#34d399');
      led.current.emissiveIntensity = alarm ? (on ? 4 : 0.2) : 1.2;
    }
    if (ring.current) {
      const p = (t * 1.5) % 1;
      ring.current.scale.setScalar(alarm ? 1 + p * 2.5 : 0.001);
      ring.current.material.opacity = alarm ? 0.6 * (1 - p) : 0;
    }
  });

  return (
    <group position={DETECTOR_POS}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.28, 0.3, 0.1, 32]} />
        <meshStandardMaterial color="#e9edf5" roughness={0.5} />
      </mesh>
      <mesh position={[0, -0.06, 0.12]}>
        <sphereGeometry args={[0.035, 16, 16]} />
        <meshStandardMaterial ref={led} toneMapped={false} />
      </mesh>
      <mesh ref={ring} position={[0, -0.08, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.34, 48]} />
        <meshBasicMaterial color="#ff2d4a" transparent opacity={0} toneMapped={false} side={2} />
      </mesh>
      {(alarm || showLabel) && (
        <Html position={[0, -0.45, 0]} center distanceFactor={8} className={styles.anchor} zIndexRange={[16, 0]}>
          <span className={`${styles.label} ${alarm ? styles.red : styles.neutral}`}>{alarm ? 'BEEP! BEEP!' : 'Smoke alarm'}</span>
        </Html>
      )}
    </group>
  );
}
