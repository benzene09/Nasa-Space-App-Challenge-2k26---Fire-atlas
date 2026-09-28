import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { createFlameMaterial } from './flameShader';
import { anchorFor } from './sceneConfig';
import styles from './SceneLabels.module.css';

/** FLEX-style invisible cool flame: nearly invisible, glows only in heat vision. */
export default function CoolFlame({ active, heatVision }) {
  const mesh = useRef();
  const mat = useMemo(() => createFlameMaterial(0.9), []);
  const faint = useMemo(() => [new THREE.Color('#5b3dff'), new THREE.Color('#7a5cff')], []);
  const hot = useMemo(() => [new THREE.Color('#ff3b1f'), new THREE.Color('#ffd000')], []);
  const level = useRef(0);

  useEffect(() => () => mat.dispose(), [mat]);

  useFrame((_, dt) => {
    const t = performance.now() / 1000;
    const target = active ? (heatVision ? 1.3 : 0.06) : 0;
    level.current = THREE.MathUtils.damp(level.current, target, 3, dt);
    const pulse = 0.85 + Math.sin(t * 3) * 0.15;
    mat.uniforms.uTime.value = t;
    mat.uniforms.uFlicker.value = 0.5;
    mat.uniforms.uIntensity.value = level.current * pulse;
    const pal = heatVision ? hot : faint;
    mat.uniforms.uColor.value.copy(pal[0]);
    mat.uniforms.uTipColor.value.copy(pal[1]);
    if (mesh.current) mesh.current.visible = level.current > 0.003;
  });

  const anchor = anchorFor('droplet');
  return (
    <group position={anchor}>
      <mesh ref={mesh} scale={0.42} material={mat} renderOrder={20}>
        <sphereGeometry args={[1, 40, 40]} />
      </mesh>
      {active && heatVision && (
        <Html position={[0.45, 0.35, 0]} center distanceFactor={8} className={styles.anchor} zIndexRange={[16, 0]}>
          <span className={`${styles.label} ${styles.hot}`}>Hidden cool flame!</span>
        </Html>
      )}
    </group>
  );
}
