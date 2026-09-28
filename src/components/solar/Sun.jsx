import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SUN, SUN_R } from './solarConfig';

const vertex = /* glsl */ `
  varying vec3 vPos;
  varying vec3 vN;
  varying vec3 vView;
  void main() {
    vPos = position;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const fragment = /* glsl */ `
  uniform float uTime;
  uniform float uFlash;
  varying vec3 vPos;
  varying vec3 vN;
  varying vec3 vView;

  float hash(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453); }
  float noise(vec3 p) {
    vec3 i = floor(p); vec3 f = fract(p); f = f * f * (3.0 - 2.0 * f);
    float n000 = hash(i), n100 = hash(i + vec3(1,0,0)), n010 = hash(i + vec3(0,1,0)), n110 = hash(i + vec3(1,1,0));
    float n001 = hash(i + vec3(0,0,1)), n101 = hash(i + vec3(1,0,1)), n011 = hash(i + vec3(0,1,1)), n111 = hash(i + vec3(1,1,1));
    return mix(mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y), mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y), f.z);
  }
  float fbm(vec3 p) { float v = 0.0; float a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.1; a *= 0.5; } return v; }

  void main() {
    vec3 p = normalize(vPos) * 3.0;
    float n = fbm(p + vec3(uTime * 0.06, uTime * 0.04, 0.0));
    float spots = smoothstep(0.62, 0.7, fbm(p * 0.6 - uTime * 0.01));
    float facing = clamp(dot(vN, vView), 0.0, 1.0);
    vec3 deep = vec3(0.85, 0.22, 0.02);
    vec3 hot = vec3(1.0, 0.78, 0.35);
    vec3 col = mix(deep, hot, n);
    col = mix(col, vec3(0.35, 0.08, 0.02), spots * 0.7);
    col *= 0.9 + 0.8 * pow(facing, 0.6);
    col += uFlash * vec3(1.0, 0.95, 0.8);
    gl_FragColor = vec4(col * 1.6, 1.0);
  }
`;

/** Animated Sun with granulation, sunspots and a corona glow. */
export default function Sun({ flashRef }) {
  const mat = useMemo(
    () => new THREE.ShaderMaterial({ uniforms: { uTime: { value: 0 }, uFlash: { value: 0 } }, vertexShader: vertex, fragmentShader: fragment }),
    [],
  );
  const corona = useRef();
  const sun = useRef();

  useFrame((_, dt) => {
    mat.uniforms.uTime.value += dt;
    mat.uniforms.uFlash.value = flashRef.current * 0.35;
    if (sun.current) sun.current.rotation.y += dt * 0.03;
    if (corona.current) corona.current.scale.setScalar(1.18 + Math.sin(performance.now() / 900) * 0.02 + flashRef.current * 0.15);
  });

  return (
    <group position={SUN}>
      <mesh ref={sun} material={mat}>
        <sphereGeometry args={[SUN_R, 96, 96]} />
      </mesh>
      <mesh ref={corona}>
        <sphereGeometry args={[SUN_R, 48, 48]} />
        <meshBasicMaterial
          color="#ff7a1a"
          transparent
          opacity={0.16}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <pointLight intensity={180} distance={60} decay={1.4} color="#ffd9a0" />
    </group>
  );
}
