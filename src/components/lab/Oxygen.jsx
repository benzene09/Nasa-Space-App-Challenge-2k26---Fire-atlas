import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MODULE } from './sceneConfig';

const MAX = 120;
const dummy = new THREE.Object3D();
const axis = new THREE.Vector3();

function randomInModule(out, i, onWall = false) {
  const a = Math.random() * Math.PI * 2;
  const r = onWall ? MODULE.radius - 0.4 : Math.sqrt(Math.random()) * (MODULE.radius - 0.4);
  out[i * 3] = Math.cos(a) * r;
  out[i * 3 + 1] = MODULE.floor + 0.3 + Math.random() * (MODULE.ceiling - MODULE.floor - 0.6);
  out[i * 3 + 2] = Math.sin(a) * r;
}

/**
 * O₂ molecules (two joined atoms). The count follows the oxygen %. While the fire burns
 * they are pulled in and "eaten": fast with gravity (convection), slowly in 0g (diffusion).
 */
export default function Oxygen({ state, flame, liveRef }) {
  const a = useRef();
  const b = useRef();
  const sim = useMemo(() => {
    const pos = new Float32Array(MAX * 3);
    const vel = new Float32Array(MAX * 3);
    const axes = new Float32Array(MAX * 3);
    for (let i = 0; i < MAX; i++) {
      randomInModule(pos, i);
      const v = new THREE.Vector3().randomDirection();
      axes.set([v.x, v.y, v.z], i * 3);
    }
    return { pos, vel, axes };
  }, []);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const t = performance.now() / 1000;
    const live = liveRef.current;
    const active = Math.round((MAX * state.o2) / 40);
    const { pos, vel, axes } = sim;
    const pull = flame.flow * 1.4 * live.intensity;

    for (let i = 0; i < MAX; i++) {
      const k = i * 3;
      if (i >= active) {
        dummy.scale.setScalar(0);
        dummy.updateMatrix();
        a.current.setMatrixAt(i, dummy.matrix);
        b.current.setMatrixAt(i, dummy.matrix);
        continue;
      }
      vel[k] += (Math.random() - 0.5) * 0.5 * dt;
      vel[k + 1] += (Math.random() - 0.5) * 0.5 * dt;
      vel[k + 2] += (Math.random() - 0.5) * 0.5 * dt;

      if (pull > 0.01) {
        const dx = live.center[0] - pos[k];
        const dy = live.center[1] - 0.2 - pos[k + 1];
        const dz = live.center[2] - pos[k + 2];
        const d = Math.hypot(dx, dy, dz) || 1;
        vel[k] += (dx / d) * pull * dt;
        vel[k + 1] += (dy / d) * pull * dt;
        vel[k + 2] += (dz / d) * pull * dt;
        if (d < live.radius * 1.05) randomInModule(pos, i, true); // eaten by the fire
      }
      const dampK = 1 - 0.9 * dt;
      vel[k] *= dampK;
      vel[k + 1] *= dampK;
      vel[k + 2] *= dampK;
      pos[k] += vel[k] * dt;
      pos[k + 1] += vel[k + 1] * dt;
      pos[k + 2] += vel[k + 2] * dt;

      const rr = Math.hypot(pos[k], pos[k + 2]);
      if (rr > MODULE.radius - 0.3) {
        pos[k] *= (MODULE.radius - 0.3) / rr;
        pos[k + 2] *= (MODULE.radius - 0.3) / rr;
        vel[k] *= -0.5;
        vel[k + 2] *= -0.5;
      }
      pos[k + 1] = THREE.MathUtils.clamp(pos[k + 1], MODULE.floor + 0.15, MODULE.ceiling - 0.2);

      axis
        .set(axes[k], axes[k + 1], axes[k + 2])
        .applyAxisAngle(THREE.Object3D.DEFAULT_UP, t * 0.8 + i)
        .multiplyScalar(0.05);
      dummy.scale.setScalar(0.045);
      dummy.position.set(pos[k] + axis.x, pos[k + 1] + axis.y, pos[k + 2] + axis.z);
      dummy.updateMatrix();
      a.current.setMatrixAt(i, dummy.matrix);
      dummy.position.set(pos[k] - axis.x, pos[k + 1] - axis.y, pos[k + 2] - axis.z);
      dummy.updateMatrix();
      b.current.setMatrixAt(i, dummy.matrix);
    }
    a.current.instanceMatrix.needsUpdate = true;
    b.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      {[a, b].map((ref, idx) => (
        <instancedMesh key={idx} ref={ref} args={[null, null, MAX]} frustumCulled={false}>
          <sphereGeometry args={[1, 12, 12]} />
          <meshStandardMaterial color="#3fd4ff" emissive="#3fd4ff" emissiveIntensity={0.9} toneMapped={false} />
        </instancedMesh>
      ))}
    </>
  );
}
