import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import styles from './Earth.module.css';

/** "You are here" pin at the user's latitude, facing the camera. Glows green if the aurora is visible. */
export default function CityMarker({ lat, name, aurora, liveRef }) {
  const pin = useRef();
  const la = (lat * Math.PI) / 180;
  const lo = 0.55;
  const pos = [Math.cos(la) * Math.sin(lo) * 1.01, Math.sin(la) * 1.01, Math.cos(la) * Math.cos(lo) * 1.01];
  const visible = aurora !== 'no';

  useFrame(() => {
    if (!pin.current) return;
    const on = visible && liveRef.current.storm > 0.6;
    pin.current.material.color.set(on ? '#34d399' : '#ffffff');
    pin.current.scale.setScalar(1 + (on ? Math.sin(performance.now() / 200) * 0.3 : 0));
  });

  const on = visible;
  return (
    <group position={pos}>
      <mesh ref={pin}>
        <sphereGeometry args={[0.035, 16, 16]} />
        <meshBasicMaterial toneMapped={false} color={new THREE.Color('#ffffff')} />
      </mesh>
      <Html zIndexRange={[16, 0]} position={[0.08, 0.08, 0]} distanceFactor={9} style={{ pointerEvents: 'none' }}>
        <span className={`${styles.pin} ${on ? styles.pinOn : ''}`}>{name}</span>
      </Html>
    </group>
  );
}
