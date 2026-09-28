import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const vertex = /* glsl */ `
  varying vec3 vPos;
  varying vec3 vWorldN;
  varying vec3 vView;
  void main() {
    vPos = position;
    vWorldN = normalize(mat3(modelMatrix) * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const fragment = /* glsl */ `
  uniform vec3 uSunDir;
  uniform float uTime;
  uniform float uDim;
  uniform float uRadio;
  varying vec3 vPos;
  varying vec3 vWorldN;
  varying vec3 vView;

  float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
  float noise(vec3 p) {
    vec3 i = floor(p); vec3 f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  float fbm(vec3 p) { float v = 0.0; float a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }

  void main() {
    vec3 p = normalize(vPos);
    float land = smoothstep(0.5, 0.53, fbm(p * 2.2 + 3.1));
    float ice = smoothstep(0.82, 0.9, abs(p.y));
    vec3 ocean = mix(vec3(0.02, 0.1, 0.3), vec3(0.05, 0.25, 0.55), fbm(p * 6.0));
    vec3 ground = mix(vec3(0.12, 0.35, 0.12), vec3(0.45, 0.38, 0.2), fbm(p * 5.0 + 7.0));
    vec3 col = mix(ocean, ground, land);
    col = mix(col, vec3(0.9, 0.95, 1.0), ice);

    float day = dot(normalize(vWorldN), uSunDir);
    float light = smoothstep(-0.15, 0.25, day);
    vec3 lit = col * (0.08 + 1.1 * light);

    // City lights on the night side (flicker / black out during strong storms).
    float cities = step(0.78, noise(p * 60.0)) * land * (1.0 - ice);
    float flicker = 1.0 - uDim * (0.6 + 0.4 * sin(uTime * 23.0 + p.x * 40.0));
    lit += vec3(1.0, 0.75, 0.35) * cities * (1.0 - light) * 1.4 * clamp(flicker, 0.0, 1.0);

    // Radio blackout: sunlit ionosphere glows.
    float rim = pow(1.0 - clamp(dot(normalize(vWorldN), vView), 0.0, 1.0), 2.0);
    lit += vec3(0.55, 0.35, 1.0) * uRadio * light * (0.35 + rim);
    lit += vec3(0.3, 0.6, 1.0) * rim * 0.35 * light;
    gl_FragColor = vec4(lit, 1.0);
  }
`;

/** Procedural Earth with day/night, city lights and ionosphere glow. */
export default function EarthGlobe({ liveRef }) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uSunDir: { value: new THREE.Vector3(-1, 0.1, 0).normalize() }, uTime: { value: 0 }, uDim: { value: 0 }, uRadio: { value: 0 } },
        vertexShader: vertex,
        fragmentShader: fragment,
      }),
    [],
  );
  const globe = useRef();

  useFrame((_, dt) => {
    mat.uniforms.uTime.value += dt;
    mat.uniforms.uDim.value = liveRef.current.dim;
    mat.uniforms.uRadio.value = liveRef.current.radio * 2;
    if (globe.current) globe.current.rotation.y += dt * 0.05;
  });

  return (
    <group rotation={[0, 0, (-23.4 * Math.PI) / 180]}>
      <mesh ref={globe} material={mat}>
        <sphereGeometry args={[1, 96, 96]} />
      </mesh>
      <mesh scale={1.06}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshBasicMaterial color="#4aa3ff" transparent opacity={0.12} side={THREE.BackSide} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}
