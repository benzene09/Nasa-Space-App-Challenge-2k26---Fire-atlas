import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MODULE } from './sceneConfig';

const PROPS = [
  { id: 'pen', home: [-2.1, MODULE.floor + 0.04, 1.2], float: [-1.9, 1.6, 1.1], geo: 'pen', color: '#4c6ef5' },
  { id: 'snack', home: [-1.6, MODULE.floor + 0.12, -1.8], float: [-1.3, 2.4, -1.5], geo: 'box', color: '#34d399' },
  { id: 'ball', home: [2.3, MODULE.floor + 0.14, -1.2], float: [1.9, 2.1, -1.1], geo: 'ball', color: '#facc15' },
];

/** Everyday items: they rest on the floor with gravity and float around in 0g. */
export default function FloatingProps({ gravity }) {
  const refs = useRef([]);
  useFrame((_, dt) => {
    const t = performance.now() / 1000;
    const weightless = gravity < 0.02;
    PROPS.forEach((p, i) => {
      const m = refs.current[i];
      if (!m) return;
      const target = weightless
        ? [p.float[0] + Math.sin(t * 0.4 + i) * 0.3, p.float[1] + Math.sin(t * 0.6 + i * 2) * 0.25, p.float[2] + Math.cos(t * 0.5 + i) * 0.3]
        : p.home;
      // Heavier gravity = faster fall.
      const k = weightless ? 0.8 : 1.5 + gravity * 5;
      m.position.x = THREE.MathUtils.damp(m.position.x, target[0], k, dt);
      m.position.y = THREE.MathUtils.damp(m.position.y, target[1], k, dt);
      m.position.z = THREE.MathUtils.damp(m.position.z, target[2], k, dt);
      if (weightless) {
        m.rotation.x += dt * 0.4 * (i + 1) * 0.5;
        m.rotation.z += dt * 0.3;
      } else {
        m.rotation.x = THREE.MathUtils.damp(m.rotation.x, p.geo === 'pen' ? Math.PI / 2 : 0, 4, dt);
        m.rotation.z = THREE.MathUtils.damp(m.rotation.z, 0, 4, dt);
      }
    });
  });

  return PROPS.map((p, i) => (
    <mesh key={p.id} ref={(el) => (refs.current[i] = el)} position={p.home}>
      {p.geo === 'pen' && <cylinderGeometry args={[0.035, 0.035, 0.5, 12]} />}
      {p.geo === 'box' && <boxGeometry args={[0.35, 0.22, 0.25]} />}
      {p.geo === 'ball' && <sphereGeometry args={[0.14, 24, 24]} />}
      <meshStandardMaterial color={p.color} roughness={0.5} />
    </mesh>
  ));
}
