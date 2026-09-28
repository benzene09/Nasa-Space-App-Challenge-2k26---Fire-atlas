import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { vis, SUN_POS } from './earthConfig';

const N = 240;
const dummy = new THREE.Object3D();

/** The CME: a growing cloud of magnetized plasma travelling from the Sun to Earth. */
export default function CMECloud({ liveRef, hit }) {
  const mesh = useRef();
  const seeds = useMemo(() => Array.from({ length: N }, () => ({ d: new THREE.Vector3().randomDirection(), r: Math.cbrt(Math.random()) })), []);
  const offZ = hit >= 1 ? 0 : hit > 0 ? 3.2 : 9;

  useFrame(() => {
    const L = liveRef.current;
    const c = L.cme;
    const end = -vis(L.rmp) - 0.4;
    for (let i = 0; i < N; i++) {
      if (c < 0 || c > 1.4) {
        dummy.scale.setScalar(0);
      } else {
        const s = seeds[i];
        const x = SUN_POS[0] + 3 + (end - SUN_POS[0] - 3) * Math.min(c, 1) + Math.max(0, c - 1) * 6;
        const radius = 0.8 + Math.min(c, 1) * 4.2;
        const fade = c > 1 ? 1 - (c - 1) / 0.4 : 1;
        dummy.position.set(x + s.d.x * radius * 0.45 * s.r, s.d.y * radius * s.r, offZ * Math.min(c, 1) + s.d.z * radius * s.r);
        dummy.scale.setScalar((0.18 + Math.min(c, 1) * 0.35) * fade);
      }
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[null, null, N]} frustumCulled={false}>
      <icosahedronGeometry args={[1, 1]} />
      <meshBasicMaterial color="#ff7a45" transparent opacity={0.16} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
    </instancedMesh>
  );
}
