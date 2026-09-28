import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { SUN, EARTH, MOON, MARS, CRAFT } from './solarConfig';
import styles from './Solar.module.css';

function Orbit({ radius }) {
  return (
    <mesh position={SUN} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius, 0.008, 6, 160]} />
      <meshBasicMaterial color="#3a4a6a" transparent opacity={0.5} />
    </mesh>
  );
}

function Body({ position, radius, color, label, glow, spin = 0.2 }) {
  const ref = useRef();
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * spin;
  });
  return (
    <group position={position}>
      <mesh ref={ref}>
        <sphereGeometry args={[radius, 48, 48]} />
        <meshStandardMaterial color={color} roughness={0.8} emissive={color} emissiveIntensity={0.08} />
      </mesh>
      {glow && (
        <mesh scale={1.12}>
          <sphereGeometry args={[radius, 32, 32]} />
          <meshBasicMaterial color={glow} transparent opacity={0.22} side={THREE.BackSide} depthWrite={false} />
        </mesh>
      )}
      <Html zIndexRange={[16, 0]} position={[0, -radius - 0.28, 0]} center distanceFactor={14} style={{ pointerEvents: 'none' }}>
        <span className={styles.planetLabel}>{label}</span>
      </Html>
    </group>
  );
}

/** Earth (with magnetic shield), Moon, Mars and the crew's spacecraft for the chosen phase. */
export default function Planets({ phaseId, phaseName, hitRef, sheltered }) {
  const craft = useRef();
  const shield = useRef();
  const bubble = useRef();
  const magnet = useRef();

  useFrame((_, dt) => {
    const t = performance.now() / 1000;
    const hit = hitRef.current;
    if (craft.current) {
      craft.current.rotation.y += dt * 1.5;
      craft.current.rotation.x += dt * 0.7;
      const m = craft.current.material;
      m.emissive.setRGB(1, 0.75 - hit * 0.7, 0.2 - hit * 0.2);
      m.emissiveIntensity = 1.2 + hit * (2 + Math.sin(t * 25) * 1.5);
    }
    if (bubble.current) {
      bubble.current.visible = sheltered;
      bubble.current.material.opacity = 0.18 + hit * 0.3;
    }
    if (magnet.current) magnet.current.material.opacity = phaseId === 'iss' ? 0.07 + hit * 0.3 : 0.015;
    if (shield.current) shield.current.rotation.x += dt * 0.1;
  });

  return (
    <>
      <Orbit radius={EARTH[0] - SUN[0]} />
      <Orbit radius={Math.hypot(MARS[0] - SUN[0], MARS[2] - SUN[2])} />
      <Body position={EARTH} radius={0.45} color="#2f6fdc" glow="#6fc3ff" label="Earth" />
      {/* Magnetosphere: stretched away from the Sun */}
      <group position={[EARTH[0] + 0.2, EARTH[1], EARTH[2]]} ref={shield}>
        <mesh ref={magnet} scale={[1.7, 1, 1]}>
          <sphereGeometry args={[0.72, 40, 40]} />
          <meshBasicMaterial color="#3fd4ff" transparent opacity={0.08} side={THREE.FrontSide} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      </group>
      <Body position={MOON} radius={0.15} color="#b9bcc7" label="Moon" spin={0.05} />
      <Body position={MARS} radius={0.32} color="#c1502a" glow="#ff9a66" label="Mars" />

      <group position={CRAFT[phaseId]}>
        <mesh ref={craft}>
          <octahedronGeometry args={[0.09, 0]} />
          <meshStandardMaterial color="#ffe08a" emissive="#ffb23f" emissiveIntensity={1.2} toneMapped={false} />
        </mesh>
        <mesh ref={bubble} visible={false}>
          <sphereGeometry args={[0.28, 32, 32]} />
          <meshBasicMaterial color="#34d399" transparent opacity={0.2} depthWrite={false} toneMapped={false} />
        </mesh>
        <Html zIndexRange={[16, 0]} position={[0, 0.3, 0]} center distanceFactor={14} style={{ pointerEvents: 'none' }}>
          <span className={styles.craftLabel}>Crew · {phaseName}</span>
        </Html>
      </group>
    </>
  );
}
