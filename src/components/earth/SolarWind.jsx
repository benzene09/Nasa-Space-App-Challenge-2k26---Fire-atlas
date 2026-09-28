import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { vis } from './earthConfig';

const N = 600;
const X0 = -24;
const X1 = 14;
const dummy = new THREE.Object3D();
const warm = new THREE.Color('#ffd27a');
const hot = new THREE.Color('#ff6a2b');

/** Solar-wind particles streaming from the Sun and flowing around the bow shock. */
export default function SolarWind({ liveRef }) {
  const mesh = useRef();
  const sim = useMemo(() => {
    const p = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const r = Math.sqrt(Math.random()) * 8;
      const a = Math.random() * Math.PI * 2;
      p.set([X0 + Math.random() * (X1 - X0), Math.cos(a) * r, Math.sin(a) * r], i * 3);
    }
    return p;
  }, []);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const L = liveRef.current;
    const B = vis(L.rmp * 1.3);
    const speed = 3 + (L.speed / 400) * 3;
    for (let i = 0; i < N; i++) {
      const k = i * 3;
      let x = sim[k] + speed * dt;
      let y = sim[k + 1];
      let z = sim[k + 2];
      if (x > X1) {
        x = X0;
        const r = Math.sqrt(Math.random()) * 8;
        const a = Math.random() * Math.PI * 2;
        y = Math.cos(a) * r;
        z = Math.sin(a) * r;
      }
      // Deflect around the paraboloid bow shock x = −B + ρ²/(1.8B).
      const rho = Math.hypot(y, z) || 0.001;
      const xb = -B + (rho * rho) / (1.8 * B);
      if (x > xb && rho < 3 * B) {
        const target = Math.sqrt(Math.max(0, (x + B) * 1.8 * B)) + 0.03;
        const s = target / rho;
        y *= s;
        z *= s;
      }
      sim[k] = x;
      sim[k + 1] = y;
      sim[k + 2] = z;
      dummy.position.set(x, y, z);
      dummy.scale.set(0.12 + L.storm * 0.08, 0.025, 0.025);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
    mesh.current.material.color.lerpColors(warm, hot, Math.max(L.storm, L.cme > 0 && L.cme < 1.2 ? 0.5 : 0));
  });

  return (
    <instancedMesh ref={mesh} args={[null, null, N]} frustumCulled={false}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color="#ffd27a" transparent opacity={0.7} toneMapped={false} />
    </instancedMesh>
  );
}
