import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { NOZZLE_POS } from './sceneConfig';

const COUNT = 160;
const dummy = new THREE.Object3D();

/** CO₂ cloud blasting from the extinguisher nozzle toward the flame. */
export default function Spray({ spraying, liveRef }) {
  const mesh = useRef();
  const sim = useMemo(
    () => ({ pos: new Float32Array(COUNT * 3), vel: new Float32Array(COUNT * 3), age: new Float32Array(COUNT).fill(-1), next: 0, acc: 0 }),
    [],
  );

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const { pos, vel, age } = sim;
    const target = liveRef.current.center;

    if (spraying) {
      sim.acc += 140 * dt;
      while (sim.acc >= 1) {
        sim.acc -= 1;
        const i = sim.next;
        sim.next = (sim.next + 1) % COUNT;
        const dir = new THREE.Vector3(target[0] - NOZZLE_POS[0], target[1] + 0.1 - NOZZLE_POS[1], target[2] - NOZZLE_POS[2]).normalize();
        dir.x += (Math.random() - 0.5) * 0.25;
        dir.y += (Math.random() - 0.5) * 0.25;
        dir.z += (Math.random() - 0.5) * 0.25;
        dir.normalize().multiplyScalar(3.2 + Math.random());
        pos.set(NOZZLE_POS, i * 3);
        vel.set([dir.x, dir.y, dir.z], i * 3);
        age[i] = 0;
      }
    }

    for (let i = 0; i < COUNT; i++) {
      const k = i * 3;
      if (age[i] < 0) {
        dummy.scale.setScalar(0);
      } else {
        age[i] += dt;
        const life = 0.9;
        if (age[i] > life) age[i] = -1;
        vel[k] *= 1 - 1.6 * dt;
        vel[k + 1] *= 1 - 1.6 * dt;
        vel[k + 2] *= 1 - 1.6 * dt;
        pos[k] += vel[k] * dt;
        pos[k + 1] += vel[k + 1] * dt;
        pos[k + 2] += vel[k + 2] * dt;
        const t = age[i] / life;
        dummy.position.set(pos[k], pos[k + 1], pos[k + 2]);
        dummy.scale.setScalar((0.04 + t * 0.32) * (1 - t));
      }
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[null, null, COUNT]} frustumCulled={false}>
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial color="#eef6ff" emissive="#cfe6ff" emissiveIntensity={0.4} transparent opacity={0.45} depthWrite={false} />
    </instancedMesh>
  );
}
