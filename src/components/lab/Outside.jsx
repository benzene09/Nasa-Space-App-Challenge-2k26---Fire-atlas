import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars, Sparkles } from '@react-three/drei';
import { MODULE, PLACE_LOOK } from './sceneConfig';

function Planet({ position, radius, color, glow, spin = 0.02 }) {
  const ref = useRef();
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += spin * dt;
  });
  return (
    <group position={position}>
      <mesh ref={ref}>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshStandardMaterial color={color} roughness={0.9} fog={false} emissive={color} emissiveIntensity={0.18} />
      </mesh>
      <mesh scale={1.06}>
        <sphereGeometry args={[radius, 48, 48]} />
        <meshBasicMaterial color={glow} transparent opacity={0.18} side={1} fog={false} depthWrite={false} />
      </mesh>
    </group>
  );
}

const ROCKS = Array.from({ length: 14 }, (_, i) => {
  const a = (i / 14) * Math.PI * 2 + i;
  const r = 6 + ((i * 37) % 11);
  return { pos: [Math.cos(a) * r, MODULE.floor - 0.05, Math.sin(a) * r], s: 0.25 + ((i * 13) % 7) * 0.08 };
});

/** What you see through the glass: Earth ground, orbit view, lunar or Martian surface. */
export default function Outside({ placeId }) {
  const look = PLACE_LOOK[placeId];
  return (
    <group>
      <color attach="background" args={[look.bg]} />
      <fog attach="fog" args={[look.bg, 16, 48]} />
      <hemisphereLight args={[look.sky, look.ground || '#000000', 0.45]} />
      {look.stars && <Stars radius={80} depth={40} count={2500} factor={3.5} saturation={0} fade speed={0.6} />}

      {look.ground && (
        <mesh position={[0, MODULE.floor - 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[60, 64]} />
          <meshStandardMaterial color={look.ground} roughness={1} />
        </mesh>
      )}

      {(placeId === 'moon' || placeId === 'mars') &&
        ROCKS.map((r, i) => (
          <mesh key={i} position={r.pos} scale={[r.s * 1.4, r.s * 0.7, r.s]}>
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color={placeId === 'moon' ? '#4a4b52' : '#6d2c15'} roughness={1} flatShading />
          </mesh>
        ))}

      {placeId === 'orbit' && <Planet position={[0, -30, -34]} radius={22} color="#2f6fdc" glow="#6fc3ff" spin={0.01} />}
      {placeId === 'moon' && <Planet position={[-14, 11, -34]} radius={2.2} color="#3b7be8" glow="#8fd0ff" />}
      {placeId === 'earth' && (
        <mesh position={[18, 16, -40]}>
          <sphereGeometry args={[2.4, 32, 32]} />
          <meshBasicMaterial color="#ffe9a8" fog={false} toneMapped={false} />
        </mesh>
      )}
      {placeId === 'mars' && <Sparkles count={120} scale={[30, 8, 30]} position={[0, 2, 0]} size={2} speed={0.3} color="#e4935f" opacity={0.5} />}
    </group>
  );
}
