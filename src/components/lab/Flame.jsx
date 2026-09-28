import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { createFlameMaterial } from './flameShader';
import { anchorFor } from './sceneConfig';

// Earth-like (sooty, yellow) and space-like (clean, blue) palettes per layer.
const PALETTE = {
  outer: { earth: ['#ff7a18', '#ffcf40'], space: ['#2f5cff', '#6a4cff'] },
  mid: { earth: ['#ffae3d', '#fff0a0'], space: ['#4f93ff', '#94b0ff'] },
  core: { earth: ['#7fb0ff', '#ffffff'], space: ['#b5ceff', '#dfe8ff'] },
};
const LAYERS = [
  { key: 'outer', scale: 1, opacity: 0.55 },
  { key: 'mid', scale: 0.72, opacity: 0.7 },
  { key: 'core', scale: 0.42, opacity: 0.95 },
];

const damp = THREE.MathUtils.damp;

/** The main flame: three shader layers that morph with gravity, oxygen and material. */
export default function Flame({ state, flame, liveRef }) {
  const group = useRef();
  const light = useRef();
  const materials = useMemo(() => LAYERS.map((l) => createFlameMaterial(l.opacity)), []);
  const colors = useMemo(
    () =>
      LAYERS.map((l) => ({
        eb: new THREE.Color(PALETTE[l.key].earth[0]),
        et: new THREE.Color(PALETTE[l.key].earth[1]),
        sb: new THREE.Color(PALETTE[l.key].space[0]),
        st: new THREE.Color(PALETTE[l.key].space[1]),
      })),
    [],
  );
  const lightColor = useMemo(() => new THREE.Color(), []);
  const cur = useRef({ intensity: 0, radius: 0.3, stretch: 1, taper: 0, blue: 0, y: 0 });

  useEffect(() => () => materials.forEach((m) => m.dispose()), [materials]);

  useFrame((_, dt) => {
    const c = cur.current;
    const t = performance.now() / 1000;
    const anchor = anchorFor(flame.material.kind);

    let target = 0;
    if (state.status === 'burning') target = 1;
    else if (state.status === 'fizzle') target = 0.35;
    const speed = state.status === 'extinguishing' ? 1.8 : state.status === 'fizzle' ? 3 : 2.5;
    c.intensity = damp(c.intensity, target, speed, dt);

    const fuelScale = 0.55 + 0.45 * state.fuel;
    const radiusTarget = (state.status === 'fizzle' ? 0.22 : flame.radius) * fuelScale;
    c.radius = damp(c.radius, radiusTarget, 3, dt);
    c.stretch = damp(c.stretch, flame.stretch, 3, dt);
    c.taper = damp(c.taper, flame.taper, 3, dt);
    c.blue = damp(c.blue, flame.blueness, 3, dt);

    // 0g: flame surrounds the fuel. With gravity: flame sits on top of it.
    const lift = (1 - c.blue) * 0.75;
    c.y = anchor[1] + c.radius * lift;
    const brightness = 0.6 + 0.4 * (1 - c.blue);

    materials.forEach((m, i) => {
      m.uniforms.uTime.value = t + i * 0.37;
      m.uniforms.uStretch.value = c.stretch;
      m.uniforms.uTaper.value = c.taper;
      m.uniforms.uFlicker.value = 0.4 + c.taper;
      m.uniforms.uIntensity.value = c.intensity * brightness;
      m.uniforms.uColor.value.lerpColors(colors[i].eb, colors[i].sb, c.blue);
      m.uniforms.uTipColor.value.lerpColors(colors[i].et, colors[i].st, c.blue);
    });

    if (group.current) {
      group.current.position.set(anchor[0], c.y, anchor[2]);
      group.current.scale.setScalar(Math.max(c.radius, 0.001));
      group.current.visible = c.intensity > 0.005;
    }
    if (light.current) {
      const flicker = 0.85 + Math.sin(t * 17) * 0.08 + Math.sin(t * 23) * 0.07;
      light.current.intensity = c.intensity * (4 + c.radius * 14) * flicker * brightness;
      lightColor.lerpColors(colors[0].eb, colors[0].sb, c.blue);
      light.current.color.copy(lightColor);
      light.current.position.set(anchor[0], c.y + c.radius * c.stretch * 0.6, anchor[2]);
    }
    // Share live flame geometry with particles and labels.
    if (liveRef) {
      liveRef.current.intensity = c.intensity;
      liveRef.current.radius = c.radius;
      liveRef.current.center[0] = anchor[0];
      liveRef.current.center[1] = c.y + c.radius * (c.stretch - 1);
      liveRef.current.center[2] = anchor[2];
      liveRef.current.top = c.y + c.radius * (2 * c.stretch - 1);
    }
  });

  const showEmbers = state.status === 'burning' && state.gravity > 0.05 && flame.soot > 0.5;

  return (
    <>
      <group ref={group}>
        {LAYERS.map((l, i) => (
          <mesh key={l.key} scale={l.scale} material={materials[i]} renderOrder={10 + i}>
            <sphereGeometry args={[1, 48, 48]} />
          </mesh>
        ))}
      </group>
      <pointLight ref={light} distance={9} decay={1.6} intensity={0} />
      {showEmbers && (
        <Sparkles
          count={40}
          scale={[0.8, 2.2 * state.gravity + 0.4, 0.8]}
          position={[0, 0.9 + state.gravity * 0.6, 0]}
          size={3}
          speed={0.6 + state.gravity}
          color="#ffb347"
          opacity={0.9}
        />
      )}
    </>
  );
}
