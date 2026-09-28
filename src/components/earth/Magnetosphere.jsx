import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { vis } from './earthConfig';
import { QUIET } from '../../utils/earthImpact';

const L_SHELLS = [2.2, 3, 4, 5.5, 7.5, 10];
const PHIS = Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2);

function fresnelMat(color, strength) {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uStrength: { value: strength } },
    vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform vec3 uColor; uniform float uStrength; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(vN, vV)), 3.5); gl_FragColor = vec4(uColor * 1.4, f * uStrength); }`,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
}

/** Shue-model boundary surface (magnetopause or bow shock), resized every frame. */
function useBoundary(alpha, color, strength) {
  return useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 40; i++) {
      const th = (i / 40) * (Math.PI * 0.82);
      pts.push(new THREE.Vector2(Math.sin(th), -Math.cos(th)));
    }
    const geo = new THREE.LatheGeometry(pts, 72);
    const pos = geo.attributes.position;
    const dirs = new Float32Array(pos.count * 3);
    const g = new Float32Array(pos.count);
    for (let i = 0; i < pos.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(pos, i);
      const th = Math.acos(THREE.MathUtils.clamp(-v.y / v.length(), -1, 1));
      v.normalize();
      dirs.set([v.x, v.y, v.z], i * 3);
      g[i] = (2 / (1 + Math.cos(th))) ** alpha;
    }
    const mesh = new THREE.Mesh(geo, fresnelMat(color, strength));
    mesh.rotation.z = -Math.PI / 2; // lathe axis (Y) → sun line (X); subsolar point faces −X (the Sun)
    mesh.rotation.x = 0;
    const update = (r0) => {
      for (let i = 0; i < pos.count; i++) {
        const r = vis(r0 * g[i]);
        pos.setXYZ(i, dirs[i * 3] * r, dirs[i * 3 + 1] * r, dirs[i * 3 + 2] * r);
      }
      pos.needsUpdate = true;
      geo.computeVertexNormals();
    };
    update(QUIET.rmp);
    return { mesh, update };
  }, [alpha, color, strength]);
}

/** Dipole field lines that squash on the day side and stretch into a tail on the night side. */
export default function Magnetosphere({ liveRef }) {
  const lines = useMemo(() => {
    const out = [];
    L_SHELLS.forEach((L) => {
      PHIS.forEach((phi) => {
        const lmax = Math.acos(Math.sqrt(1 / L));
        const base = [];
        for (let i = 0; i <= 64; i++) {
          const lam = -lmax + (2 * lmax * i) / 64;
          const r = L * Math.cos(lam) ** 2;
          const s = vis(r) / r;
          base.push(r * Math.cos(lam) * Math.cos(phi) * s, r * Math.sin(lam) * s, r * Math.cos(lam) * Math.sin(phi) * s);
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(base.slice(), 3));
        const mat = new THREE.LineBasicMaterial({ color: '#3fd4ff', transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false });
        out.push({ L, base: new Float32Array(base), line: new THREE.Line(geo, mat) });
      });
    });
    return out;
  }, []);

  const mp = useBoundary(0.58, '#3fd4ff', 0.28);
  const bs = useBoundary(0.8, '#ffd27a', 0.1);

  useFrame(() => {
    const L = liveRef.current;
    const cDay = vis(L.rmp) / vis(QUIET.rmp);
    const cNight = 1 + (1 - cDay) * 1.3;
    const glow = 0.3 + L.storm * 0.45;
    lines.forEach(({ L: shell, base, line }) => {
      const pos = line.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = base[i * 3];
        pos.setX(i, x < 0 ? x * cDay : x * cNight);
      }
      pos.needsUpdate = true;
      line.visible = shell < L.rmp + 0.6;
      line.material.opacity = glow;
      line.material.color.setRGB(0.25 + L.storm * 0.6, 0.83 - L.storm * 0.3, 1 - L.storm * 0.5);
    });
    mp.update(L.rmp);
    bs.update(L.rmp * 1.3);
    mp.mesh.material.uniforms.uStrength.value = 0.22 + L.storm * 0.35;
  });

  return (
    <group>
      {lines.map((l, i) => (
        <primitive key={i} object={l.line} />
      ))}
      <primitive object={mp.mesh} />
      <primitive object={bs.mesh} />
    </group>
  );
}
