import * as THREE from 'three';

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uStretch;
  uniform float uTaper;
  uniform float uFlicker;
  varying vec3 vN;
  varying vec3 vView;
  varying float vY;

  void main() {
    vec3 p = position;
    float y01 = (p.y + 1.0) * 0.5;
    // Teardrop: pinch the top when gravity pulls hot gas upward.
    p.xz *= mix(1.0, 1.0 - y01 * y01 * 0.85, uTaper);
    // Flicker.
    float n = sin(p.y * 4.0 + uTime * 9.0) * 0.5 + sin(p.x * 5.0 - uTime * 7.0) * 0.5;
    p += normal * n * 0.06 * uFlicker;
    p.x += sin(uTime * 6.0 + p.y * 3.0) * 0.06 * uTaper * y01;
    // Grow upward while keeping the base in place.
    p.y = p.y * uStretch + (uStretch - 1.0);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vN = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    vY = y01;
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uTipColor;
  uniform float uIntensity;
  uniform float uOpacity;
  varying vec3 vN;
  varying vec3 vView;
  varying float vY;

  void main() {
    float facing = clamp(dot(normalize(vN), normalize(vView)), 0.0, 1.0);
    float a = pow(facing, 1.6) * uOpacity * uIntensity;
    vec3 col = mix(uColor, uTipColor, smoothstep(0.25, 1.0, vY));
    gl_FragColor = vec4(col * (1.0 + facing * 1.4), a);
  }
`;

/** Soft additive glowing blob, deformed into a teardrop by gravity. */
export function createFlameMaterial(opacity = 0.6) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uStretch: { value: 1 },
      uTaper: { value: 0 },
      uFlicker: { value: 1 },
      uIntensity: { value: 0 },
      uOpacity: { value: opacity },
      uColor: { value: new THREE.Color('#ff8a1f') },
      uTipColor: { value: new THREE.Color('#ffd24a') },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}
