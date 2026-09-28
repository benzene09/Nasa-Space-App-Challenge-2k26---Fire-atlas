import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const N = 160;
const dummy = new THREE.Object3D();

/** Solar energetic protons spiral down into the polar "cusps" (radiation storm). */
export default function ProtonRain({ liveRef }) {
  const mesh = useRef();
  const seeds = useMemo(
    () => Array.from({ length: N }, (_, i) => ({ pole: i % 2 ? 1 : -1, a: Math.random() * Math.PI * 2, p: Math.random(), sp: 0.4 + Math.random() * 0.6 })),
    [],
  );

  useFrame((_, dt) => {
    const L = liveRef.current;
    const active = Math.round(N * Math.min(1, L.proton * 1.4));
    seeds.forEach((s, i) => {
      if (i >= active) {
        dummy.scale.setScalar(0);
      } else {
        s.p = (s.p + dt * s.sp * 0.5) % 1;
        const r = 3.2 * (1 - s.p) + 1.05;
        const spin = s.a + s.p * 12;
        const rad = 0.15 + (1 - s.p) * 1.2;
        dummy.position.set(Math.cos(spin) * rad - 0.4 * (1 - s.p), s.pole * r, Math.sin(spin) * rad);
        dummy.scale.setScalar(0.03);
      }
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[null, null, N]} frustumCulled={false}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color="#9ff7ff" toneMapped={false} />
    </instancedMesh>
  );
}
