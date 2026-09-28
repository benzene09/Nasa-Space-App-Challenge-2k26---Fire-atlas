import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, Sparkles, Stars, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { createFlameMaterial } from '../lab/flameShader';

const LEN = 4.2;
const START_X = -LEN / 2;

/** One burning strip: unburnt part shrinks, char grows, a flame rides the front. */
function Lane({ z, lane, gravity, raceRef, index, color }) {
  const fresh = useRef();
  const char = useRef();
  const flameGroup = useRef();
  const light = useRef();
  const mat = useMemo(() => createFlameMaterial(0.8), []);
  const core = useMemo(() => createFlameMaterial(0.95), []);
  const sg = Math.sqrt(gravity);

  useEffect(
    () => () => {
      mat.dispose();
      core.dispose();
    },
    [mat, core],
  );

  useEffect(() => {
    const blue = 1 - Math.min(1, sg * 1.15);
    mat.uniforms.uColor.value.set(blue > 0.6 ? '#2f5cff' : '#ff7a18');
    mat.uniforms.uTipColor.value.set(blue > 0.6 ? '#6a4cff' : '#ffcf40');
    core.uniforms.uColor.value.set(blue > 0.6 ? '#b5ceff' : '#ffe28a');
    core.uniforms.uTipColor.value.set('#ffffff');
  }, [sg, mat, core]);

  useFrame(() => {
    const t = performance.now() / 1000;
    const st = raceRef.current.lanes[index];
    const p = st.progress;
    const front = START_X + p * LEN;
    fresh.current.scale.x = Math.max(0.0001, 1 - p);
    fresh.current.position.x = front + ((1 - p) * LEN) / 2;
    char.current.scale.x = Math.max(0.0001, p);
    char.current.position.x = START_X + (p * LEN) / 2;
    const on = st.burning ? 1 : st.dying;
    [mat, core].forEach((m, i) => {
      m.uniforms.uTime.value = t + i + index;
      m.uniforms.uStretch.value = 1 + 1.3 * sg;
      m.uniforms.uTaper.value = Math.min(1, sg * 1.4);
      m.uniforms.uIntensity.value = on;
    });
    const r = 0.22 + lane.risk * 0.28;
    flameGroup.current.position.set(front, 0.06 + r * (1 - (1 - Math.min(1, sg * 1.15))) * 0.8, z);
    flameGroup.current.scale.setScalar(r);
    flameGroup.current.visible = on > 0.01;
    light.current.position.set(front, 0.6, z);
    light.current.intensity = on * (5 + Math.sin(t * 20) * 0.8);
  });

  return (
    <group>
      <mesh ref={fresh} position={[0, 0.03, z]}>
        <boxGeometry args={[LEN, 0.05, 0.55]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh ref={char} position={[START_X, 0.02, z]}>
        <boxGeometry args={[LEN, 0.035, 0.55]} />
        <meshStandardMaterial color="#1b1512" roughness={1} />
      </mesh>
      <group ref={flameGroup}>
        <mesh material={mat} renderOrder={10}>
          <sphereGeometry args={[1, 40, 40]} />
        </mesh>
        <mesh material={core} scale={0.5} renderOrder={11}>
          <sphereGeometry args={[1, 32, 32]} />
        </mesh>
      </group>
      <pointLight ref={light} color="#ff9a3d" distance={4} decay={1.6} intensity={0} />
      <Html zIndexRange={[16, 0]} position={[START_X - 0.35, 0.1, z]} center distanceFactor={7} style={{ pointerEvents: 'none' }}>
        <span className="race-lane-tag">{index === 0 ? 'A' : 'B'}</span>
      </Html>
    </group>
  );
}

function Race({ lanes, gravity, raceRef, running, onTick, onDone }) {
  const last = useRef(0);
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const r = raceRef.current;
    if (running && !r.finished) {
      r.time += dt;
      r.lanes.forEach((st, i) => {
        if (st.burning) {
          st.progress = Math.min(1, st.progress + lanes[i].speed * dt);
          if (st.progress >= 1) {
            st.burning = false;
            st.finishedAt = r.time;
          } else if (lanes[i].stopAt !== null && st.progress >= lanes[i].stopAt) {
            st.burning = false;
            st.out = true;
          }
        }
      });
      if (r.started && r.lanes.every((s) => !s.burning)) {
        r.finished = true;
        onDone();
      }
    }
    r.lanes.forEach((st) => {
      if (!st.burning) st.dying = Math.max(0, st.dying - dt * 1.5);
    });
    if (performance.now() - last.current > 100) {
      last.current = performance.now();
      onTick();
    }
  });

  return (
    <>
      <Lane z={-0.55} lane={lanes[0]} gravity={gravity} raceRef={raceRef} index={0} color={lanes[0].color} />
      <Lane z={0.55} lane={lanes[1]} gravity={gravity} raceRef={raceRef} index={1} color={lanes[1].color} />
      {running && gravity > 0.05 && <Sparkles count={30} scale={[LEN, 1.5, 2]} position={[0, 0.8, 0]} size={2.5} speed={0.8} color="#ffb347" />}
    </>
  );
}

/** 3D burn-race test chamber. */
export default function BurnRaceScene({ lanes, gravity, raceRef, running, onTick, onDone }) {
  return (
    <Canvas camera={{ position: [0, 2.6, 4.2], fov: 42 }} dpr={[1, 1.75]}>
      <color attach="background" args={['#060913']} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 5, 2]} intensity={0.8} />
      <Stars radius={40} depth={20} count={800} factor={2} fade />
      {/* Test bench */}
      <mesh position={[0, -0.06, 0]}>
        <boxGeometry args={[LEN + 0.8, 0.12, 2.3]} />
        <meshStandardMaterial color="#1c2438" metalness={0.6} roughness={0.4} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[(s * (LEN + 0.8)) / 2, 0.25, 0]}>
          <boxGeometry args={[0.06, 0.5, 2.3]} />
          <meshStandardMaterial color="#3fd4ff" emissive="#3fd4ff" emissiveIntensity={0.4} transparent opacity={0.4} />
        </mesh>
      ))}
      <mesh position={[LEN / 2 + 0.02, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.08, 2.1]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
      <ContactShadows position={[0, -0.119, 0]} opacity={0.5} scale={8} blur={2} />
      <Race lanes={lanes} gravity={gravity} raceRef={raceRef} running={running} onTick={onTick} onDone={onDone} />
      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur intensity={1} luminanceThreshold={0.55} />
      </EffectComposer>
    </Canvas>
  );
}
