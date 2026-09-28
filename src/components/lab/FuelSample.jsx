import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useCursor } from '@react-three/drei';
import * as THREE from 'three';
import { anchorFor } from './sceneConfig';

const CHAR = new THREE.Color('#1c1512');

/** The thing being burned. It chars and shrinks as fuel is used up. Click to ignite. */
export default function FuelSample({ state, flame, onIgnite }) {
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);
  const mat = useRef();
  const mesh = useRef();
  const base = useMemo(() => new THREE.Color(flame.material.color), [flame.material.color]);
  const isDrop = flame.material.kind === 'droplet';

  useFrame((_, dt) => {
    if (!mat.current || !mesh.current) return;
    const burnt = 1 - state.fuel;
    mat.current.color.lerpColors(base, CHAR, isDrop ? 0 : Math.min(1, burnt * 1.3));
    mat.current.emissiveIntensity = THREE.MathUtils.damp(mat.current.emissiveIntensity, hovered ? 0.35 : state.status === 'burning' ? 0.2 : 0, 6, dt);
    const s = isDrop ? 0.35 + 0.65 * Math.cbrt(Math.max(state.fuel, 0.01)) : 1;
    mesh.current.scale.set(isDrop ? s : 0.45 + 0.55 * state.fuel, isDrop ? s : 1, isDrop ? s : 1);
  });

  const handleClick = (e) => {
    e.stopPropagation();
    onIgnite();
  };

  return (
    <mesh
      ref={mesh}
      position={isDrop ? anchorFor('droplet') : [0, 0.04, 0]}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {isDrop ? <sphereGeometry args={[0.12, 32, 32]} /> : <boxGeometry args={[0.7, 0.1, 0.45]} />}
      <meshStandardMaterial
        ref={mat}
        color={flame.material.color}
        emissive={isDrop ? '#ffb347' : '#ff8a3d'}
        emissiveIntensity={0}
        roughness={isDrop ? 0.1 : 0.85}
        metalness={0}
        transparent={isDrop}
        opacity={isDrop ? 0.9 : 1}
      />
    </mesh>
  );
}
