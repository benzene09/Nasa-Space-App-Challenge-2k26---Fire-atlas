import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

const UP = [
  [-0.55, 0],
  [0.55, 0.2],
  [0, -0.5],
  [0.1, 0.5],
];
const RADIAL = Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2);

const setOpacity = (obj, o) =>
  obj.traverse((m) => {
    if (m.material) m.material.opacity = o;
  });

function Arrow({ color }) {
  return (
    <group>
      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.32, 8]} />
        <meshBasicMaterial color={color} transparent toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.38, 0]}>
        <coneGeometry args={[0.08, 0.16, 12]} />
        <meshBasicMaterial color={color} transparent toneMapped={false} />
      </mesh>
    </group>
  );
}

/** Teaching arrows: hot air rising (gravity) or spreading evenly (0g). */
export default function ConvectionArrows({ visible, gravity, liveRef }) {
  const upRefs = useRef([]);
  const radRefs = useRef([]);

  useFrame(() => {
    const t = performance.now() / 1000;
    const live = liveRef.current;
    const show = visible && live.intensity > 0.3;
    const rising = gravity > 0.02;

    upRefs.current.forEach((g, i) => {
      if (!g) return;
      g.visible = show && rising;
      if (!g.visible) return;
      const p = (t * (0.35 + Math.sqrt(gravity) * 0.5) + i * 0.25) % 1;
      g.position.set(UP[i][0], live.top - 0.2 + p * 1.6, UP[i][1]);
      setOpacity(g, Math.sin(p * Math.PI) * 0.9);
    });
    radRefs.current.forEach((g, i) => {
      if (!g) return;
      g.visible = show && !rising;
      if (!g.visible) return;
      const p = (t * 0.18 + (i % 2) * 0.5) % 1;
      const a = RADIAL[i];
      const r = live.radius + 0.25 + p * 0.9;
      g.position.set(live.center[0] + Math.cos(a) * r, live.center[1] + Math.sin(a) * r, 0);
      g.rotation.set(0, 0, a - Math.PI / 2);
      setOpacity(g, Math.sin(p * Math.PI) * 0.8);
    });
  });

  return (
    <>
      {UP.map((_, i) => (
        <group key={`u${i}`} ref={(el) => (upRefs.current[i] = el)} visible={false}>
          <Arrow color="#ffb23f" />
        </group>
      ))}
      {RADIAL.map((_, i) => (
        <group key={`r${i}`} ref={(el) => (radRefs.current[i] = el)} visible={false} scale={0.7}>
          <Arrow color="#9fb8ff" />
        </group>
      ))}
    </>
  );
}
