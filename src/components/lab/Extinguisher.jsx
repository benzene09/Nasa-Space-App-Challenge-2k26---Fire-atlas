import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useCursor, Html } from '@react-three/drei';
import * as THREE from 'three';
import { MODULE, NOZZLE_POS } from './sceneConfig';
import styles from './SceneLabels.module.css';

/** Clickable CO₂ fire extinguisher standing on the floor. */
export default function Extinguisher({ spraying, onSpray, showLabel }) {
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);
  const group = useRef();

  useFrame((_, dt) => {
    if (!group.current) return;
    const s = hovered ? 1.08 : 1;
    const shake = spraying ? Math.sin(performance.now() / 25) * 0.012 : 0;
    group.current.scale.setScalar(THREE.MathUtils.damp(group.current.scale.x, s, 10, dt));
    group.current.rotation.z = shake;
  });

  const baseY = MODULE.floor;
  return (
    <group
      ref={group}
      position={[1.95, baseY, 0.95]}
      onClick={(e) => {
        e.stopPropagation();
        onSpray();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      <mesh position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.17, 0.17, 0.8, 32]} />
        <meshStandardMaterial color="#e3263b" roughness={0.35} metalness={0.2} emissive="#ff2244" emissiveIntensity={hovered ? 0.35 : 0.05} />
      </mesh>
      <mesh position={[0, 0.83, 0]}>
        <sphereGeometry args={[0.17, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#e3263b" roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.98, 0]}>
        <cylinderGeometry args={[0.05, 0.06, 0.14, 16]} />
        <meshStandardMaterial color="#2b2f3a" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Label band */}
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.172, 0.172, 0.18, 32]} />
        <meshStandardMaterial color="#f5f5f5" roughness={0.6} />
      </mesh>
      {/* Hose + nozzle aimed at the flame */}
      <mesh position={[NOZZLE_POS[0] - 1.95 + 0.17, NOZZLE_POS[1] - baseY - 0.02, NOZZLE_POS[2] - 0.95 + 0.08]} rotation={[0, Math.PI / 5, Math.PI / 2.3]}>
        <cylinderGeometry args={[0.035, 0.05, 0.36, 12]} />
        <meshStandardMaterial color="#1c1f27" metalness={0.5} roughness={0.4} />
      </mesh>
      {(hovered || showLabel) && !spraying && (
        <Html position={[0.1, 1.35, 0]} center distanceFactor={8} className={styles.anchor} zIndexRange={[16, 0]}>
          <span className={`${styles.label} ${styles.red}`}>Click to spray!</span>
        </Html>
      )}
    </group>
  );
}
