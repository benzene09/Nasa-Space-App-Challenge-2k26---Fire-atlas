import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MODULE, DETECTOR_POS } from './sceneConfig';

const COUNT = 260;
const dummy = new THREE.Object3D();

/**
 * Soot/smoke particles. With gravity they rise and pool at the ceiling (triggering the
 * smoke alarm). In microgravity they drift outward slowly and rarely reach the alarm.
 */
export default function Smoke({ state, flame, liveRef, onAlarm }) {
  const mesh = useRef();
  const sim = useMemo(
    () => ({
      pos: new Float32Array(COUNT * 3),
      vel: new Float32Array(COUNT * 3),
      age: new Float32Array(COUNT),
      life: new Float32Array(COUNT).fill(-1),
      next: 0,
      acc: 0,
      alarm: false,
      weightless: null,
    }),
    [],
  );

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const live = liveRef.current;
    const g = state.gravity;
    const { pos, vel, age, life } = sim;

    // When gravity switches on/off, old smoke clears quickly so the lesson stays readable.
    const weightless = g <= 0.02;
    if (sim.weightless !== null && sim.weightless !== weightless) {
      for (let i = 0; i < COUNT; i++) if (life[i] > 0) life[i] = Math.min(life[i], age[i] + 0.3);
    }
    sim.weightless = weightless;

    // Spawn proportional to how big and sooty the fire is.
    const rate = 55 * live.intensity * flame.soot * (0.4 + flame.size);
    sim.acc += rate * dt;
    while (sim.acc >= 1) {
      sim.acc -= 1;
      const i = sim.next;
      sim.next = (sim.next + 1) % COUNT;
      const r = live.radius;
      if (g > 0.02) {
        pos[i * 3] = live.center[0] + (Math.random() - 0.5) * r * 0.5;
        pos[i * 3 + 1] = live.top - r * 0.2;
        pos[i * 3 + 2] = live.center[2] + (Math.random() - 0.5) * r * 0.5;
        vel[i * 3] = (Math.random() - 0.5) * 0.15;
        vel[i * 3 + 1] = 0.4 + g * 0.8;
        vel[i * 3 + 2] = (Math.random() - 0.5) * 0.15;
      } else {
        const v = new THREE.Vector3().randomDirection();
        pos[i * 3] = live.center[0] + v.x * r * 1.1;
        pos[i * 3 + 1] = live.center[1] + v.y * r * 1.1;
        pos[i * 3 + 2] = live.center[2] + v.z * r * 1.1;
        vel[i * 3] = v.x * 0.14;
        vel[i * 3 + 1] = v.y * 0.14;
        vel[i * 3 + 2] = v.z * 0.14;
      }
      age[i] = 0;
      life[i] = g > 0.02 ? 5 + Math.random() * 3 : 7 + Math.random() * 4;
    }

    let nearAlarm = 0;
    const ceil = MODULE.ceiling - 0.15;
    for (let i = 0; i < COUNT; i++) {
      if (life[i] < 0) {
        dummy.scale.setScalar(0);
      } else {
        age[i] += dt;
        if (age[i] > life[i]) life[i] = -1;
        const k = i * 3;
        vel[k] += (Math.random() - 0.5) * 0.3 * dt;
        vel[k + 1] += (flame.smokeRise * 0.9 + (Math.random() - 0.5) * 0.3) * dt;
        vel[k + 2] += (Math.random() - 0.5) * 0.3 * dt;
        const dampK = 1 - 0.55 * dt;
        vel[k] *= dampK;
        vel[k + 1] *= dampK;
        vel[k + 2] *= dampK;
        pos[k] += vel[k] * dt;
        pos[k + 1] += vel[k + 1] * dt;
        pos[k + 2] += vel[k + 2] * dt;
        // Smoke pools under the ceiling and spreads sideways.
        if (pos[k + 1] > ceil) {
          pos[k + 1] = ceil;
          vel[k + 1] = 0;
          const h = Math.hypot(pos[k], pos[k + 2]) || 1;
          vel[k] += (pos[k] / h) * 0.25 * dt;
          vel[k + 2] += (pos[k + 2] / h) * 0.25 * dt;
        }
        if (pos[k + 1] < MODULE.floor + 0.1) pos[k + 1] = MODULE.floor + 0.1;
        const rr = Math.hypot(pos[k], pos[k + 2]);
        if (rr > MODULE.radius - 0.3) {
          pos[k] *= (MODULE.radius - 0.3) / rr;
          pos[k + 2] *= (MODULE.radius - 0.3) / rr;
        }
        const t = age[i] / life[i];
        const fade = Math.min(1, age[i] * 3) * (1 - t * t);
        dummy.position.set(pos[k], pos[k + 1], pos[k + 2]);
        dummy.scale.setScalar((0.07 + age[i] * 0.06) * fade);
        if (Math.hypot(pos[k] - DETECTOR_POS[0], pos[k + 1] - DETECTOR_POS[1], pos[k + 2] - DETECTOR_POS[2]) < 1.1) nearAlarm++;
      }
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;

    // Hysteresis so the alarm doesn't flicker.
    if (!sim.alarm && nearAlarm > 8) {
      sim.alarm = true;
      onAlarm(true);
    } else if (sim.alarm && nearAlarm < 2) {
      sim.alarm = false;
      onAlarm(false);
    }
  });

  return (
    <instancedMesh ref={mesh} args={[null, null, COUNT]} frustumCulled={false}>
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial color="#5c6270" roughness={1} transparent opacity={0.38} depthWrite={false} />
    </instancedMesh>
  );
}
