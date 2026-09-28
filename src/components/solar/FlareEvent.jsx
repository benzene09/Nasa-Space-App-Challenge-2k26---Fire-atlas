import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SUN, SUN_R, EARTH, CRAFT, T, regionPoint } from './solarConfig';

const SEP_MAX = 320;
const CME_MAX = 180;
const dummy = new THREE.Object3D();
const v = new THREE.Vector3();
const SUNV = new THREE.Vector3(...SUN);

/**
 * Replays one flare: flash + magnetic loop at the active region, X-ray wave (light speed),
 * energetic particle storm along a curved Parker-spiral path, then the CME cloud.
 */
export default function FlareEvent({ flare, risk, phaseId, playId, onEvent, flashRef, hitRef }) {
  const t = useRef(-1);
  const fired = useRef({});
  const shell = useRef();
  const loop = useRef();
  const flash = useRef();
  const sepMesh = useRef();
  const cmeMesh = useRef();

  const region = useMemo(() => new THREE.Vector3(...regionPoint(flare.lat, flare.lon, SUN_R * 1.01)), [flare]);
  const target = useMemo(() => new THREE.Vector3(...CRAFT[phaseId]), [phaseId]);
  const shieldPoint = useMemo(() => new THREE.Vector3(EARTH[0] - 0.55, EARTH[1], EARTH[2]), []);
  const endPoint = phaseId === 'iss' ? shieldPoint : target;

  // Particle storm strength: bigger + better connected flares send more particles further.
  const sepCount = Math.round(40 + (flare.hasSEP ? 1 : risk.strength * risk.connected) * (SEP_MAX - 40));
  const sepReach = flare.hasSEP ? 1 : Math.min(1, 0.35 + risk.strength * risk.connected);

  const sep = useMemo(() => {
    const seeds = [];
    for (let i = 0; i < SEP_MAX; i++) {
      seeds.push({
        delay: Math.random() * 1.2,
        speed: 0.75 + Math.random() * 0.5,
        off: new THREE.Vector3().randomDirection().multiplyScalar(0.15 + Math.random() * 0.5),
        bend: 0.8 + Math.random() * 0.6,
      });
    }
    return seeds;
  }, []);
  const cme = useMemo(() => Array.from({ length: CME_MAX }, () => ({ dir: new THREE.Vector3().randomDirection(), r: Math.random() })), []);

  // CME heads out along the region's longitude; far-side flares miss the crew.
  const cmeDir = useMemo(
    () =>
      region
        .clone()
        .sub(new THREE.Vector3(...SUN))
        .normalize(),
    [region],
  );
  const cmeDist = useMemo(() => target.distanceTo(new THREE.Vector3(...SUN)), [target]);

  useEffect(() => {
    t.current = playId > 0 ? 0 : -1;
    fired.current = {};
  }, [playId, flare.id, phaseId]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    if (t.current < 0) {
      flashRef.current = THREE.MathUtils.damp(flashRef.current, 0, 3, dt);
      hitRef.current = THREE.MathUtils.damp(hitRef.current, 0, 2, dt);
      [shell, loop, flash].forEach((r) => r.current && (r.current.visible = false));
      hideAll(sepMesh.current, SEP_MAX);
      hideAll(cmeMesh.current, CME_MAX);
      return;
    }
    t.current += dt;
    const time = t.current;
    const emit = (name) => {
      if (!fired.current[name]) {
        fired.current[name] = true;
        onEvent(name);
      }
    };
    emit('flash');

    // 1. Flash + magnetic loop at the active region.
    const flashAmt = Math.max(0, 1 - time / 1.6) * (0.4 + risk.strength);
    flashRef.current = flashAmt;
    flash.current.visible = flashAmt > 0.01;
    flash.current.position.copy(region);
    flash.current.scale.setScalar(0.25 + flashAmt * 1.2);
    flash.current.material.opacity = Math.min(1, flashAmt);
    loop.current.visible = time < 5;
    loop.current.position.copy(region);
    loop.current.lookAt(SUNV);
    loop.current.scale.setScalar(0.25 + Math.min(1, time) * (0.25 + risk.strength * 0.4));
    loop.current.material.opacity = Math.max(0, 1 - time / 5);

    // 2. X-ray wave at the speed of light (8 minutes to Earth).
    const xr = time / T.XRAY;
    shell.current.visible = xr < 2.2;
    shell.current.scale.setScalar(SUN_R + xr * (cmeDist - SUN_R));
    shell.current.material.opacity = Math.max(0, 0.8 * (1 - xr / 2.2)) * (0.4 + risk.strength);
    if (time >= T.XRAY) emit('xray');

    // 3. Solar energetic particles.
    const start = v.copy(SUNV).addScaledVector(cmeDir, SUN_R).clone();
    const midX = (start.x + endPoint.x) / 2;
    const midY = (start.y + endPoint.y) / 2;
    const midZ = (start.z + endPoint.z) / 2;
    for (let i = 0; i < SEP_MAX; i++) {
      const s = sep[i];
      let u = (time - 0.4 - s.delay) / ((T.SEP - 0.6) / s.speed);
      if (i >= sepCount || u <= 0) {
        dummy.scale.setScalar(0);
      } else {
        const faded = u > sepReach;
        u = Math.min(u, sepReach + 0.08);
        // Curved Parker-spiral path from region → crew.
        const a = (1 - u) * (1 - u);
        const b = 2 * u * (1 - u);
        const c2 = u * u;
        v.set(a * start.x + b * midX + c2 * endPoint.x, a * start.y + b * midY + c2 * endPoint.y, a * start.z + b * (midZ + 2.2 * s.bend) + c2 * endPoint.z);
        v.addScaledVector(s.off, Math.sin(u * Math.PI));
        dummy.position.copy(v);
        const life = time - T.SEP - s.delay;
        dummy.scale.setScalar(faded || life > 2.5 ? 0 : 0.035);
      }
      dummy.updateMatrix();
      sepMesh.current.setMatrixAt(i, dummy.matrix);
    }
    sepMesh.current.instanceMatrix.needsUpdate = true;
    if (time >= T.SEP) {
      emit(sepReach >= 1 ? 'sep' : 'sep-weak');
      const hit = sepReach >= 1 ? Math.min(1, risk.radiation / 70) : 0.1;
      hitRef.current = time < T.SEP + 2.5 ? hit : THREE.MathUtils.damp(hitRef.current, 0, 2, dt);
    }

    // 4. Coronal mass ejection cloud (1–3 days in real life).
    const c = (time - 1.5) / (T.CME - 1.5);
    for (let i = 0; i < CME_MAX; i++) {
      if (!flare.hasCME || c <= 0 || c > 1.3) {
        dummy.scale.setScalar(0);
      } else {
        const p = cme[i];
        const spread = 0.3 + c * 2.2;
        v.copy(SUNV)
          .addScaledVector(cmeDir, SUN_R + c * (cmeDist - SUN_R) * (0.9 + p.r * 0.2))
          .addScaledVector(p.dir, spread * p.r);
        dummy.position.copy(v);
        dummy.scale.setScalar((0.08 + c * 0.14) * (c > 1 ? 1 - (c - 1) / 0.3 : 1));
      }
      dummy.updateMatrix();
      cmeMesh.current.setMatrixAt(i, dummy.matrix);
    }
    cmeMesh.current.instanceMatrix.needsUpdate = true;
    if (flare.hasCME && time >= T.CME) emit(Math.abs(flare.lon) < 60 ? 'cme' : 'cme-miss');
    if (time >= T.END) {
      emit('end');
      t.current = -1;
    }
  });

  return (
    <>
      <mesh ref={flash} visible={false}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color="#fff4d6" transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={loop} visible={false}>
        <torusGeometry args={[1, 0.08, 12, 48, Math.PI]} />
        <meshBasicMaterial color="#ffcf70" transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      {/* X-ray wavefront: thin ring expanding in the planets' plane */}
      <mesh ref={shell} position={SUN} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.985, 1, 160]} />
        <meshBasicMaterial color="#c9b8ff" transparent side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <instancedMesh ref={sepMesh} args={[null, null, SEP_MAX]} frustumCulled={false}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color="#8ff0ff" toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={cmeMesh} args={[null, null, CME_MAX]} frustumCulled={false}>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial color="#ff8a5c" transparent opacity={0.25} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </instancedMesh>
    </>
  );
}

function hideAll(mesh, n) {
  if (!mesh) return;
  dummy.scale.setScalar(0);
  dummy.updateMatrix();
  for (let i = 0; i < n; i++) mesh.setMatrixAt(i, dummy.matrix);
  mesh.instanceMatrix.needsUpdate = true;
}
