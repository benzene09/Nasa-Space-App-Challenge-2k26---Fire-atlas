import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const vertex = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
const fragment = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  varying vec2 vUv;
  void main() {
    float a = vUv.x * 6.2831;
    float wave = 0.55 + 0.45 * sin(a * 9.0 + uTime * 1.7) * sin(a * 4.0 - uTime * 1.1);
    float h = vUv.y;
    vec3 green = vec3(0.2, 1.0, 0.55);
    vec3 red = vec3(1.0, 0.25, 0.55);
    vec3 col = mix(green, red, smoothstep(0.45, 1.0, h));
    float alpha = (1.0 - h) * smoothstep(0.0, 0.08, h) * wave * uIntensity;
    gl_FragColor = vec4(col * 1.8, alpha);
  }
`;

/** Northern + southern auroral curtains. They slide toward the equator as Kp rises. */
export default function Aurora({ liveRef }) {
  const mats = useMemo(
    () =>
      [0, 1].map(
        () =>
          new THREE.ShaderMaterial({
            uniforms: { uTime: { value: 0 }, uIntensity: { value: 0.3 } },
            vertexShader: vertex,
            fragmentShader: fragment,
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
          }),
      ),
    [],
  );
  const north = useRef();
  const south = useRef();

  useFrame((_, dt) => {
    const L = liveRef.current;
    const lat = (L.auroraLat * Math.PI) / 180;
    const R = Math.cos(lat) * 1.005;
    const y = Math.sin(lat);
    const h = 0.12 + L.storm * 0.18;
    const intensity = 0.35 + (L.kp / 9) * 1.4;
    mats.forEach((m) => {
      m.uniforms.uTime.value += dt;
      m.uniforms.uIntensity.value = intensity;
    });
    [north, south].forEach((ref, i) => {
      if (!ref.current) return;
      ref.current.scale.set(R, h, R);
      ref.current.position.y = (i === 0 ? 1 : -1) * (y + h / 2 - 0.01);
      ref.current.rotation.x = i === 0 ? 0 : Math.PI;
    });
  });

  return (
    <group rotation={[0, 0, (-11 * Math.PI) / 180]}>
      <mesh ref={north} material={mats[0]}>
        <cylinderGeometry args={[1.04, 1, 1, 128, 1, true]} />
      </mesh>
      <mesh ref={south} material={mats[1]}>
        <cylinderGeometry args={[1.04, 1, 1, 128, 1, true]} />
      </mesh>
    </group>
  );
}
