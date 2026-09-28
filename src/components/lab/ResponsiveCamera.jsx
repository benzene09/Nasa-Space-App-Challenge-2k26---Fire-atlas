import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';

/** Pulls the camera back on tall/narrow screens so the whole module stays in view. */
export default function ResponsiveCamera() {
  const { camera, size } = useThree();
  useEffect(() => {
    const aspect = size.width / size.height;
    const distance = aspect < 0.8 ? 11.5 : aspect < 1.2 ? 9.2 : 7.6;
    const dir = camera.position.clone().sub({ x: 0, y: 0.9, z: 0 }).normalize();
    camera.position.set(dir.x * distance, 0.9 + dir.y * distance, dir.z * distance);
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height]);
  return null;
}
