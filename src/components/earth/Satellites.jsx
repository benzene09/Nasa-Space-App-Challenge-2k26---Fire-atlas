import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { vis, GEO_RE, GPS_RE } from './earthConfig';
import styles from './Earth.module.css';

const OK = new THREE.Color('#34d399');
const WARN = new THREE.Color('#ffb23f');
const BAD = new THREE.Color('#f43f5e');

const GROUPS = [
  { id: 'iss', label: 'ISS', r: 1.14, n: 1, speed: 0.9, tilt: 0.9, size: 0.05 },
  { id: 'gps', label: 'GPS', r: vis(GPS_RE), n: 3, speed: 0.22, tilt: 0.95, size: 0.055 },
  { id: 'geo', label: 'GEO', r: vis(GEO_RE), n: 5, speed: 0.08, tilt: 0, size: 0.065 },
];

function Ring({ r, tilt }) {
  return (
    <mesh rotation={[Math.PI / 2 + tilt * 0.3, 0, 0]}>
      <torusGeometry args={[r, 0.006, 6, 128]} />
      <meshBasicMaterial color="#5b6b90" transparent opacity={0.35} />
    </mesh>
  );
}

/** Satellites change color when the storm threatens them. */
export default function Satellites({ liveRef, impact }) {
  const refs = useRef({});

  useFrame(() => {
    const L = liveRef.current;
    const t = performance.now() / 1000;
    GROUPS.forEach((g) => {
      let status = OK;
      if (g.id === 'geo' && L.rmp < GEO_RE) status = BAD;
      else if (g.id === 'gps' && L.kp >= 7) status = L.kp >= 8.5 ? BAD : WARN;
      else if (g.id === 'iss' && L.proton * 5 >= 2) status = impact.S >= 4 ? BAD : WARN;
      else if (g.id === 'geo' && L.proton * 5 >= 3) status = WARN;
      for (let i = 0; i < g.n; i++) {
        const m = refs.current[`${g.id}${i}`];
        if (!m) continue;
        const a = t * g.speed + (i / g.n) * Math.PI * 2;
        const v = new THREE.Vector3(Math.cos(a) * g.r, 0, Math.sin(a) * g.r).applyAxisAngle(new THREE.Vector3(1, 0, 0), g.tilt * 0.3);
        m.position.copy(v);
        m.material.color.copy(status);
        m.material.emissive.copy(status);
        m.material.emissiveIntensity = status === OK ? 0.8 : 1.5 + Math.sin(t * 12) * 0.8;
      }
    });
  });

  return (
    <group>
      {GROUPS.map((g) => (
        <group key={g.id}>
          <Ring r={g.r} tilt={g.tilt} />
          {Array.from({ length: g.n }, (_, i) => (
            <mesh key={i} ref={(el) => (refs.current[`${g.id}${i}`] = el)}>
              <boxGeometry args={[g.size, g.size, g.size * 2.2]} />
              <meshStandardMaterial toneMapped={false} />
            </mesh>
          ))}
          {g.id !== 'iss' && (
            <Html zIndexRange={[16, 0]} position={[0, 0.12, g.r]} center distanceFactor={12} style={{ pointerEvents: 'none' }}>
              <span className={styles.orbitLabel}>{g.label} orbit</span>
            </Html>
          )}
        </group>
      ))}
    </group>
  );
}
